import type { NextConfig } from "next";

// The Chrome extension calls the API from a chrome-extension:// origin, so the API is CORS-open.
const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/api/:path*", headers: [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "content-type" },
    ] }];
  },
};
export default nextConfig;
