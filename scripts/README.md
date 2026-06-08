# scripts

## letterboxd_crawl.py

Scrapes a Letterboxd user's films into `src/data/letterboxd.json`, which the
**Recommendations** component reads — the "movie" card picks a random film from
it on each visit.

This replaces the old Supabase-backed `update_letterboxd_movies.py`: the new
portfolio is static, so we write a local JSON file instead of pushing rows to a
database.

```bash
pip install -r scripts/requirements.txt

# all watched films
python scripts/letterboxd_crawl.py --user byapak

# only films you rated 4 stars (8/10) or higher
python scripts/letterboxd_crawl.py --user byapak --min-rating 8

# your liked films only
python scripts/letterboxd_crawl.py --user byapak --likes
```

Re-run whenever you want to refresh the list, then commit the updated
`src/data/letterboxd.json`. `rating` is Letterboxd's half-star scale (1-10, so
`9` = 4.5 stars) or `null` if unrated.

> If it scrapes 0 films, Letterboxd is likely rate-limiting the request — wait a
> bit and retry, or run it from a normal (non-CI) network.

## spotify-refresh-token.mjs

Mints the one-time refresh token that powers the live **listening** card in the
"now" section (`src/app/api/now-playing`). Node 18+, no dependencies.

1. Create an app at <https://developer.spotify.com/dashboard>.
2. In its settings, add the Redirect URI `http://127.0.0.1:8888/callback`.
3. Run it with your app's credentials in the environment:

   ```powershell
   # PowerShell
   $env:SPOTIFY_CLIENT_ID="..."; $env:SPOTIFY_CLIENT_SECRET="..."
   node scripts/spotify-refresh-token.mjs
   ```

4. Open the printed URL, approve, and copy the refresh token from the terminal.
5. Put all three values in `.env.local` (see `.env.local.example`), then add the
   same vars to your host (e.g. Vercel project env).

The card shows your currently-playing track, falling back to your most recently
played one. With no credentials set it quietly shows the static text instead.

> Needs a host that runs Next.js server functions (Vercel/Node) — it won't work
> as a fully static export.
