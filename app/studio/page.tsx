"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FIELDS, FIELD_DESCRIPTIONS, type FieldName, type JevAnswer, type SiteResult } from "@/lib/fields";
import { DEFAULT_QUESTIONS, validateQuestions, type QuestionDef } from "@/lib/questions";
import { DEFAULT_THRESHOLDS, scoreSite, humanize, type Thresholds } from "@/lib/scoring";
import { loadActive, loadPresets, loadScans, saveActive, savePresets, type Preset } from "@/lib/store";

const headline = (a: JevAnswer | undefined, q?: QuestionDef) => !a ? "—" : a.type === "noul" ? `${Math.round(a.noul * 100)}% yes` : a.type === "choice" ? `${humanize(a.choice)} (${a.confidence.toFixed(2)})` : `${a.score.toFixed(2)} → ${humanize(q?.options[Math.round(a.score)]?.key ?? "")} (${a.confidence.toFixed(2)})`;

function Slider({ label, value, min, max, step = 1, onChange, suffix = "" }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; suffix?: string }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-44 eyebrow">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
      <span className="mono w-14 text-right">{value}{suffix}</span>
    </label>
  );
}

export default function Studio() {
  const [qs, setQs] = useState<QuestionDef[]>(DEFAULT_QUESTIONS);
  const [t, setT] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [scans, setScans] = useState<SiteResult[]>([]);
  const [after, setAfter] = useState<Record<string, Record<string, JevAnswer>>>({});
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [presets, setPresets] = useState<Record<string, Preset>>({});
  const [presetName, setPresetName] = useState("");
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadActive().then((p) => { if (p) { setQs(p.questions); setT(p.thresholds); } }); loadPresets().then(setPresets);
    // Last 5 scans: from Convex (all devices) when configured, else this browser's IndexedDB.
    fetch("/api/recent").then((r) => (r.ok ? r.json() : [])).then((rows: SiteResult[]) => rows.length ? setScans(rows.slice(0, 5)) : loadScans().then((s) => setScans(s.slice(0, 5)))).catch(() => loadScans().then((s) => setScans(s.slice(0, 5))));
  }, []);
  const errors = useMemo(() => validateQuestions(qs), [qs]);

  const upd = (i: number, p: Partial<QuestionDef>) => setQs((prev) => prev.map((q, j) => (j === i ? { ...q, ...p } : q)));
  const updOpt = (i: number, k: number, p: Partial<QuestionDef["options"][number]>) => upd(i, { options: qs[i].options.map((o, j) => (j === k ? { ...o, ...p } : o)) });
  const move = (i: number, k: number, dir: -1 | 1) => { const o = [...qs[i].options]; const j = k + dir; if (j < 0 || j >= o.length) return; [o[k], o[j]] = [o[j], o[k]]; upd(i, { options: o }); };
  const convert = (i: number, type: QuestionDef["type"]) => {
    const q = qs[i]; let options = q.options;
    if (type === "noul") options = [{ key: "true", description: q.options[0]?.description ?? "Yes" }, { key: "false", description: q.options[1]?.description ?? "No" }];
    else if (q.type === "noul") options = [{ key: "no", description: q.options[1]?.description ?? "" }, { key: "yes", description: q.options[0]?.description ?? "" }];
    upd(i, { type, options });
  };

  async function apply() { await saveActive({ questions: qs, thresholds: t }); setMsg("Applied. New scans use these questions and cutoffs."); }
  async function test() {
    if (!scans.length) return setMsg("No cached scans yet — run a scan first.");
    setTesting(true); setMsg(null);
    try {
      const res = await fetch("/api/jev", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questions: qs, extractions: scans.map((s) => ({ url: s.url, extraction: s.extraction })) }) });
      const j = await res.json();
      if (!res.ok) throw new Error([j.error, ...(j.errors ?? [])].join(" · "));
      const next: typeof after = {}; let tokens = 0;
      for (const r of j.results) { if (r.answers) { next[r.url] = r.answers; tokens += r.usage?.input_tokens ?? 0; } else next[r.url] = {}; }
      setAfter(next); setMsg(`Re-scored ${j.results.length} cached sites · ${tokens.toLocaleString()} tokens · $${((tokens * 0.042) / 1e6).toFixed(4)} · zero new fetches`);
    } catch (e) { setMsg((e as Error).message); } finally { setTesting(false); }
  }
  async function savePreset() { if (!presetName.trim()) return; const p = { ...presets, [presetName.trim()]: { questions: qs, thresholds: t } }; setPresets(p); await savePresets(p); setMsg(`Saved preset "${presetName.trim()}".`); }
  function loadPreset(n: string) { const p = presets[n]; if (p) { setQs(p.questions); setT(p.thresholds); setMsg(`Loaded "${n}".`); } }
  function exportJson() { const blob = new Blob([JSON.stringify({ questions: qs, thresholds: t }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `trustlens-preset-${presetName || "custom"}.json`; a.click(); }
  async function importJson(f: File) { try { const p = JSON.parse(await f.text()); if (Array.isArray(p.questions)) setQs(p.questions); if (p.thresholds) setT(p.thresholds); setMsg(`Imported ${f.name}.`); } catch { setMsg("Not a valid preset file."); } }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="eyebrow">Classifier Studio</div>
        <h1 className="display text-4xl mt-2">Edit the questions Jev is asked.</h1>
        <p className="text-ink-2 mt-2 text-sm max-w-2xl">Each question may read only fields from the contract. Question IDs are for code; the model sees only instructions and the option descriptions. Score levels are ordered low → high.</p>
        {errors.length > 0 && <div className="mt-4 border border-accent p-3 text-sm text-accent">{errors.map((e) => <div key={e}>⚠ {e}</div>)}</div>}

        <div className="mt-6 space-y-5">
          {qs.map((q, i) => (
            <section key={i} className="border rule p-4 bg-white/50">
              <div className="flex flex-wrap items-center gap-2">
                <input value={q.id} onChange={(e) => upd(i, { id: e.target.value })} className="mono text-sm border-b border-ink bg-transparent px-1 w-56" aria-label="question id" />
                <select value={q.type} onChange={(e) => convert(i, e.target.value as QuestionDef["type"])} className="border rule px-2 py-1 text-sm bg-white">
                  <option value="score">Score (ordered levels)</option><option value="choice">Choice (one of a set)</option><option value="noul">Noul (yes / no probability)</option>
                </select>
                <button onClick={() => setQs(qs.filter((_, j) => j !== i))} className="ml-auto text-xs text-ink-2 hover:text-accent">remove question</button>
              </div>
              <label className="block mt-3"><span className="eyebrow">Instructions</span>
                <textarea value={q.instructions} onChange={(e) => upd(i, { instructions: e.target.value })} rows={4} className="mt-1 w-full border rule bg-white p-2 text-sm" />
              </label>
              <div className="mt-3"><span className="eyebrow">Reads fields</span>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {FIELDS.map((f) => (
                    <label key={f} className="text-xs mono flex items-center gap-1" title={FIELD_DESCRIPTIONS[f]}>
                      <input type="checkbox" checked={q.reads.includes(f as FieldName)} onChange={(e) => upd(i, { reads: e.target.checked ? [...q.reads, f as FieldName] : q.reads.filter((x) => x !== f) })} />{f}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-3"><span className="eyebrow">{q.type === "score" ? "Levels (low → high)" : q.type === "choice" ? "Options" : "Criteria (yes / no)"}</span>
                <div className="mt-1 space-y-2">
                  {q.options.map((o, k) => (
                    <div key={k} className="flex gap-2 items-start">
                      <span className="mono text-xs w-5 pt-2 text-ink-2">{q.type === "score" ? k : ""}</span>
                      <input value={o.key} disabled={q.type === "noul"} onChange={(e) => updOpt(i, k, { key: e.target.value })} className="mono text-xs border rule bg-white px-2 py-1.5 w-56 disabled:opacity-60" aria-label="option key" />
                      <textarea value={o.description} onChange={(e) => updOpt(i, k, { description: e.target.value })} rows={2} className="flex-1 border rule bg-white p-1.5 text-xs" aria-label="option description" />
                      {q.type !== "noul" && <div className="flex flex-col text-xs"><button onClick={() => move(i, k, -1)}>↑</button><button onClick={() => move(i, k, 1)}>↓</button><button onClick={() => upd(i, { options: q.options.filter((_, j) => j !== k) })} className="text-accent">×</button></div>}
                    </div>
                  ))}
                  {q.type !== "noul" && <button onClick={() => upd(i, { options: [...q.options, { key: `option_${q.options.length + 1}`, description: "" }] })} className="text-xs underline hover:text-accent">+ add {q.type === "score" ? "level" : "option"}</button>}
                </div>
              </div>
            </section>
          ))}
          <button onClick={() => setQs([...qs, { id: `new_question_${qs.length + 1}`, type: "noul", instructions: "", reads: [], options: [{ key: "true", description: "" }, { key: "false", description: "" }] }])} className="text-sm underline hover:text-accent">+ add question</button>
        </div>

        <div className="mt-8 border-t rule pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={test} disabled={testing || errors.length > 0} className="bg-ink text-paper px-4 py-2 text-sm hover:bg-accent disabled:opacity-40">{testing ? "Asking Jev…" : `Test on last ${scans.length || 5} scanned sites`}</button>
            <button onClick={apply} disabled={errors.length > 0} className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper disabled:opacity-40">Apply to new scans</button>
            <button onClick={() => { setQs(DEFAULT_QUESTIONS); setT(DEFAULT_THRESHOLDS); setMsg("Reset to defaults."); }} className="text-sm underline text-ink-2">reset</button>
            {msg && <span className="text-sm text-ink-2">{msg}</span>}
          </div>
          {scans.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="text-left"><th className="eyebrow py-2 pr-3">site</th><th className="eyebrow py-2 pr-3">grade now</th>{qs.map((q) => <th key={q.id} className="eyebrow py-2 pr-3">{q.id}</th>)}</tr></thead>
                <tbody>
                  {scans.map((s) => {
                    const before = s.answers ?? {}, aft = after[s.url];
                    const gb = s.extraction ? scoreSite(s.extraction, before, t, qs) : null;
                    const ga = s.extraction && aft ? scoreSite(s.extraction, aft, t, qs) : null;
                    return (
                      <tr key={s.url} className="border-t rule align-top">
                        <td className="py-2 pr-3 mono">{s.host}</td>
                        <td className="py-2 pr-3 mono">{gb?.grade} {gb?.overall}{ga && <span className="text-accent"> → {ga.grade} {ga.overall}</span>}</td>
                        {qs.map((q) => <td key={q.id} className="py-2 pr-3"><div className="text-ink-2">{headline(before[q.id], q)}</div>{aft && <div className="text-accent">→ {headline(aft[q.id], q)}</div>}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[11px] text-ink-2 mt-2">Grey = cached answer from the original scan. Orange = answer after re-running your edited questions on the same cached extraction. Grades recompute instantly from the sliders; only "Test" calls Jev.</p>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-8 lg:sticky lg:top-6 self-start">
        <section className="border rule p-4 bg-white/50">
          <div className="eyebrow">Thresholds · recompute instantly, no Jev calls</div>
          <div className="mt-3 space-y-2">
            <div className="eyebrow !text-ink mt-2">Category weights</div>
            {(["seo", "geo", "trust", "authority", "discoverability"] as const).map((k) => <Slider key={k} label={k === "geo" ? "ai search" : k} value={t.weights[k] ?? DEFAULT_THRESHOLDS.weights[k]} min={0} max={100} onChange={(n) => setT({ ...t, weights: { ...t.weights, [k]: n } })} />)}
            <div className="eyebrow !text-ink mt-3">Grade cutoffs (min overall)</div>
            {(["A", "B", "C", "D"] as const).map((g) => <Slider key={g} label={`grade ${g}`} value={t.grade[g]} min={0} max={100} onChange={(n) => setT({ ...t, grade: { ...t.grade, [g]: n } })} />)}
            <div className="eyebrow !text-ink mt-3">Rules</div>
            <Slider label="discretion = yes at" value={t.discretion_yes} min={0} max={1} step={0.05} onChange={(n) => setT({ ...t, discretion_yes: n })} />
            <Slider label="content depth (words)" value={t.min_words} min={100} max={3000} step={50} onChange={(n) => setT({ ...t, min_words: n })} />
          </div>
        </section>
        <section className="border rule p-4 bg-white/50">
          <div className="eyebrow">Presets</div>
          <div className="mt-2 flex gap-2"><input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="preset name" className="flex-1 border rule bg-white px-2 py-1 text-sm" /><button onClick={savePreset} className="border border-ink px-3 text-sm">Save</button></div>
          <div className="mt-2 flex flex-wrap gap-1">{Object.keys(presets).map((n) => <button key={n} onClick={() => loadPreset(n)} className="border rule px-2 py-0.5 text-xs hover:border-ink">{n}</button>)}{!Object.keys(presets).length && <span className="text-xs text-ink-2">none saved yet</span>}</div>
          <div className="mt-3 flex gap-3 text-xs"><button onClick={exportJson} className="underline">Download JSON</button><button onClick={() => file.current?.click()} className="underline">Import JSON</button><input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} /></div>
        </section>
        <section className="border rule p-4 text-xs text-ink-2">
          <div className="eyebrow">The contract</div>
          <p className="mt-1">Jev may read only these {FIELDS.length} fields, computed in code. Defined once in <span className="mono">lib/contract.schema.json</span>.</p>
          <ul className="mt-2 space-y-1">{FIELDS.map((f) => <li key={f}><span className="mono text-ink">{f}</span> — {FIELD_DESCRIPTIONS[f] || "raw extracted value"}</li>)}</ul>
        </section>
      </aside>
    </main>
  );
}
