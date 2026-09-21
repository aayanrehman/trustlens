// Convex, server side. Everything degrades to no-op when Convex isn't configured, so local dev without it still works.
import { ConvexHttpClient } from "convex/browser";
import { createHash } from "node:crypto";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { SiteResult } from "./fields";
import type { Scored } from "./scoring";

const url = process.env.NEXT_PUBLIC_CONVEX_URL, secret = process.env.TRUSTLENS_SECRET ?? "";
export const db = url && secret ? new ConvexHttpClient(url) : null;
export const ipHash = (ip: string) => createHash("sha256").update(`${ip}|${secret}`).digest("hex").slice(0, 32); // never store raw IPs

export const reserve = (ip: string, sites: number) => db!.mutation(api.scans.reserve, { secret, ipHash: ipHash(ip), sites });
export function save(ip: string, source: string, r: SiteResult, scored?: Scored) {
  if (!db) return Promise.resolve(null);
  const { scanned_at: _s, ...rest } = r; void _s;
  const extraction = rest.extraction ? { ...rest.extraction, page_speed_score: rest.extraction.page_speed_score ?? null } : undefined;
  return db.mutation(api.scans.save, { secret, ipHash: ipHash(ip), source, result: { ...rest, extraction, scored } });
}
export const patchSpeed = (id: Id<"scans">, page_speed_score: number | null, scored?: Scored) => db ? db.mutation(api.scans.patchSpeed, { secret, id, page_speed_score, scored }) : Promise.resolve();
export const getScan = (id: string) => db ? db.query(api.scans.get, { id: id as Id<"scans"> }).catch(() => null) : Promise.resolve(null);
export const recentScans = (limit = 5) => db ? db.query(api.scans.recent, { limit, okOnly: true }) : Promise.resolve([]);
