import type { Metadata } from "next";
export const metadata: Metadata = { title: "TrustLens privacy policy" };

// Required by the Chrome Web Store for extensions with host permissions. Plain language, and true.
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-[15px] leading-relaxed">
      <div className="eyebrow">Privacy policy · last updated 21 September 2026</div>
      <h1 className="display text-4xl mt-2">TrustLens privacy</h1>
      <p className="mt-6">TrustLens (the website and the Chrome extension) audits publicly available websites. It is made by Waterfall Growth for education consultants.</p>
      <h2 className="display text-2xl mt-8">What the extension does</h2>
      <p className="mt-2">When you click <em>Scan this page</em>, the extension reads the URL of the tab you are on and sends that URL to the TrustLens server. It also draws temporary outlines on the page you are viewing to show what it found. It does nothing until you click, and it never runs on pages you have not asked it to scan.</p>
      <h2 className="display text-2xl mt-8">What we collect</h2>
      <ul className="list-disc pl-6 mt-2 space-y-1">
        <li>The URL you asked us to scan, and the publicly visible content of that page (title, description, testimonials, credentials, links) that our server fetches itself.</li>
        <li>The resulting scores, and a one-way hash of your IP address used only to limit how many scans one visitor can run per hour. We do not store raw IP addresses.</li>
      </ul>
      <p className="mt-2">We do not collect your name, email, browsing history, page contents from other tabs, form entries, cookies, or anything typed into the page. The extension does not track you across sites.</p>
      <h2 className="display text-2xl mt-8">Who sees it</h2>
      <p className="mt-2">Scan results are public: anyone with a result link can view it, and recent scans appear in a public feed. The extracted signals are sent to TypeSafe (typesafe.ai) to be scored by their Jev model, and the site URL is sent to Google&rsquo;s PageSpeed Insights API for a speed score. We do not sell data.</p>
      <h2 className="display text-2xl mt-8">Contact</h2>
      <p className="mt-2">Questions or removal requests: <a className="underline" href="mailto:aayan.rehmann@gmail.com">aayan.rehmann@gmail.com</a>.</p>
    </main>
  );
}
