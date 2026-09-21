"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { SiteResult, JevAnswer } from "@/lib/fields";
import { scoreSite, radarValues, CATEGORY_ORDER, CATEGORY_LABELS, humanize, type Thresholds, type Category } from "@/lib/scoring";
import ShareWidget from "./ShareWidget";
import type { QuestionDef } from "@/lib/questions";
import { buildState } from "@/lib/jev";
import { encodeShare, slugify } from "@/lib/share";
import Radar from "./Radar";

const GRADE_COLOR: Record<string, string> = { A: "text-teal", B: "text-teal", C: "text-ink", D: "text-scan", F: "text-scan" };

function AnswerRow({ id, a, q }: { id: string; a: JevAnswer; q?: QuestionDef }) {
  const rows: [string, number][] = a.type === "noul" ? [["yes", a.noul], ["no", 1 - a.noul]] : a.type === "choice" ? Object.entries(a.probabilities) : Object.entries(a.probabilities).map(([lvl, p]) => [q?.options[Number(lvl)]?.key ?? lvl, p]);
  const headline = a.type === "noul" ? `${Math.round(a.noul * 100)}% yes` : a.type === "choice" ? humanize(a.choice) : `${a.score.toFixed(2)} / ${Math.max(1, Object.keys(a.legend).length - 1)} → ${humanize(q?.options[Math.round(a.score)]?.key ?? "")}`;
  return (
    <div className="py-2 border-t rule">
      <div className="flex justify-between gap-2 text-xs"><span className="mono">{id}</span><span className="eyebrow">{a.type}{"confidence" in a ? ` · conf ${a.confidence.toFixed(2)}` : ""}</span></div>
      <div className="text-sm mt-0.5">{headline}</div>
      <div className="mt-1 space-y-0.5">
        {rows.map(([k, p]) => (
          <div key={k} className="flex items-center gap-2 text-[11px]"><span className="w-40 truncate text-ink-2">{humanize(k)}</span><span className="flex-1 h-1.5 bg-rule/60"><span className="block h-full bg-teal grow" style={{ width: `${Math.round(p * 100)}%` }} /></span><span className="mono w-8 text-right">{Math.round(p * 100)}</span></div>
        ))}
      </div>
    </div>
  );
}

const cell = "border rule bg-white/40 px-4 py-3 min-w-0";

/**
 * Results as ONE row-major grid: header row, four category rows, grade row. With N sites the cells
 * of each row sit side by side, so SEO lines up with SEO and the grade with the grade regardless of
 * how many issues each site has. Rows reveal one at a time.
 */
export default function ResultsGrid({ results, thresholds, questions }: { results: SiteResult[]; thresholds: Thresholds; questions: QuestionDef[] }) {
  const n = Math.max(1, results.length);
  const [step, setStep] = useState(0); // 0..6: five categories then the grade
  const [sharing, setSharing] = useState<{ host: string; grade: string; overall: number; auditPath: string; share: string } | null>(null);
  const key = results.map((r) => r.url + r.status).join("|");
  useEffect(() => { setStep(0); const t = setInterval(() => setStep((s) => (s >= 6 ? (clearInterval(t), s) : s + 1)), 500); return () => clearInterval(t); }, [key]);

  const scored = results.map((r) => (r.status === "ok" && r.extraction && r.answers ? scoreSite(r.extraction, r.answers, thresholds, questions) : null));
  const rows: ReactNode[][] = [];

  rows.push(results.map((r) => (
    <div key={"h" + r.url} className={`${cell} rise`}>
      <div className="flex items-baseline justify-between gap-2"><span className="mono text-sm truncate">{r.host}</span><span className="eyebrow whitespace-nowrap">{r.status === "ok" ? `${r.pages_fetched.length} page${r.pages_fetched.length === 1 ? "" : "s"}` : r.status}</span></div>
      {r.client_only_shell && <p className="mt-2 text-xs border border-scan p-2"><span className="eyebrow text-scan">crawler-invisible</span> Ships an empty HTML shell; most AI crawlers see nothing.</p>}
      {r.status !== "ok" && <p className="mt-2 text-sm text-scan">{r.status === "blocked" ? "Skipped: " : "Failed: "}{r.reason}</p>}
    </div>
  )));

  CATEGORY_ORDER.forEach((c: Category, i) => rows.push(results.map((r, j) => {
    const s = scored[j];
    if (step <= i) return <div key={c + r.url} className={cell} />;
    if (!s) return <div key={c + r.url} className={`${cell} text-xs text-ink-2 rise`}>—</div>;
    return (
      <div key={c + r.url} className={`${cell} rise`}>
        <div className="flex items-baseline justify-between"><span className="eyebrow">{CATEGORY_LABELS[c]}</span><span className="mono text-lg">{s.categories[c].score}</span></div>
        <div className="h-1 bg-rule/60 mt-1"><div className="h-full bg-ink grow" style={{ width: `${s.categories[c].score}%` }} /></div>
        {s.categories[c].issues.length ? <ul className="mt-2 space-y-1 text-xs text-ink-2 list-disc pl-4">{s.categories[c].issues.map((m) => <li key={m}>{m}</li>)}</ul> : <div className="mt-1 text-xs text-ok">No issues flagged.</div>}
      </div>
    );
  })));

  rows.push(results.map((r, j) => {
    const s = scored[j];
    if (step < 6) return <div key={"g" + r.url} className={cell} />;
    if (!s || !r.extraction || !r.answers) return <div key={"g" + r.url} className={`${cell} rise`}><div className="display text-6xl text-scan">{r.status === "blocked" ? "Skipped" : "—"}</div></div>;
    const values = radarValues(s);
    const share = encodeShare({ h: r.host, g: s.grade, o: s.overall, s: values, d: r.scanned_at.slice(0, 10) });
    const auditPath = `/audit/${slugify(r.host)}?d=${share}`;
    const state = buildState(r.extraction, questions);
    const auth = r.answers.authority_positioning;
    return (
      <div key={"g" + r.url} className={`${cell} rise`}>
        <div className="flex items-center gap-4">
          <div className={`display leading-none ${n >= 4 ? "text-6xl" : "text-8xl"} ${GRADE_COLOR[s.grade]}`}>{s.grade}</div>
          <div className="min-w-0">
            <div className="eyebrow">Overall</div>
            <div className="mono text-3xl">{s.overall}<span className="text-base text-ink-2">/100</span></div>
            {auth?.type === "choice" && <div className="eyebrow mt-1 truncate">{humanize(auth.choice)}</div>}
          </div>
        </div>
        <div className="-mx-2"><Radar values={values} size={n >= 4 ? 180 : 230} /></div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button onClick={() => setSharing({ host: r.host, grade: s.grade, overall: s.overall, auditPath, share })} className="bg-ink text-paper px-3 py-1.5 hover:bg-accent">Share my score</button>
          <Link href={auditPath} className="border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper">Public page →</Link>
        </div>
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer eyebrow hover:text-accent">Latency, cost & what Jev saw</summary>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 mono text-[11px]">
            <dt className="text-ink-2">fetch + extract</dt><dd>{r.latency_ms ? `${r.latency_ms.fetch} ms` : "—"}</dd>
            <dt className="text-ink-2">Jev (4 questions, 1 call)</dt><dd>{r.latency_ms ? `${r.latency_ms.jev} ms` : "—"}</dd>
            <dt className="text-ink-2">input tokens</dt><dd>{r.usage?.input_tokens.toLocaleString()}</dd>
            <dt className="text-ink-2">rate</dt><dd>$0.042 / M tokens</dd>
            <dt className="text-ink-2">cost of this site</dt><dd className="text-ink font-medium">${(((r.usage?.input_tokens ?? 0) * 0.042) / 1e6).toFixed(5)}</dd>
          </dl>
          <p className="mt-2 text-ink-2">Only these {Object.keys(state).length} contract fields were sent — never HTML, never page text. Model: <span className="mono">{r.model}</span>.</p>
          <pre className="mt-2 mono text-[10px] leading-snug whitespace-pre-wrap break-words bg-white/60 border rule p-2 max-h-56 overflow-auto">{JSON.stringify(state, null, 1)}</pre>
          <div className="mt-2">{Object.entries(r.answers).map(([id, a]) => <AnswerRow key={id} id={id} a={a} q={questions.find((q) => q.id === id)} />)}</div>
        </details>
      </div>
    );
  }));

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      {sharing && <ShareWidget {...sharing} onClose={() => setSharing(null)} />}
      <div className="grid gap-x-3 gap-y-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(${n > 2 ? 280 : 360}px, 1fr))` }}>
        {rows.flat()}
      </div>
    </div>
  );
}
