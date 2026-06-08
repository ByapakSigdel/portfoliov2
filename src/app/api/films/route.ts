import { NextResponse } from "next/server";

// Live read of my Letterboxd diary so the movie card reflects newly-logged
// films automatically (the bundled src/data/letterboxd.json is just an offline
// fallback). Returns one random film per request; the upstream page is cached
// for an hour to stay friendly to Letterboxd.

export const dynamic = "force-dynamic";

const USER = "byapak";
const FILMS_URL = `https://letterboxd.com/${USER}/films/`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

type Film = { slug: string; title: string; year: number | null; rating: number | null; url: string };

function parseFilms(html: string): Film[] {
  const out: Film[] = [];
  // each film is one <li class="griditem"> — split on <li so the rating span
  // (rated-N) stays grouped with its own poster, whichever poster variant renders
  for (const chunk of html.split(/<li\b/)) {
    const slugM = chunk.match(/data-item-slug="([^"]+)"/);
    if (!slugM) continue;
    const slug = slugM[1];
    const name = (chunk.match(/data-item-name="([^"]*)"/) || [, ""])[1];
    const full = (chunk.match(/data-item-full-display-name="([^"]*)"/) || [, name])[1] || name;
    const yearM = full.match(/\((\d{4})\)\s*$/);
    const ratedM = chunk.match(/\brated-(\d+)\b/);

    const title = decode(name.replace(/\s*\(\d{4}\)\s*$/, "").trim()) || slug;
    out.push({
      slug,
      title,
      year: yearM ? Number(yearM[1]) : null,
      rating: ratedM ? Number(ratedM[1]) : null,
      url: `https://letterboxd.com/film/${slug}/`,
    });
  }
  return out;
}

export async function GET() {
  try {
    const res = await fetch(FILMS_URL, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ ok: false });
    const films = parseFilms(await res.text());
    if (!films.length) return NextResponse.json({ ok: false });
    const film = films[Math.floor(Math.random() * films.length)];
    return NextResponse.json({ ok: true, film, count: films.length });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
