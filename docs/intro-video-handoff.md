# Handoff prompt — TrustLens intro video (v2)

Open a new chat **in `~/Desktop/waterfallgrowth/trustlens`** and paste everything below the line.

---

Build me a short intro video for **TrustLens**, a product in this repo. ~20–30 seconds, 1920×1080, plus a 9:16 cut if it's cheap. Three jobs: cold open for a YouTube video about the Jev model, a standalone LinkedIn/X post, and a hero loop on the site. No narration — motion, type and real screen footage carry it. Music welcome.

**The bar: it has to look genuinely expensive.** Not a template, not a logo sliding in over a gradient. If it looks like every other AI-product launch video, it failed. Read the craft rules below before you plan anything — they're what separate this from slop.

## Tool choice — decide and justify in two lines before building

1. **`/brag`** — https://github.com/latent-spaces/brag. Reads the project and renders a ~20s launch video with music, motion and share copy in one command. `npx skills add https://github.com/latent-spaces/brag --skill brag` (or `/plugin marketplace add latent-spaces/brag` → `/plugin install brag@brag`). Needs Node 22+, ffmpeg, HyperFrames CLI. **Run this first as a ten-minute baseline so we have something, then beat it.**
2. **HyperFrames, art-directed** — the `hyperframes` skill is the mandatory entry point and routes to the motion-graphics workflow for a short unnarrated piece. **This is the real deliverable.** Skills already installed here.
3. **`motion-broll`** — https://github.com/Barty-Bart/motion-graphics. Built for B-roll synced to a *narrated transcript*, which this isn't. **Don't install it for this job** — but steal its craft rules, which I've transcribed below with the voice dependency removed. Save the actual skill for the main YouTube video once I've recorded a voice track.

Faceless and typographic, please. No HeyGen avatar unless you can argue for it.

---

## Craft rules (adapted from motion-broll, voice-track dependency removed)

Its timing rules are anchored to spoken words. There's no voice here, so **the music grid replaces the transcript**: pick the track first, get its BPM, and land every state change on a beat.

**Pacing** — one change per beat, **0.4–1.2 s apart**. Nothing holds longer than ~1.2 s without something changing. Zero dead time: if a frame isn't advancing the idea, cut it.

**One idea per clip.** A beat shows one thing. Never two simultaneous state changes competing for the eye.

**Motion language** — springs with *minimal* overshoot. Leading and trailing edges use different springs so shapes stretch slightly as they move. Camera zoom fills each state to frame.

**Banned outright** (their list, and I agree): bouncy easing, particles, glows, gradients on UI chrome, mixed icon stroke weights, dead time, template-like effects, invented data.

**Text swaps** need their own enter *and* exit timing or old and new text overlap for a frame. Items sliding under a highlight need fast springs or the highlight sits empty.

**Motion blur is the thing that makes it look expensive.** Their pipeline renders 4 sub-frames per output frame through headless Chromium, then blends in ffmpeg. Slower than real time; parallelise it. Do this — it's the single biggest quality difference between "made in a day" and "made by a studio".

**Never apply `will-change` to anything the camera scales** — text renders blurry.

**Cursor safety**: if real footage shows a cursor, keep it inside frame at every zoom level.

**Never invent numbers, quotes or results.** Real figures only (list below), or relative bars / skeleton text.

Their default palette is coincidentally almost ours (warm canvas, black ink, orange accent) — use **our** exact tokens instead, below.

---

## Footage — status and how to get it

The single best asset TrustLens can produce is **the Chrome extension scanning a live site**: you click Scan, the page scrolls itself, every element gets boxed in orange (trust signals solid and pulsing, everything else thin), a teal-to-orange beam sweeps the viewport, and the grade lands. It looks like the site is being x-rayed.

**I recorded two takes and lost them** — macOS keeps unsaved screen recordings in a temp folder that purges when you dismiss the thumbnail. There is currently **no usable footage in the repo.** They were also sloppy takes, so this is a chance to do it properly.

**Give me an exact re-record recipe before anything else**, or capture it yourself if you can drive a real Chrome with an unpacked extension (the in-app browser can't load extensions, so this is probably on me). What I need from you: which sites, which window size, what to click, how long to hold at the end, and where to save. My constraints:

- Chrome, retina display. Last capture was 2926×1860 @ 60 fps, which downscales to 1080p cleanly — tell me if you want a specific window size instead.
- Extension is in `extension/`, loaded unpacked via `chrome://extensions`, side panel on the right.
- Good subjects: **evergreenconsulting.co** (many boxes, ends on **B 78**) and **keystoneprep.com** (almost nothing to box, ends on **F 24**).
- Tell me explicitly to hide the bookmarks bar, close other tabs, and **save the file to `media/raw/` immediately** rather than leaving it in the thumbnail.

**Assume the raw takes will be sloppy** — hesitation, a stray cursor, a mis-click, wrong pacing. Plan to treat them, not to cut them in raw: punch-in crops so browser chrome never dominates, speed ramps (rush the boring scroll, slow the moment a box snaps on), freeze-and-hold on the grade, mask or crop out the cursor if it wanders, and match the footage's white to our paper tone so it sits inside the palette instead of glaring. If a take is unusable, tell me exactly what to redo.

## The beat I want at the centre

The hook isn't the product, it's the reveal: **a website that looks perfectly fine to a human is invisible to AI.**

Rough shape — nice-looking site → scan sweep → boxes light up → hard cut to what the crawler actually receives (847 bytes, an empty `<div>`) → **F 24** → logo. Find a sharper structure if you can, but keep that turn.

## What TrustLens is (facts — don't invent any)

Full brief: `docs/trustlens-product-brief.md`. **Read it first.** Short version:

Paste a URL (or click the extension on any site) and TrustLens grades a website on five axes — **SEO, AI Search Visibility, Trust, Authority, Discoverability** — plus a letter grade and a fix-it plan. Deterministic code extracts 12 signals from the page, and only those 12 fields go to **Jev**, TypeSafe's "System One" model, which doesn't write text — it returns typed judgments (yes/no probability, one-of-a-set, or a position on described levels). Jev never sees raw HTML. An audit costs **$0.00016**; the model call takes about **half a second**.

True lines worth putting on screen:

- "Jev never sees raw HTML."
- "Jev judges. Code calculates."
- "12 signals in. One letter out."
- "$0.00016 per site."
- Real results: evergreenconsulting.co → **B 78** · keystoneprep.com → **F 24** (client-side React app; the HTML served to crawlers is 847 bytes and an empty `<div>`) · avaloncollegeadvising.com → **blocked** (bot-protection challenge — ChatGPT's crawler hits the same wall).

Don't claim: that it replaces an SEO agency, that it crawls whole sites (it reads two pages), that Jev is an LLM, or any number not listed here or in the brief.

## Brand

- Navy `#0B2A5B` primary · Teal `#12A39A` secondary · **Orange `#FF4D00` reserved strictly for scanning/active states** · Ink `#1C2430` · warm paper `#F7F4ED` · white cards.
- Logo: `extension/logo.png` (1774×887, round glasses + chain links), `public/logo-480.png`. Wordmark: "Trust" in ink + "Lens" in teal, serif.
- Feel: editorial, high-contrast, confident, slightly hand-drawn. One accent idea per beat. No SaaS gradient soup.

## Assets that already exist

- `docs/board-zones/zone-1.png` … `zone-10.png` — ten hand-drawn Excalidraw panels covering exactly this story (not-a-chatbot, three primitives, field contract, one call/four judgments, scoring in code, the funnel). **The best ready-made material in the repo.** Source `docs/jev-system-one-trustlens.excalidraw`, regenerate via `node scripts/excalidraw-board.mjs` — so you can re-render any panel at any size or recolour it.
- `docs/jev-system-one-trustlens-overview.png` — whole board as one strip; good for a fast horizontal pan.
- `extension/logo.png`, `public/logo-480.png`.
- Live app https://trustlens-mauve.vercel.app and `/api/og?d=…`, which renders a real 1200×630 result card you can pull as a still.

## Deliverables

- Source project, so I can re-render with tweaks, plus the exact re-render command.
- MP4 1080p, and the 9:16 cut if you did one.
- A frame-accurate note of which real footage went where, so I know what to re-shoot if I improve a take.

## Environment

macOS · Node v22.23.1 · ffmpeg 8.1 installed · HyperFrames CLI **not** installed · `/brag` **not** installed · HyperFrames skills available in-session · project root `~/Desktop/waterfallgrowth/trustlens`.

**Start by:** reading `docs/trustlens-product-brief.md`, opening two or three board-zone PNGs, then giving me (a) your tool choice, (b) the screen-recording recipe so I can capture while you build, and (c) a 6–8 beat storyboard with timings against a chosen BPM. Check in on that before rendering anything long.
