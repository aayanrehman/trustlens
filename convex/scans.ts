import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";

// Server-to-server calls carry a shared secret (set TRUSTLENS_SECRET on both Vercel and Convex).
const guard = (secret: string) => { if (!process.env.TRUSTLENS_SECRET || secret !== process.env.TRUSTLENS_SECRET) throw new Error("unauthorized"); };
const LIMITS = { sitesPerIpPerHour: 60, usdPerDay: 3, tokensPerSiteEstimate: 2500 };
const USD_PER_TOKEN = 0.042 / 1e6;
const HOUR = 3_600_000;
const today = () => new Date().toISOString().slice(0, 10);

async function spendRow(ctx: MutationCtx) {
  const day = today();
  const row = await ctx.db.query("spend").withIndex("by_day", (q) => q.eq("day", day)).unique();
  return row ?? { _id: await ctx.db.insert("spend", { day, usd: 0, tokens: 0, scans: 0 }), day, usd: 0, tokens: 0, scans: 0 };
}

/** Reserve budget for N sites, atomically. Returns why not, if not. */
export const reserve = mutation({
  args: { secret: v.string(), ipHash: v.string(), sites: v.number() },
  handler: async (ctx, { secret, ipHash, sites }) => {
    guard(secret);
    const hourStart = Math.floor(Date.now() / HOUR) * HOUR;
    const visitor = await ctx.db.query("visitors").withIndex("by_ip_hour", (q) => q.eq("ipHash", ipHash).eq("hourStart", hourStart)).unique();
    if ((visitor?.scans ?? 0) + sites > LIMITS.sitesPerIpPerHour) return { ok: false as const, reason: `Rate limit: ${LIMITS.sitesPerIpPerHour} sites per hour per visitor. Try again later.` };
    const s = await spendRow(ctx);
    const reserveUsd = sites * LIMITS.tokensPerSiteEstimate * USD_PER_TOKEN;
    if (s.usd + reserveUsd > LIMITS.usdPerDay) return { ok: false as const, reason: `Daily budget reached ($${LIMITS.usdPerDay}). Scans resume tomorrow.` };
    if (visitor) await ctx.db.patch(visitor._id, { scans: visitor.scans + sites }); else await ctx.db.insert("visitors", { ipHash, hourStart, scans: sites });
    await ctx.db.patch(s._id, { usd: s.usd + reserveUsd, scans: s.scans + sites });
    return { ok: true as const };
  },
});

/** Save a finished site result and replace its reserved estimate with the real token cost. */
export const save = mutation({
  args: {
    secret: v.string(), ipHash: v.string(), source: v.string(),
    result: v.object({
      url: v.string(), host: v.string(), status: v.union(v.literal("ok"), v.literal("blocked"), v.literal("error")), reason: v.optional(v.string()),
      client_only_shell: v.optional(v.boolean()), pages_fetched: v.array(v.string()), extraction: v.optional(v.any()), answers: v.optional(v.any()), scored: v.optional(v.any()),
      usage: v.optional(v.object({ input_tokens: v.number(), output_tokens: v.number() })), latency_ms: v.optional(v.object({ fetch: v.number(), jev: v.number() })), model: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { secret, ipHash, source, result }) => {
    guard(secret);
    const tokens = result.usage?.input_tokens ?? 0;
    const s = await spendRow(ctx);
    await ctx.db.patch(s._id, { usd: Math.max(0, s.usd + (tokens - LIMITS.tokensPerSiteEstimate) * USD_PER_TOKEN), tokens: s.tokens + tokens });
    if (result.status !== "ok") { // skipped/failed scans cost nothing: give the visitor their slot back
      const hourStart = Math.floor(Date.now() / HOUR) * HOUR;
      const visitor = await ctx.db.query("visitors").withIndex("by_ip_hour", (q) => q.eq("ipHash", ipHash).eq("hourStart", hourStart)).unique();
      if (visitor && visitor.scans > 0) await ctx.db.patch(visitor._id, { scans: visitor.scans - 1 });
    }
    return await ctx.db.insert("scans", { ...result, source, ipHash, createdAt: Date.now() });
  },
});

/** Late PageSpeed score: patch the stored extraction + score. */
export const patchSpeed = mutation({
  args: { secret: v.string(), id: v.id("scans"), page_speed_score: v.union(v.number(), v.null()), scored: v.optional(v.any()) },
  handler: async (ctx, { secret, id, page_speed_score, scored }) => {
    guard(secret);
    const row = await ctx.db.get(id); if (!row?.extraction) return;
    await ctx.db.patch(id, { extraction: { ...row.extraction, page_speed_score }, ...(scored ? { scored } : {}) });
  },
});

import type { Doc } from "./_generated/dataModel";
const pub = (s: Doc<"scans">) => {
  const { _id, url, host, status, reason, client_only_shell, pages_fetched, extraction, answers, scored, usage, latency_ms, model, source, createdAt } = s;
  return { _id, url, host, status, reason, client_only_shell, pages_fetched, extraction, answers, scored, usage, latency_ms, model, source, createdAt }; // never ipHash
};

export const get = query({ args: { id: v.id("scans") }, handler: async (ctx, { id }) => { const s = await ctx.db.get(id); return s ? pub(s) : null; } });

export const recent = query({
  args: { limit: v.optional(v.number()), okOnly: v.optional(v.boolean()) },
  handler: async (ctx, { limit, okOnly }) => {
    const n = Math.min(50, limit ?? 20);
    const rows = okOnly ? await ctx.db.query("scans").withIndex("by_status", (q) => q.eq("status", "ok")).order("desc").take(n) : await ctx.db.query("scans").order("desc").take(n);
    return rows.map(pub);
  },
});

/** Live totals for the top bar: scans today, cost today, all-time scans. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const day = await ctx.db.query("spend").withIndex("by_day", (q) => q.eq("day", today())).unique();
    const all = await ctx.db.query("spend").collect();
    return { today: { scans: day?.scans ?? 0, tokens: day?.tokens ?? 0, usd: day?.usd ?? 0 }, allTime: { scans: all.reduce((n, r) => n + r.scans, 0), tokens: all.reduce((n, r) => n + r.tokens, 0), usd: all.reduce((n, r) => n + r.usd, 0) } };
  },
});

/** Ops: wipe per-visitor counters (run with `npx convex run scans:clearVisitors --prod`). */
export const clearVisitors = internalMutation({
  args: {},
  handler: async (ctx) => { const rows = await ctx.db.query("visitors").collect(); await Promise.all(rows.map((r) => ctx.db.delete(r._id))); return rows.length; },
});
