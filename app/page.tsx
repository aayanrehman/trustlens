"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Extraction, SiteResult } from "@/lib/fields";
import type { ScanEvent, Stage } from "@/lib/scan";
import { DEFAULT_QUESTIONS, type QuestionDef } from "@/lib/questions";
import { DEFAULT_THRESHOLDS, type Thresholds } from "@/lib/scoring";
import { loadActive, saveScans } from "@/lib/store";
import TopBar from "@/components/TopBar";
import ScanConsole from "@/components/ScanConsole";
import ResultsGrid from "@/components/ResultColumn";

type SiteState = { url: string; stage: Stage | "queued"; extraction?: Extraction; shell?: boolean; result?: SiteResult; reason?: string };
const parse = (s: string) => [...new Set(s.split(/[\n,\s]+/).map((x) => x.trim()).filter(Boolean))].slice(0, 5);

export default function Home() {
  const [input, setInput] = useState("");
  const [sites, setSites] = useState<SiteState[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionDef[]>(DEFAULT_QUESTIONS);
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    loadActive().then((p) => { if (p) { setQuestions(p.questions); setThresholds(p.thresholds); } });
    const sp = new URLSearchParams(window.location.search); const u = sp.get("u"); if (u) { setInput(u); if (sp.get("go")) setTimeout(() => document.querySelector<HTMLButtonElement>("form button[type=submit]")?.click(), 400); }
  }, []);

  const urls = useMemo(() => parse(input), [input]);
  const mode = urls.length >= 2 ? "COMPARE" : "SINGLE SCAN";
  const tokens = sites.reduce((n, s) => n + (s.result?.usage?.input_tokens ?? 0), 0);
  const answers = sites.reduce((n, s) => n + Object.keys(s.result?.answers ?? {}).length, 0);
  const done = sites.length > 0 && sites.every((s) => s.result);

  const patch = (url: string, p: Partial<SiteState>) => setSites((prev) => prev.map((s) => (s.url === url ? { ...s, ...p } : s)));

  async function scan() {
    if (!urls.length || running) return;
    setError(null); setRunning(true);
    setSites(urls.map((url) => ({ url, stage: "queued" })));
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls, questions }), signal: abort.current.signal });
      if (!res.ok || !res.body) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? `HTTP ${res.status}`); }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line) as ScanEvent;
          if (e.type === "stage") patch(e.url, { stage: e.stage });
          else if (e.type === "extraction") patch(e.url, { extraction: e.extraction, shell: e.client_only_shell });
          else if (e.type === "result") { patch(e.url, { result: e.result, reason: e.result.reason, extraction: e.result.extraction }); }
          else if (e.type === "psi") setSites((prev) => prev.map((s) => s.url === e.url && s.result?.extraction ? { ...s, extraction: { ...s.extraction!, page_speed_score: e.page_speed_score }, result: { ...s.result, extraction: { ...s.result.extraction, page_speed_score: e.page_speed_score } } } : s));
        }
      }
    } catch (e) { if ((e as Error).name !== "AbortError") setError((e as Error).message); }
    finally { setRunning(false); setSites((prev) => prev.map((s) => s.result?.extraction && s.result.extraction.page_speed_score === undefined ? { ...s, result: { ...s.result, extraction: { ...s.result.extraction, page_speed_score: null } } } : s)); }
  }
  // Persist final results (with late PageSpeed scores) once everything has landed.
  useEffect(() => { if (done && !running) saveScans(sites.map((s) => s.result!)); }, [done, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const cols = Math.min(5, Math.max(1, sites.length));
  return (
    <main>
      <TopBar queued={sites.length} answers={answers} tokens={tokens} active={running} />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {sites.length === 0 && (
          <div className="max-w-3xl rise">
            <div className="eyebrow">For education consultants · SEO · AI search · Trust · Authority · Discoverability</div>
            <h1 className="display text-5xl sm:text-7xl mt-3 leading-[0.95]">Does your practice read as an <span className="text-teal">authority</span> — to parents, and to AI?</h1>
            <p className="mt-5 text-lg text-ink-2 max-w-xl">Paste one URL for a scan, or two to five for a side-by-side against other consultants. Code extracts the signals; TypeSafe&rsquo;s Jev judges the meaning. Fractions of a cent per site.</p>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); scan(); }} className={`mt-8 ${sites.length ? "" : "max-w-3xl"}`}>
          <label className="eyebrow" htmlFor="urls">Website URLs · one per line or comma-separated · mode: <span className="text-ink">{mode}</span></label>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <textarea id="urls" value={input} onChange={(e) => setInput(e.target.value)} rows={sites.length ? 1 : 3} placeholder={"evergreenconsulting.co\nkeystoneprep.com\nsolomonadmissions.com"} className="flex-1 border border-ink bg-white p-3 mono text-sm outline-none focus:ring-2 focus:ring-accent resize-y" />
            <button type="submit" disabled={!urls.length || running} className="bg-ink text-paper px-6 py-3 text-sm tracking-wide hover:bg-accent disabled:opacity-40 disabled:hover:bg-ink">
              {running ? "Scanning…" : urls.length >= 2 ? `Compare ${urls.length} sites` : "Scan"}
            </button>
            {running && <button type="button" onClick={() => abort.current?.abort()} className="border rule px-4 py-3 text-sm">Stop</button>}
          </div>
          {error && <p className="mt-2 text-sm text-accent">{error}</p>}
        </form>

        {sites.length > 0 && !done && (
          <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 3)}, minmax(0, 1fr))` }}>
            {sites.map((s) => <ScanConsole key={s.url} url={s.url} stage={s.stage} extraction={s.extraction} shell={s.shell} reason={s.reason} />)}
          </div>
        )}

        {done && (
          <div className="mt-8">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="display text-3xl">{mode === "COMPARE" ? "Side by side" : "Your score"}</h2>
              <span className="eyebrow">Weights & cutoffs: <a href="/studio" className="underline hover:text-accent">Classifier Studio</a></span>
            </div>
            <ResultsGrid results={sites.map((s) => s.result!)} thresholds={thresholds} questions={questions} />
          </div>
        )}
      </section>
    </main>
  );
}
