import { NextRequest } from "next/server";
import { scanSite, parseUrls, type ScanEvent } from "@/lib/scan";
import { DEFAULT_QUESTIONS, validateQuestions, type QuestionDef } from "@/lib/questions";
import { checkAndReserve, clientIp, settle } from "@/lib/ratelimit";
import { db, reserve, save, patchSpeed } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 120; // PageSpeed alone can take 60s+ on heavy sites

// POST { urls: string | string[], questions?: QuestionDef[] } → NDJSON stream of ScanEvent
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const urls = parseUrls(Array.isArray(body.urls) ? body.urls.join("\n") : String(body.urls ?? ""));
  if (!urls.length) return Response.json({ error: "No URLs" }, { status: 400 });
  if (!process.env.TYPESAFE_API_KEY) return Response.json({ error: "TYPESAFE_API_KEY is not configured on the server" }, { status: 500 });
  const qs: QuestionDef[] = Array.isArray(body.questions) && body.questions.length ? body.questions : DEFAULT_QUESTIONS;
  const errors = validateQuestions(qs);
  if (errors.length) return Response.json({ error: "Questions violate the field contract", errors }, { status: 422 });
  const ip = clientIp(req), source = typeof body.source === "string" ? body.source : "web";
  // Budget + per-visitor limit: transactional in Convex when configured, per-instance memory otherwise.
  const gate = db ? await reserve(ip, urls.length).catch(() => ({ ok: true as const })) : checkAndReserve(ip, urls.length);
  if (!gate.ok) return Response.json({ error: gate.reason }, { status: 429 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const ids = new Map<string, string>();
      const write = (e: ScanEvent) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      const emit = (e: ScanEvent) => {
        if (e.type === "result") {
          if (e.result.usage) settle(e.result.usage.input_tokens);
          // Persist, then stream the result with its public id attached.
          return save(ip, source, e.result, e.scored).then((id) => { if (id) ids.set(e.url, String(id)); write({ ...e, scanId: id ? String(id) : undefined }); }).catch(() => write(e));
        }
        if (e.type === "psi") { const id = ids.get(e.url); if (id) patchSpeed(id as never, e.page_speed_score, e.scored).catch(() => {}); }
        write(e);
      };
      await Promise.all(urls.map((u) => scanSite(u, qs, emit).catch((err) => emit({ type: "result", url: u, result: { url: u, host: u, pages_fetched: [], status: "error", reason: String(err?.message ?? err), scanned_at: new Date().toISOString() } }))));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}

export function OPTIONS() { return new Response(null, { status: 204 }); }
