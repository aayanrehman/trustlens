import { NextRequest } from "next/server";
import { askJev } from "@/lib/jev";
import { validateQuestions, type QuestionDef } from "@/lib/questions";
import type { Extraction } from "@/lib/fields";

export const runtime = "nodejs";
export const maxDuration = 60;

// Classifier Studio: re-run edited questions on cached extractions. No fetching.
// POST { questions: QuestionDef[], extractions: { url: string, extraction: Extraction }[] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const qs = body.questions as QuestionDef[];
  const items = (body.extractions ?? []) as { url: string; extraction: Extraction }[];
  if (!Array.isArray(qs) || !qs.length) return Response.json({ error: "questions required" }, { status: 400 });
  const errors = validateQuestions(qs);
  if (errors.length) return Response.json({ error: "Refused: questions violate the field contract", errors }, { status: 422 });
  const results = await Promise.all(items.slice(0, 5).map(async ({ url, extraction }) => {
    try { const r = await askJev(extraction, qs); return { url, ...r }; }
    catch (e) { return { url, error: (e as Error).message }; }
  }));
  return Response.json({ results });
}
