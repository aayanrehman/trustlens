# TrustLens Chrome extension

Scans the tab you're on. The side panel streams the score from the TrustLens server (keys stay there);
`content.js` draws boxes on the live page around every signal it finds, then shows the grade in a banner.

## Load it (30 seconds, no store review)
1. Chrome → `chrome://extensions` → toggle **Developer mode** (top right).
2. **Load unpacked** → pick this `extension/` folder.
3. Pin TrustLens from the puzzle-piece menu. Click it on any site → side panel opens → **Scan this page**.

Optional: paste competitor URLs in the panel; "Compare vs N" opens the full side-by-side in the web app.
`API` in `sidepanel.js` points at the production deployment.
