import { TypeSafeClient } from "@typesafe-ai/sdk";
import type { Extraction, JevAnswer } from "./fields";
import { fieldsRead, toSdkQuestions, validateQuestions, type QuestionDef } from "./questions";

export const MODEL = "jev-latest";
export const USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

let client: TypeSafeClient | null = null;
function getClient() {
  if (!process.env.TYPESAFE_API_KEY) throw new Error("TYPESAFE_API_KEY not set");
  return (client ??= new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY, defaultModel: MODEL, timeout: 30_000 }));
}

/** Build the Jev state: ONLY the fields the questions declare. Never HTML, never full text. */
export function buildState(extraction: Extraction, qs: QuestionDef[]) {
  const state: Record<string, unknown> = {};
  for (const f of fieldsRead(qs)) state[f] = extraction[f];
  return state;
}

export async function askJev(extraction: Extraction, qs: QuestionDef[]) {
  const errors = validateQuestions(qs);
  if (errors.length) throw new Error("Refusing to run: " + errors.join("; "));
  const res = await getClient().systemOne({
    state: buildState(extraction, qs) as never,
    questions: toSdkQuestions(qs) as never,
    model: MODEL,
  });
  return { answers: res.answers as unknown as Record<string, JevAnswer>, usage: res.usage, model: res.model };
}
