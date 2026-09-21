import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: "variable", axes: ["opsz"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jet = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jet", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "TrustLens — trust & AI-visibility audit for consultant websites",
  description: "Paste a URL. Get an SEO, GEO, Trust and Discoverability grade, scored live by TypeSafe's Jev from a strict field contract.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jet.variable}`}>
      <body className="min-h-screen">
        <header className="border-b rule">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="display text-2xl leading-none">Trust<span className="text-accent">Lens</span></Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="hover:text-accent">Scan</Link>
              <Link href="/studio" className="hover:text-accent">Classifier Studio</Link>
              <a href="https://docs.typesafe.ai" target="_blank" rel="noreferrer" className="eyebrow hover:text-accent">Jev by TypeSafe ↗</a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
