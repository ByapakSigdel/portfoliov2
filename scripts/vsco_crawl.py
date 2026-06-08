#!/usr/bin/env python3
"""Scrape a VSCO user's gallery into src/data/vsco.json.

The "photo" card in the taste section reads this file and shows a random shot,
linking to that specific photo's VSCO page.

VSCO has no official public API and aggressively blocks bots (Cloudflare), so the
live API mode often 403s. Two modes:

  # 1) live (works from some residential networks)
  python scripts/vsco_crawl.py --user byapak

  # 2) reliable: save https://vsco.co/byapak/gallery from your *logged-in*
  #    browser (Ctrl+S -> "Webpage, HTML Only"), then parse that file:
  python scripts/vsco_crawl.py --user byapak --html ~/Downloads/gallery.html

Mode 2 sidesteps Cloudflare entirely because the HTML comes from your browser.
"""

import argparse
import json
import os
import re
import sys
from datetime import date

import requests

PUBLIC_TOKEN = "7356455548d0a1d886db010883388d08be84d0c9"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(REPO_ROOT, "src", "data", "vsco.json")


def _norm(u: str) -> str:
    if u.startswith("//"):
        return "https:" + u
    return u


def from_html(path: str, user: str):
    """Extract gallery photos from a saved VSCO page.

    The gallery is a SPA that embeds its media as JSON, e.g.
    "responsiveUrl":"im.vsco.co\\u002F..." (escaped slashes), plus the featured
    shot as an og:image. We collect both, decode the slashes, de-dupe, and derive
    each photo's permalink from the 24-hex media id in its CDN path.
    """
    with open(path, encoding="utf-8", errors="ignore") as f:
        raw = f.read()

    cands = re.findall(r'"responsiveUrl":"([^"]+)"', raw)
    cands += re.findall(r'content="(https?://im\.vsco\.co/[^"]+)"', raw)

    out = []
    seen = set()
    for c in cands:
        u = c.replace("\\u002F", "/").replace("\\/", "/")
        if u.startswith("//"):
            u = "https:" + u
        if not u.startswith("http"):
            u = "https://" + u
        base = u.split("?")[0]
        if "im.vsco.co" not in base or base in seen:
            continue
        seen.add(base)
        mid = next((seg for seg in base.split("/") if re.fullmatch(r"[a-f0-9]{24}", seg)), None)
        out.append(
            {
                "url": base + "?w=600",
                "link": f"https://vsco.co/{user}/media/{mid}" if mid else base,
                "alt": "",
            }
        )
    return out


def from_api(user: str, limit: int):
    s = requests.Session()
    h = {
        "Authorization": f"Bearer {PUBLIC_TOKEN}",
        "User-Agent": UA,
        "Referer": f"https://vsco.co/{user}/gallery",
        "Accept": "application/json",
    }
    try:
        s.get(f"https://vsco.co/{user}/gallery", headers={"User-Agent": UA}, timeout=20)
    except requests.RequestException:
        pass

    r = s.get(f"https://vsco.co/api/2.0/sites?subdomain={user}", headers=h, timeout=20)
    if r.status_code != 200:
        print(f"sites lookup failed ({r.status_code}) — VSCO is blocking this network. "
              "Use --html mode instead (see the script header).", file=sys.stderr)
        return []
    sites = r.json().get("sites", [])
    if not sites:
        print(f"no VSCO user '{user}'", file=sys.stderr)
        return []
    site_id = sites[0]["id"]

    r2 = s.get(
        f"https://vsco.co/api/3.0/medias/profile?site_id={site_id}&limit={limit}",
        headers=h, timeout=20,
    )
    if r2.status_code != 200:
        print(f"medias fetch failed ({r2.status_code}) — try --html mode.", file=sys.stderr)
        return []

    out = []
    for m in r2.json().get("media", []):
        img = m.get("image") or m
        url = img.get("responsive_url") or img.get("grid_url")
        if not url:
            continue
        mid = img.get("_id") or img.get("id") or ""
        out.append(
            {
                "url": _norm(url if url.startswith(("http", "//")) else "https://" + url),
                "link": f"https://vsco.co/{user}/media/{mid}" if mid else f"https://vsco.co/{user}/gallery",
                "alt": img.get("description") or "",
            }
        )
    return out


def main():
    ap = argparse.ArgumentParser(description="Scrape a VSCO gallery to JSON.")
    ap.add_argument("--user", "-u", default="byapak", help="VSCO username")
    ap.add_argument("--out", "-o", default=DEFAULT_OUT, help="output JSON path")
    ap.add_argument("--limit", type=int, default=14, help="max photos (API mode)")
    ap.add_argument("--html", help="parse a saved gallery .html file instead of the API")
    args = ap.parse_args()

    photos = from_html(args.html, args.user) if args.html else from_api(args.user, args.limit)

    payload = {
        "user": args.user,
        "source": f"https://vsco.co/{args.user}/gallery",
        "updated": date.today().isoformat(),
        "count": len(photos),
        "photos": photos,
    }
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"wrote {len(photos)} photos -> {args.out}")
    if not photos:
        print("note: 0 photos — if the API was blocked, use --html mode (see script header).", file=sys.stderr)


if __name__ == "__main__":
    main()
