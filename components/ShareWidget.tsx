"use client";
import { useEffect, useState } from "react";
import EmailGate from "./EmailGate";

// One share sheet for the web app and the audit page: copy link, LinkedIn, X, download PNG.
export default function ShareWidget({ host, grade, overall, auditPath, share, onClose, scanId }: { host: string; grade: string; overall: number; auditPath: string; share: string; onClose: () => void; scanId?: string }) {
  const [url, setUrl] = useState(auditPath);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setUrl(new URL(auditPath, window.location.origin).toString()); }, [auditPath]);
  const text = `${host} scored ${grade} (${overall}/100) on TrustLens — SEO, AI search visibility, trust, authority and discoverability — judged by AI.`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <div role="dialog" aria-label="Share your score" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <div className="bg-paper w-full max-w-md border border-ink p-5 rise" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between"><div className="eyebrow">Share your score</div><button onClick={onClose} aria-label="Close" className="text-xl leading-none">×</button></div>
        <div className="mt-3 flex items-center gap-4"><div className={`display text-7xl leading-none ${/[DF]/.test(grade) ? "text-scan" : "text-accent"}`}>{grade}</div><div><div className="mono text-lg">{overall}/100</div><div className="mono text-xs text-ink-2 break-all">{host}</div></div></div>
        <img src={`/api/og?d=${share}`} alt="" className="mt-4 w-full border rule" />
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <a href={li} target="_blank" rel="noreferrer" className="border border-ink px-3 py-2 text-center hover:bg-ink hover:text-paper">Post on LinkedIn</a>
          <a href={x} target="_blank" rel="noreferrer" className="border border-ink px-3 py-2 text-center hover:bg-ink hover:text-paper">Post on X</a>
          <button onClick={copy} className="border rule px-3 py-2 hover:border-ink">{copied ? "Copied ✓" : "Copy link"}</button>
          <a href={`/api/og?d=${share}`} download={`trustlens-${host}.png`} className="border rule px-3 py-2 text-center hover:border-ink">Download PNG</a>
        </div>
        <div className="mt-4 border-t rule pt-3">
          <div className="eyebrow">Get the fix-it report for {host}</div>
          <div className="mt-2"><EmailGate host={host} scanId={scanId} grade={grade} source="share" compact /></div>
        </div>
        <p className="mt-3 text-[11px] text-ink-2">The link opens a public results page with this card as its preview image.</p>
      </div>
    </div>
  );
}
