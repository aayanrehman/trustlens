# Handoff prompt — TrustLens intro video

Paste everything below the line into a new chat, opened in `~/Desktop/waterfallgrowth/trustlens`.

---

I want a short, genuinely cool intro video for **TrustLens**, a product I built. Target ~20–30 seconds, 1920×1080 (plus a 9:16 cut if it's cheap to do). It has three jobs: cold open for a YouTube video about the Jev model, a standalone post on LinkedIn/X, and a hero loop on the site. No narration required — motion, type and one or two real screen moments should carry it. Music optional but welcome.

## Pick the tool first, and tell me why before you build

Three candidates. I lean toward the motion-graphics/HyperFrames route, but you decide and justify it in two lines:

1. **`/brag`** — https://github.com/latent-spaces/brag. Reads the project, works out the story, renders a ~20s launch video with music, motion and share copy in one command. Install: `npx skills add https://github.com/latent-spaces/brag --skill brag` (or `/plugin marketplace add latent-spaces/brag` then `/plugin install brag@brag`). Needs Node 22+, ffmpeg, and the HyperFrames CLI. **Fast baseline — I'd like you to run this first so we have something in ten minutes, then decide whether to beat it.**
2. **HyperFrames, art-directed** — the `hyperframes` skill is the mandatory entry point and routes to the right workflow (for a short, unnarrated, motion-first piece that's the motion-graphics workflow). This is how we get something actually distinctive rather than templated. Expect this to be the real deliverable.
3. **`motion-broll`** — https://github.com/Barty-Bart/motion-graphics (`npx skills add Barty-Bart/motion-graphics`). Animated B-roll synced to a transcript over **existing narrated footage**. That's not this job — save it for the main YouTube video once I've recorded a voice track. Don't use it for the intro unless you can show me why it fits.

HeyGen only if you think a presenter shot helps; I'd rather keep this faceless and typographic.

## What TrustLens is (use these facts, don't invent any)

Full brief: `docs/trustlens-product-brief.md`. Read it. The short version:

Paste a URL (or click a Chrome extension on any site) and TrustLens grades a website on five axes — **SEO, AI Search Visibility, Trust, Authority, Discoverability** — plus a letter grade and a fix-it plan. The twist: deterministic code extracts 12 signals from the page, and only those 12 fields go to **Jev**, TypeSafe's "System One" model, which doesn't write text — it returns typed judgments (yes/no probability, one-of-a-set, or a position on described levels). Jev never sees raw HTML. A full audit costs **$0.00016** and the model call takes about **half a second**.

Lines that are true and worth stealing for on-screen type:

- "Jev never sees raw HTML."
- "Jev judges. Code calculates."
- "12 signals in. One letter out."
- "$0.00016 per site."
- "Your website is invisible to AI. Here's the proof."
- Real results: evergreenconsulting.co → **B 78**. keystoneprep.com → **F 24** (it's a client-side React app: the HTML it serves crawlers is 847 bytes and an empty `<div>`). avaloncollegeadvising.com → **blocked** (bot-protection challenge; ChatGPT's crawler hits the same wall).

Do **not** claim: that it replaces an SEO agency, that it crawls whole sites (it reads two pages), that Jev is an LLM, or any number not listed above or in the brief.

## Brand

- Navy `#0B2A5B` — primary. Teal `#12A39A` — secondary. **Orange `#FF4D00` — reserved strictly for scanning/active states.** Ink `#1C2430`, warm paper `#F7F4ED`, white cards.
- Logo: `extension/logo.png` (1774×887, round glasses + chain links) and `public/logo-480.png`. Wordmark is "Trust" in ink + "Lens" in teal, serif.
- Feel: editorial, high-contrast, confident, a little hand-drawn. Not corporate SaaS gradient soup. One accent idea per beat.

## Assets that already exist

- `extension/logo.png`, `public/logo-480.png` — logo
- `docs/board-zones/zone-1.png` … `zone-10.png` — ten hand-drawn explainer panels (Excalidraw) covering exactly this story: not-a-chatbot, the three primitives, the field contract, one call/four judgments, scoring in code, the funnel. **These are the best ready-made visual material in the repo.** Source: `docs/jev-system-one-trustlens.excalidraw`, regenerate with `node scripts/excalidraw-board.mjs`.
- `docs/jev-system-one-trustlens-overview.png` — the whole board as one long strip (nice for a fast horizontal pan)
- The live app at https://trustlens-mauve.vercel.app and the share-card endpoint `/api/og?d=…`, which renders a real 1200×630 result card

## Assets that DON'T exist yet — the one that matters

There is **no screen recording of the Chrome extension scanning a site**, and that's the money shot: you click Scan, the page scrolls itself, and every element gets boxed in orange — testimonials and credentials solid and pulsing, everything else thin — with a teal-to-orange beam sweeping the viewport, then the grade lands. It looks like the site is being x-rayed.

Either tell me exactly how to record it (which site, how long, what to click) and I'll capture it, or capture it yourself if you can drive a browser. Extension lives in `extension/`, loaded unpacked via `chrome://extensions`. Good subjects: `evergreenconsulting.co` (lots of boxes, ends on B) or `keystoneprep.com` (almost nothing to box, ends on a brutal F).

## The beat I want at the centre

The emotional hook isn't the product, it's the reveal: **a website that looks perfectly fine to a human is invisible to AI.** Something like — nice-looking site → scan sweeps → boxes light up → cut to what the crawler actually receives (847 bytes, an empty div) → **F 24** → TrustLens logo. If you find a sharper structure, take it.

## Constraints

- Everything on screen must be real: real UI, real scores, real numbers. No mocked dashboards with invented metrics.
- Legible at phone size; no text smaller than it needs to be; readable in under 30 seconds.
- Deliver the source project (so I can re-render with tweaks) plus an MP4 at 1080p, and tell me the exact command to re-render.
- Check in once with the plan/storyboard before you render anything long.

## Environment

macOS, Node v22.23.1, ffmpeg 8.1 installed, HyperFrames CLI **not** installed yet, `/brag` and `motion-broll` **not** installed yet. HyperFrames skills are already available in the session. Project root: `~/Desktop/waterfallgrowth/trustlens`.

Start by reading `docs/trustlens-product-brief.md` and looking at two or three of the board zone PNGs, then tell me your tool choice and a 6–8 beat storyboard.
