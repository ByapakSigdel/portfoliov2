import { NextResponse } from "next/server";
import { spotifyConfigured, getAccessToken, shapeTrack, type SpotifyTrack } from "@/lib/spotify";

// A random recent *liked* song for the taste section's "song" card. Saved tracks
// come back newest-first, so we pick from the freshest slice — never a dusty old
// like — and re-roll on every request.

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SAVED_URL = "https://api.spotify.com/v1/me/tracks?limit=50";
const RECENT_WINDOW = 30; // only consider the 30 most-recently-liked

export async function GET() {
  if (!spotifyConfigured()) return NextResponse.json({ configured: false });
  try {
    const token = await getAccessToken();
    const res = await fetch(SAVED_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const items = (data?.items ?? []) as { track: SpotifyTrack }[];
      if (items.length) {
        const pool = items.slice(0, Math.min(items.length, RECENT_WINDOW));
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (pick?.track) return NextResponse.json({ configured: true, ...shapeTrack(pick.track) });
      }
    }
    return NextResponse.json({ configured: true });
  } catch {
    return NextResponse.json({ configured: true });
  }
}
