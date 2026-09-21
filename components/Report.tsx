"use client";
import { useState } from "react";
import type { Extraction, JevAnswer } from "@/lib/fields";
import { buildReport, jsonLd } from "@/lib/report";
import { CATEGORY_LABELS } from "@/lib/scoring";
import EmailGate from "./EmailGate";

const AGENCY = process.env.NEXT_PUBLIC_AGENCY_URL || "https://waterfallgrowth.com";
const FREE = 3;

export default function Report({ host, scanId, grade, extraction, answers, shell, nicheKey }: { host: string; scanId?: string; grade?: string; extraction: Extraction; answers: Record<string, JevAnswer>; shell?: boolean; nicheKey?: string }) {
  const [open, setOpen] = useState(false);
  const { actions, now, after, niche } = buildReport(extraction, answers, host, shell, nicheKey);
  const shown = open ? actions : actions.slice(0, FREE);
  const gain = after.overall - now.overall;
  return (
    <section id="report" className="mt-10 border-t rule pt-8">
      <div className="eyebrow">Your fix-it report · {niche.label} · {actions.length} actions</div>
      <h2 className="display text-3xl mt-1">How to raise this score.</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 max-w-lg">
        <div className="border rule p-3"><div className="eyebrow">Now</div><div className="display text-4xl">{now.grade}<span className="mono text-base text-ink-2 ml-1">{now.overall}</span></div></div>
        <div className="border border-teal p-3"><div className="eyebrow">All fixes</div><div className="display text-4xl text-teal">+{gain}<span className="mono text-base text-ink-2 ml-1">pts</span></div></div>
        <div className="border border-accent p-3"><div className="eyebrow">New score</div><div className="display text-4xl text-accent">{after.grade}<span className="mono text-base text-ink-2 ml-1">{after.overall}</span></div></div>
      </div>
      <ol className="mt-5 space-y-4">
        {shown.map((a, i) => (
          <li key={a.title} className="border rule bg-white/50 p-4 rise flex gap-4" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="shrink-0 w-16 text-right"><div className={`display text-3xl leading-none ${a.prerequisite ? "text-scan" : "text-teal"}`}>{a.prerequisite ? "!" : `+${a.points}`}</div><div className="eyebrow">{a.prerequisite ? "first" : "pts"}</div></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="eyebrow">{CATEGORY_LABELS[a.category]}</span><span className="eyebrow">{"●".repeat(a.impact)}{"○".repeat(3 - a.impact)} impact</span><span className="eyebrow">{a.effort}</span></div>
              <h3 className="text-lg mt-1">{a.title}</h3>
              <p className="text-sm text-ink-2 mt-1"><span className="text-ink">Why:</span> {a.why}</p>
              <p className="text-sm mt-1"><span className="text-ink-2">How:</span> {a.how}</p>
            </div>
          </li>
        ))}
      </ol>
      {!open && actions.length > FREE && (
        <div className="mt-5 border border-ink p-4">
          <div className="eyebrow">{actions.length - FREE} more actions + the paste-in schema snippet</div>
          <p className="text-sm mt-1 mb-3">Enter your email and the rest unlocks here. We&rsquo;ll also send occasional notes on getting found by {niche.audience} and by AI — unsubscribe any time.</p>
          <EmailGate host={host} scanId={scanId} grade={grade} source="report" onUnlock={() => setOpen(true)} />
        </div>
      )}
      {open && (
        <div className="mt-6">
          <p className="text-sm text-ink-2">Do everything above and the projected score is <span className="text-ink font-medium">{after.overall}/100 ({after.grade})</span>. Points are simulated by re-running the same scoring with each fix applied — Jev is not called again.</p>
          <div className="eyebrow mt-6">Paste-in structured data for a {niche.label.toLowerCase()} (fill the [brackets])</div>
          <pre className="mt-2 mono text-[11px] leading-snug whitespace-pre-wrap break-words bg-white/70 border rule p-3 max-h-80 overflow-auto">{`<script type="application/ld+json">\n${jsonLd(host, extraction, nicheKey)}\n</script>`}</pre>
          <div className="mt-6 border border-accent p-4">
            <div className="eyebrow">Want it done for you?</div>
            <p className="text-sm mt-1">We build and fix sites for {niche.audience}-facing practices — this exact checklist, done in a week, with the before/after score to prove it.</p>
            <a href={AGENCY} target="_blank" rel="noreferrer" className="inline-block mt-3 bg-accent text-white px-4 py-2 text-sm hover:bg-ink">Talk to Us →</a>
          </div>
        </div>
      )}
    </section>
  );
}
