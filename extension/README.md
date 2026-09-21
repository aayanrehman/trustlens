# TrustLens Chrome extension

Trust & AI-visibility audit for education consultants. Click **Scan this page**: `content.js` auto-scrolls the tab,
boxing every element it recognises (trust signals solid orange), while the server extracts the 12 signals and asks Jev.
The score is shown only after the whole page has been read, with a latency + cost meter.

## Load it (30 seconds, no store review)
1. Chrome → `chrome://extensions` → toggle **Developer mode** (top right).
2. **Load unpacked** → pick this `extension/` folder.
3. Pin TrustLens from the puzzle-piece menu. Click it on any site → side panel opens → **Scan this page**.

Optional: paste competitor URLs in the panel; "Compare vs N" opens the full side-by-side in the web app.
`API` in `sidepanel.js` points at the production deployment.
