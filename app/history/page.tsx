"use client";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Scored } from "@/lib/scoring";
const sc = (x: unknown) => x as Scored | undefined;

// Live feed of every scan, from every user, updating in real time.
export default function History() {
  const rows = useQuery(api.scans.recent, { limit: 50 });
  const stats = useQuery(api.scans.stats);
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="eyebrow">Live · updates as scans happen</div>
      <h1 className="display text-4xl mt-2">Every scan, everywhere.</h1>
      {stats && <p className="mono text-sm mt-3 text-ink-2">today {stats.today.scans} scans · ${stats.today.usd.toFixed(4)} · all-time {stats.allTime.scans} scans · {stats.allTime.tokens.toLocaleString()} tokens · ${stats.allTime.usd.toFixed(4)}</p>}
      <table className="w-full mt-6 text-sm border-collapse">
        <thead><tr className="text-left"><th className="eyebrow py-2">site</th><th className="eyebrow py-2">grade</th><th className="eyebrow py-2 hidden sm:table-cell">SEO · AI · Trust · Auth · Disc</th><th className="eyebrow py-2">cost</th><th className="eyebrow py-2">via</th><th className="eyebrow py-2">when</th></tr></thead>
        <tbody>
          {(rows ?? []).map((r) => (
            <tr key={String(r._id)} className="border-t rule">
              <td className="py-2 mono"><Link href={`/audit/${r._id}`} className="hover:text-accent underline-offset-2 hover:underline">{r.host}</Link>{r.client_only_shell && <span className="eyebrow text-scan ml-2">crawler-invisible</span>}</td>
              <td className={`py-2 display text-2xl ${/[DF]/.test(sc(r.scored)?.grade ?? "") ? "text-scan" : "text-accent"}`}>{sc(r.scored)?.grade ?? (r.status === "blocked" ? "skip" : "—")}</td>
              <td className="py-2 mono text-xs hidden sm:table-cell">{sc(r.scored) ? (["seo", "geo", "trust", "authority", "discoverability"] as const).map((k) => sc(r.scored)!.categories[k]?.score ?? "–").join(" · ") : r.reason}</td>
              <td className="py-2 mono text-xs">${(((r.usage?.input_tokens ?? 0) * 0.042) / 1e6).toFixed(5)}</td>
              <td className="py-2 eyebrow">{r.source}</td>
              <td className="py-2 text-xs text-ink-2">{new Date(r.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {rows && rows.length === 0 && <tr><td colSpan={6} className="py-6 text-ink-2">No scans yet.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
