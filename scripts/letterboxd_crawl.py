#!/usr/bin/env python3
"""
Scrape a Letterboxd user's films and write them to a local JSON file the
portfolio reads at build/runtime.

This is the static-site adaptation of the old `update_letterboxd_movies.py`,
which pushed scraped film links into a Supabase `recommendations` table. There
is no database here — the portfolio is static — so instead we write
`src/data/letterboxd.json`, and the Recommendations component picks a random
film from it on each visit (mirroring the old random-rec behaviour).

Usage:
  pip install -r scripts/requirements.txt
  python scripts/letterboxd_crawl.py --user byapak
  # only keep films you rated >= 4 stars, scrape your likes instead of all watched:
  python scripts/letterboxd_crawl.py --user byapak --min-rating 8 --likes

Output (src/data/letterboxd.json):
  {
    "user": "byapak",
    "source": "https://letterboxd.com/byapak/films/",
    "updated": "2026-06-02",
    "count": 42,
    "films": [
      { "title": "Spirited Away", "slug": "spirited-away",
        "url": "https://letterboxd.com/film/spirited-away/", "rating": 9 }
    ]
  }

`rating` is Letterboxd's half-star scale (1-10, so 9 == 4.5 stars) or null if
the film is unrated. Films are sorted by rating (desc) then title.
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import date

import requests
from bs4 import BeautifulSoup

BASE = "https://letterboxd.com"
HEADERS = {
    # a real browser UA — Letterboxd serves public HTML to normal clients
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# repo_root/scripts/letterboxd_crawl.py -> repo_root/src/data/letterboxd.json
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(REPO_ROOT, "src", "data", "letterboxd.json")

RATED_RE = re.compile(r"\brated-(\d+)\b")


def parse_page(html):
    """Return a list of {title, year, slug, url, rating} from one films-grid page.

    Letterboxd's grid markup is `<li class="griditem">` wrapping a react-component
    poster `<div>` that carries `data-item-slug`, `data-item-name`,
    `data-item-full-display-name` ("Title (Year)") and `data-target-link`, with a
    sibling `<p class="poster-viewingdata">` holding the `rated-N` rating span.
    """
    soup = BeautifulSoup(html, "html.parser")
    out = []
    items = soup.select("li.griditem")
    if not items:
        # tolerate older/alternate markup
        items = soup.select("li.poster-container")
    for li in items:
        poster = (
            li.find(attrs={"data-item-slug": True})
            or li.find(attrs={"data-film-slug": True})
            or li.find(attrs={"data-target-link": True})
        )
        if poster is None:
            continue

        slug = (poster.get("data-item-slug") or poster.get("data-film-slug") or "").strip().strip("/")
        if not slug:
            link = poster.get("data-target-link") or poster.get("data-item-link") or ""
            m = re.search(r"/film/([^/]+)/", link)
            slug = m.group(1) if m else ""
        if not slug:
            continue

        title = poster.get("data-item-name") or ""
        if not title:
            img = poster.find("img")
            title = (img.get("alt") if img else "") or slug.replace("-", " ").title()

        # year lives in the display name / title as a trailing "(YYYY)"
        year = None
        full = poster.get("data-item-full-display-name") or title
        ym = re.search(r"\((\d{4})\)\s*$", full)
        if ym:
            year = int(ym.group(1))
        # strip the trailing year off the title (we store it separately)
        title = re.sub(r"\s*\(\d{4}\)\s*$", "", title).strip()

        rating = None
        rspan = li.find("span", class_=RATED_RE)
        if rspan:
            for cls in rspan.get("class", []):
                m = RATED_RE.match(cls)
                if m:
                    rating = int(m.group(1))
                    break

        out.append(
            {
                "title": title.strip(),
                "year": year,
                "slug": slug,
                "url": f"{BASE}/film/{slug}/",
                "rating": rating,
            }
        )
    return out


def crawl(user, max_pages=20, delay=0.6, likes=False):
    section = "likes/films" if likes else "films"
    session = requests.Session()
    by_slug = {}

    for page in range(1, max_pages + 1):
        if page == 1:
            url = f"{BASE}/{user}/{section}/"
        else:
            url = f"{BASE}/{user}/{section}/page/{page}/"
        print(f"fetching {url}")
        try:
            r = session.get(url, headers=HEADERS, timeout=20)
        except requests.RequestException as e:
            print(f"  request error: {e}; stopping", file=sys.stderr)
            break
        if r.status_code != 200:
            print(f"  non-200 ({r.status_code}); stopping pagination")
            break

        films = parse_page(r.text)
        if not films:
            print("  no films on page; stopping")
            break
        for f in films:
            # keep the entry that carries a rating if we see the slug twice
            if f["slug"] not in by_slug or (f["rating"] and not by_slug[f["slug"]]["rating"]):
                by_slug[f["slug"]] = f
        print(f"  +{len(films)} (total {len(by_slug)})")
        time.sleep(delay)

    return list(by_slug.values())


def main():
    ap = argparse.ArgumentParser(description="Scrape Letterboxd films to a JSON file.")
    ap.add_argument("--user", "-u", default="byapak", help="Letterboxd username")
    ap.add_argument("--out", "-o", default=DEFAULT_OUT, help="output JSON path")
    ap.add_argument("--max-pages", type=int, default=20, help="max grid pages to scrape")
    ap.add_argument("--min-rating", type=int, default=0,
                    help="drop films rated below this (1-10 half-star scale; unrated are kept)")
    ap.add_argument("--likes", action="store_true", help="scrape /likes/films instead of all watched")
    ap.add_argument("--delay", type=float, default=0.6, help="seconds between requests")
    args = ap.parse_args()

    films = crawl(args.user, max_pages=args.max_pages, delay=args.delay, likes=args.likes)

    if args.min_rating:
        films = [f for f in films if f["rating"] is None or f["rating"] >= args.min_rating]

    # rating desc (unrated last), then title
    films.sort(key=lambda f: (-(f["rating"] or 0), f["title"].lower()))

    payload = {
        "user": args.user,
        "source": f"{BASE}/{args.user}/{'likes/films' if args.likes else 'films'}/",
        "updated": date.today().isoformat(),
        "count": len(films),
        "films": films,
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print(f"\nwrote {len(films)} films -> {args.out}")
    if not films:
        print("note: 0 films scraped — Letterboxd may be rate-limiting; try again "
              "or run from a normal network.", file=sys.stderr)


if __name__ == "__main__":
    main()
