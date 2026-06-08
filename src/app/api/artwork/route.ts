import { NextResponse } from "next/server";

// A random public-domain masterpiece from the Art Institute of Chicago (no API
// key needed). Re-rolls each request; the upstream page is cached for an hour.

export const dynamic = "force-dynamic";

const API = "https://api.artic.edu/api/v1/artworks";
const FIELDS = "id,title,artist_title,image_id,date_display,is_public_domain";

type Artwork = {
  id: number;
  title: string;
  artist_title?: string;
  image_id?: string;
  date_display?: string;
  is_public_domain?: boolean;
};

export async function GET() {
  try {
    const page = 1 + Math.floor(Math.random() * 30);
    const res = await fetch(`${API}?fields=${FIELDS}&limit=100&page=${page}`, {
      headers: { "User-Agent": "mahan-portfolio (mail@mahansigdel.com.np)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ ok: false });
    const json = await res.json();
    const iiif: string = json?.config?.iiif_url ?? "https://www.artic.edu/iiif/2";
    const arts: Artwork[] = (json?.data ?? []).filter(
      (a: Artwork) => a.image_id && a.is_public_domain && a.title,
    );
    if (!arts.length) return NextResponse.json({ ok: false });

    const a = arts[Math.floor(Math.random() * arts.length)];
    return NextResponse.json({
      ok: true,
      title: a.title,
      artist: a.artist_title || "unknown artist",
      date: a.date_display || "",
      image: `${iiif}/${a.image_id}/full/400,/0/default.jpg`,
      url: `https://www.artic.edu/artworks/${a.id}`,
    });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
