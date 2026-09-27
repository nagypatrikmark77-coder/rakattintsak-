import type { NextConfig } from "next";

// A Supabase publikus URL-je és anon kulcsa: NEXT_PUBLIC_* (Vercel), vagy helyben a SUPABASE_ANON_KEY-ből.
// Az URL-t az anon kulcs projekt-azonosítójából (ref) származtatjuk, ha nincs megadva http(s) URL.
function supabasePublicEnv() {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!url && process.env.SUPABASE_URL?.startsWith("https://")) url = process.env.SUPABASE_URL;
  if (!url && anon.startsWith("eyJ")) {
    try {
      const ref = JSON.parse(Buffer.from(anon.split(".")[1], "base64url").toString()).ref;
      if (ref) url = `https://${ref}.supabase.co`;
    } catch {}
  }
  return { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anon };
}

const nextConfig: NextConfig = {
  env: supabasePublicEnv(),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
