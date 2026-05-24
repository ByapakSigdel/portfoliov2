"use client";
import { Music, Film, Image as ImageIcon, BookOpen, Heart } from "lucide-react";

const recs = [
  {
    icon: Music,
    label: "song",
    title: "Plastic Love",
    artist: "Mariya Takeuchi",
    link: "https://www.youtube.com/watch?v=3bNITQR4Uso",
    bg: "#5fa052",
  },
  {
    icon: Film,
    label: "movie",
    title: "Spirited Away",
    artist: "Hayao Miyazaki",
    link: "https://letterboxd.com/film/spirited-away/",
    bg: "#e08043",
  },
  {
    icon: BookOpen,
    label: "book",
    title: "The Pragmatic Programmer",
    artist: "Hunt & Thomas",
    link: "https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/",
    bg: "#e8a87c",
  },
  {
    icon: ImageIcon,
    label: "image",
    title: "Wanderer Above the Sea of Fog",
    artist: "Caspar David Friedrich",
    link: "https://en.wikipedia.org/wiki/Wanderer_above_the_Sea_of_Fog",
    bg: "#fffaf0",
  },
  {
    icon: Heart,
    label: "misc",
    title: "kawe.ski",
    artist: "portfolio inspo",
    link: "https://kawe.ski",
    bg: "#5fa052",
  },
];

export default function Recommendations() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {recs.map(({ icon: Icon, label, title, artist, link, bg }, i) => (
        <a
          key={i}
          href={link}
          target="_blank"
          rel="noreferrer"
          className="brut brut-hover group p-5 flex flex-col"
          style={{ background: bg }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 flex items-center justify-center border-2 border-line bg-bg">
              <Icon size={14} className="text-ink" strokeWidth={2.5} />
            </div>
            <span className="font-pixel text-[9px] px-2 py-1 border-2 border-line bg-bg">
              {label}
            </span>
          </div>
          <div className="font-pixel text-sm text-ink leading-relaxed">{title}</div>
          <div className="text-sm text-ink/90 mt-2 font-mono font-medium">{artist}</div>
          <span className="mt-4 inline-flex items-center self-start gap-1.5 font-pixel text-[9px] px-2 py-1 border-2 border-line bg-bg group-hover:bg-ink group-hover:text-bg transition-colors">
            open ↗
          </span>
        </a>
      ))}
    </div>
  );
}
