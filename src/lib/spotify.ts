// Shared Spotify helpers for the server routes (now-playing, top-track).
// Uses the Authorization-Code refresh-token flow: a one-time refresh token
// (minted via scripts/spotify-refresh-token.mjs) is exchanged for short-lived
// access tokens. When env vars are missing, spotifyConfigured() is false and
// routes report { configured: false } so the UI falls back to static content.

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
const TOKEN_URL = "https://accounts.spotify.com/api/token";

export function spotifyConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN);
}

// cache the access token across requests on a warm instance
let cachedToken: { token: string; exp: number } | null = null;

export async function getAccessToken(): Promise<string> {
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

export type SpotifyTrack = {
  name: string;
  artists?: { name: string }[];
  album?: { name?: string; images?: { url: string }[] };
  external_urls?: { spotify?: string };
};

export function shapeTrack(item: SpotifyTrack) {
  const images = item.album?.images ?? [];
  return {
    title: item.name,
    artist: (item.artists ?? []).map((a) => a.name).join(", "),
    album: item.album?.name ?? null,
    albumArt: images[images.length - 1]?.url ?? images[0]?.url ?? null,
    url: item.external_urls?.spotify ?? null,
  };
}
