"use client";
import { get, set } from "idb-keyval";
import type { SiteResult } from "./fields";
import type { QuestionDef } from "./questions";
import type { Thresholds } from "./scoring";

const safe = async <T,>(fn: () => Promise<T | undefined>, fallback: T): Promise<T> => { try { return (await fn()) ?? fallback; } catch { return fallback; } };

export const loadScans = () => safe<SiteResult[]>(() => get("scans"), []);
export async function saveScans(results: SiteResult[]) {
  const prev = await loadScans();
  const merged = [...results.filter((r) => r.status === "ok"), ...prev.filter((p) => !results.some((r) => r.url === p.url))].slice(0, 25);
  await safe(() => set("scans", merged), undefined);
}
export type Preset = { questions: QuestionDef[]; thresholds: Thresholds };
export const loadPresets = () => safe<Record<string, Preset>>(() => get("presets"), {});
export const savePresets = (p: Record<string, Preset>) => safe(() => set("presets", p), undefined);
export const loadActive = () => safe<Preset | null>(() => get("active"), null);
export const saveActive = (p: Preset) => safe(() => set("active", p), undefined);
