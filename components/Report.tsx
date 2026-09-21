"use client";
import { useState } from "react";
import type { Extraction, JevAnswer } from "@/lib/fields";
import { buildReport, jsonLd } from "@/lib/report";
import { CATEGORY_LABELS } from "@/lib/scoring";
import EmailGate from "./EmailGate";

const AGENCY = process.env.NEXT_PUBLIC_AGENCY_URL || "mailto:aayan.rehmann@gmail.com?subject=TrustLens%20fix-it";
const FREE = 3;

export default function Report({ host, scanId, grade, extraction, answers, shell }: { host: string; scanId?: string; grade?: string; extraction: Extraction; answers: Record<string, JevAnswer>; shell?: boolean }) {
  const [open, setOpen] = useState(false);
  const actions = buildReport(extraction, answers, host, shell);
  const shown = open ? actions : actions.slice(0, FREE);
  return (
    <section id="report" className="mt-10 border-t rule pt-8">
      <div className="eyebrow">Your fix-it report · {actions.length} actions, highest impact first</div>
      <h2 className="display text-3xl mt-1">How to raise this score.</h2>
      <ol className="mt-5 space-y-4">
        {shown.map((a, i) => (
          <li key={a.title} className="border rule bg-white/50 p-4 rise" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="mono text-ink-2 text-xs">{String(i + 1).padStart(2, "0")}</span>
              <span className="eyebrow">{CATEGORY_LABELS[a.category]}</span>
              <span className="eyebrow">{"●".repeat(a.impact)}{"○".repeat(3 - a.impact)} impact</span>
              <span className="eyebrow">{a.effort}</span>
            </div>
            <h3 className="text-lg mt-1">{a.title}</h3>
            <p className="text-sm text-ink-2 mt-1"><span className="text-ink">Why:</span> {a.why}</p>
            <p className="text-sm mt-1"><span className="text-ink-2">How:</span> {a.how}</p>
          </li>
        ))}
      </ol>
      {!open && actions.length > FREE && (
        <div className="mt-5 border border-ink p-4">
          <div className="eyebrow">{actions.length - FREE} more actions + the paste-in schema snippet</div>
          <p className="text-sm mt-1 mb-3">Enter your email and the rest unlocks here. We&rsquo;ll also send occasional notes on getting found by parents and AI — unsubscribe any time.</p>
          <EmailGate host={host} scanId={scanId} grade={grade} source="report" onUnlock={() => setOpen(true)} />
        </div>
      )}
      {open && (
        <div className="mt-6">
          <div className="eyebrow">Paste-in structured data (fill the [brackets])</div>
          <pre className="mt-2 mono text-[11px] leading-snug whitespace-pre-wrap break-words bg-white/70 border rule p-3 max-h-80 overflow-auto">{`<script type="application/ld+json">\n${jsonLd(host, extraction)}\n</script>`}</pre>
          <div className="mt-6 border border-accent p-4">
            <div className="eyebrow">Want it done for you?</div>
            <p className="text-sm mt-1">Waterfall Growth builds and fixes sites for education consultants — the same checklist, done in a week, with the before/after score to prove it.</p>
            <a href={AGENCY} className="inline-block mt-3 bg-accent text-white px-4 py-2 text-sm hover:bg-ink">Talk to Waterfall Growth →</a>
          </div>
        </div>
      )}
    </section>
  );
}
