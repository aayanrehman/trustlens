# TrustLens

Paste one URL (Single scan) or 2–5 (Compare). Code fetches the homepage + one About/Testimonials page (respecting robots.txt), extracts 12 deterministic signals, and TypeSafe's Jev scores the qualitative ones from those fields only. Four category scores (SEO, GEO, Trust, Discoverability) and a letter grade are computed in code.

- `lib/contract.schema.json` — the only fields Jev may read (single source of truth)
- `lib/questions.ts` — default Jev questions (editable in `/studio`)
- `lib/scoring.ts` — weights, cutoffs, category math
- `scripts/selfcheck.ts` — runs before every build; fails if a question reads a field outside the contract

```bash
npm install
sh scripts/setkeys.sh      # writes TYPESAFE_API_KEY / PAGESPEED_API_KEY to .env.local (hidden input)
npm run dev
npm run checkpoint -- https://example.com   # CLI scan: extracted fields + Jev answers side by side
```

Env: `TYPESAFE_API_KEY` (required), `PAGESPEED_API_KEY` (optional; raises Google's quota).
