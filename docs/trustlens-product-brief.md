# TrustLens — product brief (for scripting the YouTube video)

## One line
TrustLens is a free website auditor for independent education consultants (college admissions advisors). Paste a URL, or click a Chrome extension on any site, and in about 20 seconds you get a letter grade, five category scores, a list of plain-English fixes, and a shareable card — with the judgment calls made by Jev, TypeSafe's new "System One" AI model, for about $0.0001 per site.

Made by Waterfall Growth (Aayan Rehman), a growth agency for small consulting practices. TrustLens is the agency's lead magnet: the score is free, the fix-it report asks for an email, and the report ends with "want it done for you?"

Live: https://trustlens-mauve.vercel.app · Extension download: /extension · Live feed of all scans: /history

## The problem it makes visible
Education consultants sell trust to anxious parents, and increasingly parents ask AI assistants (ChatGPT, Perplexity, Claude) "who's a good college consultant near me and what do they cost?" Most consultant websites are DIY, generic ("experienced, personalized, proven results"), have no structured data, no FAQ, no Google Business Profile link — and some are built as JavaScript apps that send crawlers an *empty page*. To an AI, those practices do not exist. TrustLens shows this in one click.

## What Jev is (the "why now")
- Jev is TypeSafe's first System One model (released Sept 2026). Think *Thinking, Fast and Slow*: LLMs are System Two (slow, deliberate, generate text). Jev is System One: instant judgment. It does not write anything.
- It answers in exactly three shapes: **Noul** (yes/no as a probability), **Choice** (pick one option from a set, with a probability per option and a confidence), **Score** (a position along levels you describe in words, e.g. "generic praise" → "names a real outcome and a real person").
- Price: **$0.042 per million input tokens; output tokens are free.** ~200× faster and ~400× cheaper than frontier LLMs for judgment tasks. A four-question call answers in ~500 ms.
- Its quirks shape the design: it reads literally (write the exact condition), it cannot count or do arithmetic (keep all math in code), and accuracy drops if you send it irrelevant text (send only the fields the question needs).
- Model id: jev-1.13.0 (alias jev-latest). Docs: docs.typesafe.ai.

## How TrustLens works (the build story)
1. **Fetch.** The server reads robots.txt (sites that disallow crawling are skipped and flagged, never silently dropped), fetches the homepage and one About/Testimonials page. Two pages max. It detects "client-only shell" sites (empty HTML, everything rendered in the browser) and flags them **crawler-invisible**.
2. **Extract 12 signals in code, never with AI:** schema.org types found; whether there's an FAQ block; page title and meta description (text + length); testimonial text blocks; credential text blocks (IECA/HECA/NACAC, "former admissions officer", M.Ed., etc.); Google Business Profile link; social links; mobile viewport; word count; last-updated signal; Google PageSpeed mobile score (from Google's API, the only external measurement).
3. **The field contract.** Those 12 fields are the *only* thing Jev may read. Defined once in a JSON Schema; every question declares which fields it reads; the build fails if a question asks for anything else. Jev never sees raw HTML or page text. (On camera: "what Jev saw" expands to show the exact JSON it received.)
4. **Four typed questions in one Jev call:**
   - *trust_signal_quality* (Score, 4 levels): no credible signal → generic/unverifiable → somewhat specific → highly specific and verifiable (a named outcome + a person, or a checkable affiliation).
   - *discretion_respected* (Noul): do testimonials avoid identifying a family by full name / unmistakable detail (client confidentiality is the industry norm).
   - *geo_readiness* (Score, 4 levels): would an AI assistant answering "who's a good college consultant near me and what do they cost" plausibly find and cite this page, judged from schema, FAQ, and description only.
   - *authority_positioning* (Choice): reads as recognized authority / competent but generic / thin or unfinished.
5. **Scoring in code.** Five categories, 0–100: **SEO** (speed, mobile, title/description quality), **AI Search Visibility** (Jev's readiness score + schema + FAQ), **Trust** (Jev's trust score + discretion + credentials present), **Authority** (Jev's positioning + credentials + Person/Organization schema), **Discoverability** (Google profile, social links, content depth, freshness). Weighted average → letter grade A–F. All weights and cutoffs are editable sliders.
6. **Classifier Studio.** A page where you can rewrite any Jev question (instructions, levels/options, which fields it reads), re-run the edited questions on the last five scanned sites with zero re-fetching, and see before/after answers. Threshold sliders re-grade instantly with zero AI calls. Presets save/load as JSON.
7. **Compare mode.** Paste 2–5 URLs; sites render as aligned columns. The intended demo: an agency-built site vs a peer practice vs a national firm.
8. **Share card + public page.** Branded 1200×630 image (logo, favicon, domain, grade, five-axis pentagon chart, five score tiles) with LinkedIn / X / copy-link / download; a public results page per scan.
9. **Fix-it report (free value → lead).** Plain-English actions in priority order with impact dots and effort ("10 min", "1 hour", "half a day"): e.g. "Add a real FAQ with 6–10 parent questions", "Claim and link a Google Business Profile", "Replace generic claims with specific ones". First three free; the rest plus a paste-in JSON-LD snippet (ProfessionalService + Person + FAQPage, pre-filled from their site) unlock with an email. Ends with "Want it done for you? Talk to Waterfall Growth."
10. **Chrome extension (demo only, not on the Web Store).** Click the icon on any site → **Scan this page** → the page auto-scrolls itself while orange boxes appear around every element it recognises (nav, headline, logos, copy, CTAs, stats; trust signals in solid orange with a pulse), a scan beam sweeps the viewport, and a side panel logs each element as it's boxed. The score is deliberately held until the whole page has been read (~6–8 s), then the five categories reveal one by one, the grade, the pentagon, and a **latency + cost meter**: page read (elements, seconds), server fetch + extract (ms), Jev call (ms), tokens, rate, **cost of this scan**.
11. **Backend.** Next.js on Vercel; Convex for persistence (every scan stored, live feed at /history, live "all users · N sites scanned · $X total spend" counter in the header), a transactional rate limit (60 sites/visitor/hour, $3/day cap), and the leads table.

## The numbers (real, from production)
- Evergreen Consulting (evergreenconsulting.co, an agency-built site): **B, 78/100**. 2,229 input tokens → **$0.00009**. Jev call 545 ms, fetch+extract 480 ms. Flag: no FAQ block.
- Keystone Prep (keystoneprep.com, a peer-sized practice): **F, 24/100**. The site is a client-only React app: its HTML is 847 bytes and an empty `<div id="root">`. Google can render it; most AI crawlers can't. "Crawler-invisible."
- Solomon Admissions (solomonadmissions.com, national firm, 100+ named former admissions officers): **C, ~70**. Authority is maxed; no FAQ schema, no Google Business Profile link.
- Full three-site comparison: 5,910 tokens → **$0.0002**.
- Whole build: about one day, with Claude Code writing it.

## Demo flow that works on camera
1. Cold open in the extension on keystoneprep.com: click Scan → boxes sweep → **F** → banner says "crawlers see an EMPTY page."
2. Same on evergreenconsulting.co → **B**. Open "Latency, cost & what Jev saw" → $0.00009.
3. Web app Compare with all three → columns line up → open /history, scans appear live.
4. Classifier Studio: change one level description, hit Test on last 5, show before → after.
5. Share card → LinkedIn preview. Fix-it report → email → unlocked schema snippet → "Talk to Waterfall Growth."

## The lesson / playbook (the "Greg Isenberg" angle)
New cheap capability (Jev makes *judgment* nearly free) + a specific niche you understand (education consultants) + a shareable score (a grade is a social object) = a lead magnet in a day. Same recipe: Trust Score for plumbers (license number, reviews), Portfolio Grader for wedding photographers, Menu Clarity Checker for restaurants.

## Tone / brand
Editorial, high-contrast, navy (#0b2a5b) and teal (#12a39a) from the glasses logo; orange (#ff4d00) reserved for anything "scanning." Copy is direct, no hype words. Tagline: "for education consultants."

## Honest caveats to keep the script truthful
- TrustLens only reads two pages per site; it judges structure and signals, not the quality of the consulting.
- Jev scores what the code extracted; if the extractor misses a testimonial, Jev never sees it.
- The rate limit and spend cap are real and shared (Convex), the Chrome extension is distributed as a zip (not on the Web Store), and the "email me the report" form unlocks on-page (no email is actually sent yet).
