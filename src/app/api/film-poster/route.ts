import { NextResponse } from "next/server";

// Returns a Letterboxd film's poster (its og:image) for a given slug, so the
// movie card can show a small poster. Called on-demand for the one random film
// per page load — no mass pre-scraping. Falls back to { ok: false } -> icon.

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9-]+$/i;

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") || "";
  if (!SLUG_RE.test(slug)) return NextResponse.json({ ok: false });
  try {
    const res = await fetch(`https://letterboxd.com/film/${slug}/`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" },
      next: { revalidate: 86400 }, // posters rarely change — cache a day
    });
    if (!res.ok) return NextResponse.json({ ok: false });
    const html = await res.text();
    const og = (html.match(/<meta property="og:image" content="([^"]+)"/) || [, null])[1];
    return NextResponse.json({ ok: !!og, poster: og });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
