"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo } from "react";

// Wraps the app only when Convex is configured; otherwise children render as-is.
export default function ConvexClient({ children }: { children: React.ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(() => (url ? new ConvexReactClient(url) : null), [url]);
  return client ? <ConvexProvider client={client}>{children}</ConvexProvider> : <>{children}</>;
}
