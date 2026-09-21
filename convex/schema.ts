import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // One row per scanned site. extraction/answers/scored are the same shapes the API streams (see lib/fields.ts, lib/scoring.ts).
  scans: defineTable({
    url: v.string(),
    host: v.string(),
    status: v.union(v.literal("ok"), v.literal("blocked"), v.literal("error")),
    reason: v.optional(v.string()),
    client_only_shell: v.optional(v.boolean()),
    pages_fetched: v.array(v.string()),
    extraction: v.optional(v.any()),
    answers: v.optional(v.any()),
    scored: v.optional(v.any()),
    usage: v.optional(v.object({ input_tokens: v.number(), output_tokens: v.number() })),
    latency_ms: v.optional(v.object({ fetch: v.number(), jev: v.number() })),
    model: v.optional(v.string()),
    source: v.string(), // "web" | "extension" | "api"
    ipHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_host", ["host", "createdAt"])
    .index("by_status", ["status", "createdAt"])
    .index("by_ipHash", ["ipHash", "createdAt"]),

  // Email opt-ins from the share sheet / fix-it report. Funnels into the agency.
  leads: defineTable({ email: v.string(), host: v.string(), scanId: v.optional(v.string()), grade: v.optional(v.string()), source: v.string(), createdAt: v.number() }).index("by_email", ["email"]),

  // Spend guard, transactional. One row per UTC day.
  spend: defineTable({ day: v.string(), usd: v.number(), tokens: v.number(), scans: v.number() }).index("by_day", ["day"]),
  // Per-visitor hourly counters.
  visitors: defineTable({ ipHash: v.string(), hourStart: v.number(), scans: v.number() }).index("by_ip_hour", ["ipHash", "hourStart"]),
});
