// Share payload for /audit/[slug] and the OG image. No database: the result travels in the URL.
export type SharePayload = { h: string; g: string; o: number; s: [number, number, number, number]; d: string };

const b64 = (s: string) => (typeof Buffer !== "undefined" ? Buffer.from(s, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(s)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => { const t = s.replace(/-/g, "+").replace(/_/g, "/"); return typeof Buffer !== "undefined" ? Buffer.from(t, "base64").toString("utf8") : decodeURIComponent(escape(atob(t))); };

export const encodeShare = (p: SharePayload) => b64(JSON.stringify(p));
export function decodeShare(s: string | undefined): SharePayload | null {
  try { const p = JSON.parse(unb64(s ?? "")); if (typeof p.h === "string" && Array.isArray(p.s) && p.s.length === 4) return p; } catch {}
  return null;
}
export const slugify = (host: string) => host.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "");
