"use client";
import { useState } from "react";
import Link from "next/link";
import ResultsGrid from "@/components/ResultColumn";
import ShareWidget from "@/components/ShareWidget";
import { DEFAULT_QUESTIONS } from "@/lib/questions";
import { DEFAULT_THRESHOLDS, type Scored } from "@/lib/scoring";
import type { SiteResult } from "@/lib/fields";
import Report from "@/components/Report";

// Public page for a stored scan: full category breakdown + issues, straight from Convex.
export default function AuditFull({ scan, share }: { scan: { _id: unknown; createdAt: number; scored?: unknown } & Omit<SiteResult, "scanned_at">; share: string }) {
  const [open, setOpen] = useState(false);
  const r: SiteResult = { ...scan, scanned_at: new Date(scan.createdAt).toISOString() };
  const sc = scan.scored as Scored | undefined;
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div><div className="eyebrow">TrustLens audit · {r.scanned_at.slice(0, 10)}</div><h1 className="mono text-2xl mt-1 break-all">{r.host}</h1></div>
        <div className="flex gap-2 text-sm">
          {sc && <button onClick={() => setOpen(true)} className="bg-ink text-paper px-4 py-2 hover:bg-accent">Share this score</button>}
          <Link href={`/?u=${encodeURIComponent(r.host)}`} className="border border-ink px-4 py-2">Score your site →</Link>
        </div>
      </div>
      <div className="mt-6"><ResultsGrid results={[r]} thresholds={DEFAULT_THRESHOLDS} questions={DEFAULT_QUESTIONS} /></div>
      {r.extraction && r.answers && <Report host={r.host} scanId={String(scan._id)} grade={sc?.grade} extraction={r.extraction} answers={r.answers} shell={r.client_only_shell} />}
      {open && sc && <ShareWidget host={r.host} grade={sc.grade} overall={sc.overall} auditPath={`/audit/${String(scan._id)}`} share={share} onClose={() => setOpen(false)} />}
    </main>
  );
}
