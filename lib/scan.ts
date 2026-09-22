import type { Extraction, SiteResult } from "./fields";
import { fetchAndExtract } from "./extract";
import { pageSpeed } from "./pagespeed";
import { askJev } from "./jev";
import { NICHE_QUESTION, questionsFor, type QuestionDef } from "./questions";
import { nicheOf } from "./niches";
import { scoreSite, type Scored } from "./scoring";

export type Stage = "fetching" | "extracting" | "detecting" | "scoring" | "done" | "blocked" | "error";
export type ScanEvent =
  | { type: "stage"; url: string; stage: Stage }
  | { type: "extraction"; url: string; extraction: Extraction; pages: string[]; client_only_shell: boolean }
  | { type: "niche"; url: string; niche: { key: string; label: string; confidence: number } }
  | { type: "result"; url: string; result: SiteResult; scored?: Scored; scanId?: string }
  | { type: "psi"; url: string; page_speed_score: number | null; error?: string; scored?: Scored };

/** Scan one site. Emits stages, the extraction, the Jev result, then PageSpeed when it lands (it is the slow one). */
export async function scanSite(url: string, qs: QuestionDef[] | undefined, emit: (e: ScanEvent) => void | Promise<void> = () => {}): Promise<SiteResult> {
  const scanned_at = new Date().toISOString();
  const norm = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  let host = url;
  try { host = new URL(norm).hostname.replace(/^www\./, ""); } catch {}
  emit({ type: "stage", url, stage: "fetching" });
  const t0 = Date.now();
  const psi = pageSpeed(norm);
  const fetched = await fetchAndExtract(norm);
  const fetchMs = Date.now() - t0;
  if (fetched.status !== "ok") {
    psi.catch(() => {});
    const result: SiteResult = { url, host, pages_fetched: [], status: fetched.status, reason: fetched.reason, scanned_at };
    await emit({ type: "stage", url, stage: fetched.status });
    await emit({ type: "result", url, result }); // await: the route persists on this event, and the stream closes when we return
    return result;
  }
  emit({ type: "stage", url, stage: "extracting" });
  const extraction: Extraction = { ...fetched.extraction, page_speed_score: undefined };
  emit({ type: "extraction", url, extraction, pages: fetched.pages, client_only_shell: fetched.client_only_shell });
  let result: SiteResult;
  try {
    const t1 = Date.now();
    // 1. Which kind of business is this? One tiny Jev call; its answer picks the wording of everything after.
    emit({ type: "stage", url, stage: "detecting" });
    const det = await askJev(extraction, [NICHE_QUESTION]);
    const na = det.answers.niche;
    const n = nicheOf(na?.type === "choice" ? na.choice : undefined);
    const niche = { key: n.key, label: n.label, confidence: na?.type === "choice" ? na.confidence : 0 };
    emit({ type: "niche", url, niche });
    // 2. The four scoring questions, phrased for that niche (unless the Studio supplied its own).
    emit({ type: "stage", url, stage: "scoring" });
    const { answers, usage: u2, model } = await askJev(extraction, qs ?? questionsFor(n));
    const usage = { input_tokens: det.usage.input_tokens + u2.input_tokens, output_tokens: det.usage.output_tokens + u2.output_tokens };
    result = { url, host, pages_fetched: fetched.pages, client_only_shell: fetched.client_only_shell, status: "ok", extraction, answers, usage, model, scanned_at, niche, latency_ms: { fetch: fetchMs, jev: Date.now() - t1 } };
    emit({ type: "stage", url, stage: "done" });
  } catch (e) {
    result = { url, host, pages_fetched: fetched.pages, client_only_shell: fetched.client_only_shell, status: "error", reason: `Scoring failed: ${(e as Error).message}`, extraction, scanned_at };
    emit({ type: "stage", url, stage: "error" });
  }
  const scored = () => (result.answers ? scoreSite(result.extraction!, result.answers, undefined, qs ?? questionsFor(nicheOf(result.niche?.key))) : undefined);
  await emit({ type: "result", url, result, scored: scored() });
  const ps = await psi;
  result.extraction!.page_speed_score = ps.page_speed_score;
  emit({ type: "psi", url, page_speed_score: ps.page_speed_score, error: ps.error, scored: scored() });
  return result;
}

export function parseUrls(input: string) {
  return [...new Set(input.split(/[\n,\s]+/).map((s) => s.trim()).filter(Boolean))].slice(0, 5);
}
