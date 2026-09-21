"use client";
import type { Extraction } from "@/lib/fields";
import type { Stage } from "@/lib/scan";

const STAGE_TEXT: Record<Stage | "queued", string> = { queued: "queued", fetching: "fetching robots.txt + homepage…", extracting: "extracting signals in code…", detecting: "Jev: what kind of business is this?…", scoring: "asking Jev (4 questions, 1 request)…", done: "scored", blocked: "blocked by robots.txt", error: "failed" };

function chips(x: Extraction): { k: string; v: string; on: boolean }[] {
  return [
    { k: "schema", v: x.schema_types.length ? x.schema_types.slice(0, 3).join(", ") + (x.schema_types.length > 3 ? ` +${x.schema_types.length - 3}` : "") : "none", on: x.schema_types.length > 0 },
    { k: "faq", v: x.has_faq_block ? "yes" : "no", on: x.has_faq_block },
    { k: "title", v: `${x.meta_title.length} ch`, on: x.meta_title.length >= 30 && x.meta_title.length <= 65 },
    { k: "description", v: x.meta_description.length ? `${x.meta_description.length} ch` : "missing", on: x.meta_description.length >= 70 && x.meta_description.length <= 165 },
    { k: "testimonials", v: `${x.testimonial_text_blocks.length} blocks`, on: x.testimonial_text_blocks.length > 0 },
    { k: "credentials", v: `${x.credential_text_blocks.length} blocks`, on: x.credential_text_blocks.length > 0 },
    { k: "google profile", v: x.google_business_profile_linked ? "linked" : "none", on: x.google_business_profile_linked },
    { k: "social", v: x.social_links_found.length ? x.social_links_found.join(", ") : "none", on: x.social_links_found.length > 0 },
    { k: "mobile", v: x.mobile_friendly == null ? "?" : x.mobile_friendly ? "yes" : "no", on: !!x.mobile_friendly },
    { k: "words", v: String(x.word_count), on: x.word_count >= 600 },
    { k: "updated", v: x.last_modified_signal === "unknown" ? "unknown" : "found", on: x.last_modified_signal !== "unknown" },
    { k: "speed", v: x.page_speed_score === undefined ? "measuring…" : x.page_speed_score === null ? "n/a" : `${x.page_speed_score}/100`, on: (x.page_speed_score ?? 0) >= 80 },
  ];
}

export default function ScanConsole({ url, stage, extraction, shell, reason, niche }: { url: string; stage: Stage | "queued"; extraction?: Extraction; shell?: boolean; reason?: string; niche?: { key: string; label: string; confidence: number } }) {
  const live = stage === "fetching" || stage === "extracting" || stage === "detecting" || stage === "scoring";
  return (
    <div className={`border rule p-4 rise ${live ? "scanning" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="mono text-sm truncate">{url}</div>
        <div className={`eyebrow whitespace-nowrap ${stage === "done" ? "text-ok" : stage === "blocked" || stage === "error" ? "text-scan" : ""}`}>{STAGE_TEXT[stage]}{live && <span className="blink">_</span>}</div>
      </div>
      {reason && <p className="mt-2 text-sm text-scan">{reason}</p>}
      {niche && <p className="mt-2 text-sm pop"><span className="bg-accent text-white px-1.5 py-0.5 eyebrow !text-white">niche auto-detected</span> <span className="ml-1">{niche.label}</span> <span className="mono text-xs text-ink-2">{Math.round(niche.confidence * 100)}% confident · questions re-phrased for this niche</span></p>}
      {shell && <p className="mt-2 text-sm"><span className="bg-scan text-white px-1.5 py-0.5 eyebrow !text-white">crawler-invisible</span> This site renders entirely in the browser. Search engines can render it (slowly); most AI assistants cannot. Everything below is what a crawler sees.</p>}
      {extraction && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips(extraction).map((c, i) => (
            <span key={c.k} className={`pop inline-flex items-baseline gap-1.5 border px-2 py-0.5 text-xs mono ${c.on ? "border-scan text-ink" : "border-rule text-ink-2"}`} style={{ animationDelay: `${i * 70}ms` }}>
              <span className="eyebrow !text-[10px]">{c.k}</span>{c.v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
