import type { Extraction, SiteResult } from "./fields";
import { fetchAndExtract } from "./extract";
import { pageSpeed } from "./pagespeed";
import { askJev } from "./jev";
import { DEFAULT_QUESTIONS, type QuestionDef } from "./questions";
import { scoreSite, type Scored } from "./scoring";

export type Stage = "fetching" | "extracting" | "scoring" | "done" | "blocked" | "error";
export type ScanEvent =
  | { type: "stage"; url: string; stage: Stage }
  | { type: "extraction"; url: string; extraction: Extraction; pages: string[]; client_only_shell: boolean }
  | { type: "result"; url: string; result: SiteResult; scored?: Scored }
  | { type: "psi"; url: string; page_speed_score: number | null; error?: string; scored?: Scored };

/** Scan one site. Emits stages, the extraction, the Jev result, then PageSpeed when it lands (it is the slow one). */
export async function scanSite(url: string, qs: QuestionDef[] = DEFAULT_QUESTIONS, emit: (e: ScanEvent) => void = () => {}): Promise<SiteResult> {
  const scanned_at = new Date().toISOString();
  const norm = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  let host = url;
  try { host = new URL(norm).hostname.replace(/^www\./, ""); } catch {}
  emit({ type: "stage", url, stage: "fetching" });
  const psi = pageSpeed(norm);
  const fetched = await fetchAndExtract(norm);
  if (fetched.status !== "ok") {
    psi.catch(() => {});
    const result: SiteResult = { url, host, pages_fetched: [], status: fetched.status, reason: fetched.reason, scanned_at };
    emit({ type: "stage", url, stage: fetched.status }); emit({ type: "result", url, result });
    return result;
  }
  emit({ type: "stage", url, stage: "extracting" });
  const extraction: Extraction = { ...fetched.extraction, page_speed_score: undefined };
  emit({ type: "extraction", url, extraction, pages: fetched.pages, client_only_shell: fetched.client_only_shell });
  emit({ type: "stage", url, stage: "scoring" });
  let result: SiteResult;
  try {
    const { answers, usage, model } = await askJev(extraction, qs);
    result = { url, host, pages_fetched: fetched.pages, client_only_shell: fetched.client_only_shell, status: "ok", extraction, answers, usage, model, scanned_at };
    emit({ type: "stage", url, stage: "done" });
  } catch (e) {
    result = { url, host, pages_fetched: fetched.pages, client_only_shell: fetched.client_only_shell, status: "error", reason: `Jev call failed: ${(e as Error).message}`, extraction, scanned_at };
    emit({ type: "stage", url, stage: "error" });
  }
  const scored = () => (result.answers ? scoreSite(result.extraction!, result.answers, undefined, qs) : undefined);
  emit({ type: "result", url, result, scored: scored() });
  const ps = await psi;
  result.extraction!.page_speed_score = ps.page_speed_score;
  emit({ type: "psi", url, page_speed_score: ps.page_speed_score, error: ps.error, scored: scored() });
  return result;
}

export function parseUrls(input: string) {
  return [...new Set(input.split(/[\n,\s]+/).map((s) => s.trim()).filter(Boolean))].slice(0, 5);
}
