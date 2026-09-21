import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Public opt-in. One row per email+host; re-submitting just refreshes the timestamp. */
export const add = mutation({
  args: { email: v.string(), host: v.string(), scanId: v.optional(v.string()), grade: v.optional(v.string()), source: v.string() },
  handler: async (ctx, a) => {
    const email = a.email.trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 200) throw new Error("Enter a valid email.");
    const existing = (await ctx.db.query("leads").withIndex("by_email", (q) => q.eq("email", email)).collect()).find((l) => l.host === a.host);
    if (existing) { await ctx.db.patch(existing._id, { createdAt: Date.now(), scanId: a.scanId ?? existing.scanId, grade: a.grade ?? existing.grade }); return existing._id; }
    return await ctx.db.insert("leads", { ...a, email, createdAt: Date.now() });
  },
});

/** Count only — the list itself lives in the Convex dashboard (never exposed publicly). */
export const count = query({ args: {}, handler: async (ctx) => (await ctx.db.query("leads").collect()).length });
