"use client";
import { useEffect, useState } from "react";
import { Music, Film, Camera, Coffee, Palette, Star } from "lucide-react";
import letterboxd from "@/data/letterboxd.json";
import vsco from "@/data/vsco.json";

type Film = { title: string; year?: number | null; slug: string; url: string; rating: number | null };
const films = (letterboxd.films ?? []) as Film[];

type Photo = { url: string; link?: string; alt?: string };
const photos = (vsco.photos ?? []) as Photo[];

// Letterboxd rates on a 1-10 half-star scale -> "★★★★½"
function stars(rating: number | null): string {
  if (!rating) return "";
  const full = Math.floor(rating / 2);
  const half = rating % 2 === 1;
  return "★".repeat(full) + (half ? "½" : "");
}

// stable on the server (index 0); reshuffles to a random pick after mount so
// each visit differs — no hydration mismatch.
function useRandom<T>(items: T[]): T | null {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length > 1) setIdx(Math.floor(Math.random() * items.length));
  }, [items]);
  return items[idx] ?? null;
}

type Track = { configured: boolean; title?: string; artist?: string; url?: string | null; albumArt?: string | null };
function useLikedSong(): Track | null {
  const [track, setTrack] = useState<Track | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/liked-song", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && j) setTrack(j as Track);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return track;
}

// fetch a film's poster (og:image) on demand for the one random film shown
function useFilmPoster(slug?: string): string | null {
  const [poster, setPoster] = useState<string | null>(null);
  useEffect(() => {
    if (!slug) return;
    let active = true;
    setPoster(null);
    fetch(`/api/film-poster?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && j?.ok) setPoster(j.poster ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [slug]);
  return poster;
}

type News = { ok: boolean; title?: string; url?: string; image?: string | null };
function useNewsletter(): News | null {
  const [news, setNews] = useState<News | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/newsletter", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && j?.ok) setNews(j as News);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return news;
}

// live: a random film from my current letterboxd diary (falls back to the
// bundled snapshot in letterboxd.json when the fetch fails)
function useLiveFilm(): Film | null {
  const [film, setFilm] = useState<Film | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/films", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && j?.ok && j.film) setFilm(j.film as Film);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return film;
}

type Art = { ok: boolean; title?: string; artist?: string; date?: string; image?: string; url?: string };
function useArtwork(): Art | null {
  const [art, setArt] = useState<Art | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/artwork", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && j?.ok) setArt(j as Art);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return art;
}

type StarredRepo = { ok: boolean; name?: string; owner?: string; description?: string; language?: string; url?: string };
function useStarred(): StarredRepo | null {
  const [repo, setRepo] = useState<StarredRepo | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/starred", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && j?.ok) setRepo(j as StarredRepo);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return repo;
}

type Rec = {
  icon: typeof Music;
  label: string;
  title: string;
  artist: string;
  note: string;
  link: string;
  bg: string;
  image?: string | null;
};

// small poster/cover with a graceful fallback to the icon if the image fails to
// load (e.g. a hotlink-protected VSCO CDN url)
function CardArt({ image, Icon }: { image?: string | null; Icon: typeof Music }) {
  const [err, setErr] = useState(false);
  return (
    <div className="w-12 h-16 flex items-center justify-center shrink-0 border-2 border-line bg-bg overflow-hidden">
      {image && !err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
          onError={() => setErr(true)}
        />
      ) : (
        <Icon size={20} className="text-ink" strokeWidth={2.5} />
      )}
    </div>
  );
}

export default function Recommendations() {
  const liveFilm = useLiveFilm();
  const staticFilm = useRandom(films);
  const film = liveFilm ?? staticFilm;
  const photo = useRandom(photos);
  const liked = useLikedSong();
  const poster = useFilmPoster(film?.slug ?? "spirited-away");
  const news = useNewsletter();
  const art = useArtwork();
  const star = useStarred();

  const meta = [film?.rating ? stars(film.rating) : null, film?.year ?? null]
    .filter(Boolean)
    .join(" · ");

  // song — live from my Spotify top track (with album art), falls back to a staple
  const song: Rec =
    liked?.configured && liked.title
      ? {
          icon: Music,
          label: "song",
          title: liked.title,
          artist: `${liked.artist} · spotify`,
          note: "a recent like from my spotify.",
          link: liked.url ?? "https://open.spotify.com",
          image: liked.albumArt ?? null,
          bg: "#5fa052",
        }
      : {
          icon: Music,
          label: "song",
          title: "Plastic Love",
          artist: "Mariya Takeuchi",
          note: "the city-pop loop that never gets old.",
          link: "https://www.youtube.com/watch?v=3bNITQR4Uso",
          bg: "#5fa052",
        };

  // movie — random pick from my letterboxd diary, with its poster
  const movie: Rec = film
    ? {
        icon: Film,
        label: "movie",
        title: film.title,
        artist: meta ? `${meta} · letterboxd` : "from my letterboxd",
        note: "a pick straight from my letterboxd diary.",
        link: film.url,
        image: poster,
        bg: "#e08043",
      }
    : {
        icon: Film,
        label: "movie",
        title: "Spirited Away",
        artist: "Hayao Miyazaki",
        note: "the ghibli comfort watch, endlessly.",
        link: "https://letterboxd.com/film/spirited-away/",
        image: poster,
        bg: "#e08043",
      };

  // photo — a specific shot from my vsco (image + permalink), not the gallery
  const shot: Rec = photo
    ? {
        icon: Camera,
        label: "photo",
        title: "from my camera roll",
        artist: "byapak · vsco",
        note: "a frame i shot.",
        link: photo.link ?? photo.url,
        image: photo.url,
        bg: "#fffaf0",
      }
    : {
        icon: Camera,
        label: "photo",
        title: "from my camera roll",
        artist: "byapak · vsco",
        note: "shots from my vsco.",
        link: "https://vsco.co/byapak/gallery",
        bg: "#fffaf0",
      };

  // newsletter — a random recent issue of chiyapop guff, with its cover
  const newsletter: Rec = {
    icon: Coffee,
    label: "newsletter",
    title: "chiyapop guff",
    artist: "my substack",
    note: "tea-stained essays + guff.",
    link: news?.url ?? "https://chiyapg.substack.com",
    image: news?.image ?? null,
    bg: "#e8a87c",
  };

  // art — a random public-domain masterpiece from the Art Institute of Chicago
  const artwork: Rec = art?.ok
    ? {
        icon: Palette,
        label: "art",
        title: art.title ?? "untitled",
        artist: [art.artist, art.date].filter(Boolean).join(" · "),
        note: "a public-domain piece from the art institute.",
        link: art.url ?? "https://www.artic.edu",
        image: art.image ?? null,
        bg: "#5fa052",
      }
    : {
        icon: Palette,
        label: "art",
        title: "Wanderer Above the Sea of Fog",
        artist: "Caspar David Friedrich",
        note: "permanent desktop-wallpaper energy.",
        link: "https://en.wikipedia.org/wiki/Wanderer_above_the_Sea_of_Fog",
        bg: "#5fa052",
      };

  // starred — a random repo from my github stars
  const starred: Rec = star?.ok
    ? {
        icon: Star,
        label: "starred",
        title: star.name ?? "a repo",
        artist: [star.owner, star.language].filter(Boolean).join(" · "),
        note: (star.description || "a repo i starred.").slice(0, 90),
        link: star.url ?? "https://github.com/ByapakSigdel?tab=stars",
        bg: "#e08043",
      }
    : {
        icon: Star,
        label: "starred",
        title: "multipleWindow3dScene",
        artist: "bgstaal",
        note: "one 3d scene synced across browser windows. magic.",
        link: "https://github.com/bgstaal/multipleWindow3dScene",
        bg: "#e08043",
      };

  const recs: Rec[] = [song, movie, shot, newsletter, artwork, starred];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {recs.map(({ icon: Icon, label, title, artist, note, link, bg, image }, i) => (
        <a
          key={i}
          href={link}
          target="_blank"
          rel="noreferrer"
          className="brut brut-hover group p-5 flex flex-col"
          style={{ background: bg }}
        >
          <div className="flex items-center justify-between mb-3">
            <CardArt image={image} Icon={Icon} />
            <span className="font-pixel text-[9px] px-2 py-1 border-2 border-line bg-bg">
              {label}
            </span>
          </div>
          <div className="font-pixel text-sm text-ink leading-relaxed">{title}</div>
          <div className="text-sm text-ink/90 mt-2 font-mono font-medium">{artist}</div>
          <p className="text-xs text-ink/70 mt-2 italic leading-snug">{note}</p>
          <span className="mt-auto pt-4 inline-flex items-center self-start gap-1.5 font-pixel text-[9px] px-2 py-1 border-2 border-line bg-bg group-hover:bg-ink group-hover:text-bg transition-colors">
            open ↗
          </span>
        </a>
      ))}
    </div>
  );
}
