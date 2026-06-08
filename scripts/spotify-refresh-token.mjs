#!/usr/bin/env node
// One-time helper to mint a Spotify refresh token for the now-playing + song cards.
//
//   1. Create an app at https://developer.spotify.com/dashboard
//   2. In its settings add the Redirect URI:  http://127.0.0.1:8888/callback
//   3. Put SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local, then run:
//        node scripts/spotify-refresh-token.mjs
//   4. Approve in the browser; the refresh token prints in the terminal.
//   5. Paste it into .env.local as SPOTIFY_REFRESH_TOKEN=...
//
// Requires Node 18+ (uses the built-in global fetch). No npm install needed.

import http from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ENV_PATH = join(ROOT, ".env.local");

// Auto-load credentials from .env.local (without overwriting real env vars) so
// you don't have to export them manually.
try {
  const txt = readFileSync(ENV_PATH, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — fall back to real env vars */
}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = "user-read-currently-playing user-read-recently-played user-top-read user-library-read";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET (set them in .env.local).");
  process.exit(1);
}

const authUrl = new URL("https://accounts.spotify.com/authorize");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("scope", SCOPES);
authUrl.searchParams.set("show_dialog", "true"); // force re-consent so new scopes are granted

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (u.pathname !== "/callback") {
    res.writeHead(404);
    res.end();
    return;
  }
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");
  if (err || !code) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`<p>Authorization failed: ${err ?? "no code"}. You can close this tab.</p>`);
    server.close();
    return;
  }
  try {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
    });
    const json = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(json));

    // write the refresh token straight into .env.local
    let wrote = false;
    try {
      let env = "";
      try {
        env = readFileSync(ENV_PATH, "utf8");
      } catch {
        /* file may not exist yet */
      }
      const line = `SPOTIFY_REFRESH_TOKEN=${json.refresh_token}`;
      env = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(env)
        ? env.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, line)
        : env.replace(/\s*$/, "") + "\n" + line + "\n";
      writeFileSync(ENV_PATH, env);
      wrote = true;
    } catch (e) {
      console.error("Could not auto-write .env.local:", e);
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Done — token saved. Close this tab and restart the dev server.</h2>");
    if (wrote) {
      console.log("\n✓ SPOTIFY_REFRESH_TOKEN written to .env.local — now restart `npm run dev`.\n");
    } else {
      console.log("\n=== SPOTIFY_REFRESH_TOKEN (paste into .env.local) ===\n");
      console.log(json.refresh_token + "\n");
    }
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end("<p>Token exchange failed — see terminal.</p>");
    console.error("Token exchange failed:", e);
  } finally {
    server.close();
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n1) Ensure this Redirect URI is in your Spotify app settings:\n   ${REDIRECT_URI}\n`);
  console.log(`2) Open this URL in your browser and approve:\n\n   ${authUrl.toString()}\n`);
  console.log("Waiting for the redirect…");
});
