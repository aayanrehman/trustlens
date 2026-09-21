// The extracted-field contract. Single source of truth: lib/contract.schema.json (JSON Schema 2020-12).
// Jev may read ONLY these fields — never raw HTML or full page text.
import contract from "./contract.schema.json";

export const CONTRACT = contract;
export const FIELDS = Object.keys(contract.properties) as (keyof typeof contract.properties)[];
export type FieldName = (typeof FIELDS)[number];
export const FIELD_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(contract.properties).map(([k, v]) => [k, (v as { description?: string }).description ?? ""]),
);

export type Extraction = {
  schema_types: string[];
  has_faq_block: boolean;
  meta_title: { text: string; length: number };
  meta_description: { text: string; length: number };
  testimonial_text_blocks: string[];
  credential_text_blocks: string[];
  google_business_profile_linked: boolean;
  social_links_found: string[];
  page_speed_score: number | null | undefined; // undefined = still measuring, null = failed
  mobile_friendly: boolean | null;
  word_count: number;
  last_modified_signal: string;
};

export type SiteResult = {
  url: string;
  host: string;
  pages_fetched: string[];
  client_only_shell?: boolean; // site ships an empty HTML shell; crawlers without JS see nothing
  status: "ok" | "blocked" | "error";
  reason?: string;
  extraction?: Extraction;
  answers?: Record<string, JevAnswer>;
  usage?: { input_tokens: number; output_tokens: number };
  latency_ms?: { fetch: number; jev: number }; // measured on the server
  niche?: { key: string; label: string; confidence: number }; // auto-detected by Jev before scoring
  model?: string;
  scanned_at: string;
};

export type JevAnswer =
  | { type: "noul"; noul: number }
  | { type: "choice"; choice: string; probabilities: Record<string, number>; confidence: number }
  | { type: "score"; score: number; legend: Record<string, string>; probabilities: Record<string, number>; confidence: number };
