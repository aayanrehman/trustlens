import { FIELDS, type FieldName } from "./fields";

// Every Jev question declares the fields it reads. Anything else is refused.
export type QuestionDef = {
  id: string;
  type: "score" | "noul" | "choice";
  instructions: string;
  // Score: ordered levels low→high. Choice: options. Noul: [trueMeaning, falseMeaning].
  options: { key: string; description: string }[];
  reads: FieldName[];
};

export const DEFAULT_QUESTIONS: QuestionDef[] = [
  {
    id: "trust_signal_quality",
    type: "score",
    reads: ["testimonial_text_blocks", "credential_text_blocks"],
    instructions:
      "Judge only how specific and verifiable the trust evidence in `testimonial_text_blocks` and `credential_text_blocks` is. " +
      "A testimonial that names a real outcome (an admission, a scholarship, a specific school) and a first name reads higher than 'great service, highly recommend'. " +
      "A credential that names a specific checkable organization, role, or certification reads higher than 'experienced professionals'. " +
      "Do not judge writing quality, tone, or how many blocks there are. If both lists are empty, the evidence is at the lowest level.",
    options: [
      { key: "no_credible_signal", description: "No testimonials or credentials are present, or the only text is placeholder, navigation, marketing slogans, or boilerplate unrelated to a client's experience or the consultant's background." },
      { key: "generic_or_unverifiable", description: "Testimonials or credentials exist but are generic praise or generic claims with no specific outcome, name, organization, or checkable fact. Examples: 'Great service, highly recommend!', 'experienced and caring team', 'proven results'." },
      { key: "somewhat_specific", description: "At least one testimonial or credential names a concrete detail such as a first name, a named school or program, a specific result, a named organization, or a number of years of experience, but a reader could not independently check it." },
      { key: "highly_specific_and_verifiable", description: "Testimonials name a concrete outcome together with a person (first name plus last initial, or a role like 'parent of a 2024 graduate'), or credentials name a specific checkable affiliation such as an IECA, HECA, or NACAC membership, a named certification, a former admissions role at a named university, or a published book." },
    ],
  },
  {
    id: "discretion_respected",
    type: "noul",
    reads: ["testimonial_text_blocks"],
    instructions:
      "Do the testimonials in `testimonial_text_blocks` avoid identifying a specific client family? " +
      "In college consulting, client confidentiality is the norm: first names, initials, a role such as 'parent', a state, or a school on its own are acceptable. " +
      "A full name (first and last) of a student or parent, or an unmistakable combination of details (a full name with a school, town, or graduation year) is not. " +
      "If `testimonial_text_blocks` is empty, answer yes.",
    options: [
      { key: "true", description: "No testimonial gives a student's or parent's full first and last name, and none combines details such as town, school, and year in a way that would let a reader identify the family." },
      { key: "false", description: "At least one testimonial identifies a specific student or family by full first and last name, or by an unmistakable combination of identifying details." },
    ],
  },
  {
    id: "geo_readiness",
    type: "score",
    reads: ["schema_types", "has_faq_block", "meta_description"],
    instructions:
      "An AI assistant is answering the question 'who is a good college consultant near me, and what do they cost?'. " +
      "Judge how well this page is set up to be found and cited for that question, using only the structured signals given: " +
      "`schema_types` (structured data types found on the page), `has_faq_block` (whether the page has a question-and-answer section), and `meta_description` (the page's summary text). " +
      "Do not assume any content that is not listed in these fields.",
    options: [
      { key: "poor", description: "`schema_types` is empty, `has_faq_block` is false, and `meta_description` is empty or does not say what the business does." },
      { key: "weak", description: "Only one signal helps: either `schema_types` lists something, or `has_faq_block` is true, or `meta_description` names the service — but the other two are missing or generic." },
      { key: "adequate", description: "Two signals help: for example `schema_types` includes Organization or LocalBusiness and `meta_description` clearly names the service and who it is for or where it operates, but `has_faq_block` is false; or `has_faq_block` is true and the description is clear but `schema_types` is empty." },
      { key: "strong", description: "`schema_types` includes LocalBusiness, Service, or FAQPage; `has_faq_block` is true; and `meta_description` plainly states the service, who it is for, and a location or pricing cue an assistant could quote." },
    ],
  },
  {
    id: "authority_positioning",
    type: "choice",
    reads: ["meta_title", "meta_description", "credential_text_blocks"],
    instructions:
      "From `meta_title`, `meta_description`, and `credential_text_blocks` only, how does this business position itself? " +
      "Judge the specificity of the standing it claims, not the writing style.",
    options: [
      { key: "reads_as_recognized_authority", description: "The title, description, or credentials name specific checkable markers of standing: a professional membership (IECA, HECA, NACAC), a former admissions or counseling role at a named institution, a named certification or degree, a published book, a press mention, or a specific count of years and students served." },
      { key: "reads_as_competent_but_generic", description: "The text clearly describes a real service in professional wording, but the credibility claims are generic ('experienced', 'expert', 'personalized', 'proven results', 'trusted') with nothing specific or checkable." },
      { key: "reads_as_thin_or_unfinished", description: "The title or description is missing, a default such as 'Home' or 'Untitled', placeholder text, or so vague that a reader cannot tell what the business does, and no credentials are given." },
    ],
  },
];

export function validateQuestions(qs: QuestionDef[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const q of qs) {
    if (!/^[a-z][a-z0-9_]*$/.test(q.id)) errors.push(`${q.id}: id must be snake_case`);
    if (seen.has(q.id)) errors.push(`${q.id}: duplicate id`);
    seen.add(q.id);
    if (!q.instructions?.trim()) errors.push(`${q.id}: instructions required`);
    if (!q.reads?.length) errors.push(`${q.id}: must declare at least one field it reads`);
    for (const f of q.reads ?? []) if (!(FIELDS as readonly string[]).includes(f)) errors.push(`${q.id}: reads unknown field "${f}" (contract: ${FIELDS.join(", ")})`);
    if (q.type === "noul" && q.options.length !== 2) errors.push(`${q.id}: noul needs exactly 2 entries (true, false)`);
    if (q.type === "score" && (q.options.length < 2 || q.options.length > 10)) errors.push(`${q.id}: score needs 2–10 levels`);
    if (q.type === "choice" && (q.options.length < 2 || q.options.length > 255)) errors.push(`${q.id}: choice needs 2–255 options`);
    const keys = new Set(q.options.map((o) => o.key));
    if (keys.size !== q.options.length) errors.push(`${q.id}: duplicate option keys`);
  }
  return errors;
}

/** Union of fields the given questions declare — the only thing sent to Jev as state. */
export function fieldsRead(qs: QuestionDef[]): FieldName[] {
  return [...new Set(qs.flatMap((q) => q.reads))];
}

// Convert to SDK request shape. Score levels use the description (the model never sees keys).
export function toSdkQuestions(qs: QuestionDef[]) {
  const out: Record<string, unknown> = {};
  for (const q of qs) {
    if (q.type === "score") out[q.id] = { type: "score", instructions: q.instructions, criteria: q.options.map((o) => o.description) };
    else if (q.type === "noul") out[q.id] = { type: "noul", instructions: q.instructions, criteria: { true: q.options[0]?.description, false: q.options[1]?.description } };
    else out[q.id] = { type: "choice", instructions: q.instructions, criteria: Object.fromEntries(q.options.map((o) => [o.key, o.description])) };
  }
  return out;
}
