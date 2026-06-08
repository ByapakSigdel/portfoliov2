import { NextResponse } from "next/server";

// Returns a random recent issue of the "chiyapop guff" Substack — title, url and
// cover image — so the newsletter card links to a fresh issue each visit.

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FEED = "https://chiyapg.substack.com/feed";

function field(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
  return m ? m[1].trim() : "";
}

export async function GET() {
  try {
    // refetch the feed at most hourly; the random pick still varies per request
    const res = await fetch(FEED, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ ok: false });
    const xml = await res.text();

    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    const parsed = items
      .map((it) => {
        const img =
          (it.match(/<enclosure[^>]+url="([^"]+)"/) || it.match(/<img[^>]+src="([^"]+)"/) || [, null])[1];
        return { title: field(it, "title"), url: field(it, "link"), image: img };
      })
      .filter((p) => p.url);

    if (!parsed.length) return NextResponse.json({ ok: false });

    // pick from the latest handful so it stays recent but rotates
    const pool = parsed.slice(0, 8);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return NextResponse.json({ ok: true, ...pick });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
