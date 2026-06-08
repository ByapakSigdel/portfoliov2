import { NextResponse } from "next/server";

// Live "now playing" from Spotify. Uses the Authorization-Code refresh-token
// flow: a one-time refresh token (minted via scripts/spotify-refresh-token.mjs)
// is exchanged server-side for a short-lived access token on each request.
//
// Set these in .env.local (and your host's env):
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
// When unset, the route reports { configured: false } and the UI falls back to
// its static text — so the site works fine without Spotify wired up.

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENT_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=1";

// cache the access token across requests on a warm instance to avoid re-minting
let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 5_000) return cachedToken.token;

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN as string,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const json = await res.json();
  cachedToken = {
    token: json.access_token,
    exp: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.token;
}

type Track = {
  name: string;
  artists?: { name: string }[];
  album?: { name?: string; images?: { url: string }[] };
  external_urls?: { spotify?: string };
};

function shape(item: Track, isPlaying: boolean, recent = false) {
  const images = item.album?.images ?? [];
  return {
    configured: true,
    isPlaying,
    recent,
    title: item.name,
    artist: (item.artists ?? []).map((a) => a.name).join(", "),
    album: item.album?.name ?? null,
    albumArt: images[images.length - 1]?.url ?? images[0]?.url ?? null,
    url: item.external_urls?.spotify ?? null,
  };
}

export async function GET() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return NextResponse.json({ configured: false, isPlaying: false });
  }

  try {
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

    // currently playing (204 = nothing playing)
    const now = await fetch(NOW_PLAYING_URL, { headers, cache: "no-store" });
    if (now.status === 200) {
      const data = await now.json();
      if (data?.item) return NextResponse.json(shape(data.item, !!data.is_playing));
    }

    // fallback: most recently played track
    const recent = await fetch(RECENT_URL, { headers, cache: "no-store" });
    if (recent.ok) {
      const data = await recent.json();
      const item = data?.items?.[0]?.track;
      if (item) return NextResponse.json(shape(item, false, true));
    }

    return NextResponse.json({ configured: true, isPlaying: false });
  } catch {
    // never surface an error to the card — just let it fall back
    return NextResponse.json({ configured: true, isPlaying: false });
  }
}
