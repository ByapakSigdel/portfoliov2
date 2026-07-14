"use client";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  icon: string;
  label: string;
  value: string;
  bg: string;
};

const items: Item[] = [
  { id: "building", icon: "💻", label: "building", value: "monoline — terminal braille drawing", bg: "#5fa052" },
  { id: "reading", icon: "📖", label: "reading", value: "the pragmatic programmer", bg: "#e08043" },
  { id: "listening", icon: "🎧", label: "listening", value: "lofi + city pop on loop", bg: "#e8a87c" },
  { id: "based", icon: "📍", label: "based in", value: "kathmandu, nepal", bg: "#fffaf0" },
];

type Live = {
  configured: boolean;
  isPlaying: boolean;
  recent?: boolean;
  title?: string;
  artist?: string;
  albumArt?: string | null;
  url?: string | null;
};

// Poll the Spotify route. Falls back to null (-> static text) on any error or
// when Spotify isn't configured, so the card always renders something sane.
function useNowPlaying(): Live | null {
  const [data, setData] = useState<Live | null>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as Live;
        if (active) setData(json);
      } catch {
        /* keep last value / fallback */
      }
    };
    load();
    const timer = setInterval(load, 45_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  return data;
}

export default function NowPlaying() {
  const live = useNowPlaying();
  const hasTrack = !!(live?.configured && live.title);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 z-10 relative">
      {items.map((item) => {
        const isListening = item.id === "listening" && hasTrack;
        const value = isListening ? `${live!.title} — ${live!.artist}` : item.value;
        const href = isListening ? live!.url ?? undefined : undefined;
        const albumArt = isListening ? live!.albumArt : null;
        const badge = isListening ? (live!.isPlaying ? "now playing" : "last played") : null;
        const playing = isListening && live!.isPlaying;

        const Wrapper = href ? "a" : "div";
        const wrapperProps = href
          ? { href, target: "_blank" as const, rel: "noreferrer" }
          : {};

        return (
          <Wrapper
            key={item.id}
            {...wrapperProps}
            className="brut flex flex-col"
            style={{ background: item.bg }}
          >
            <div className="border-b-2 border-line bg-panel px-3 py-1.5 flex items-center justify-between shrink-0">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-line inline-block" />
                <span className="w-2.5 h-2.5 bg-line inline-block" />
                <span className="w-2.5 h-2.5 bg-line inline-block" />
              </div>
              <span className="font-pixel text-[10px] text-ink lowercase">{item.label}.exe</span>
            </div>
            <div className="brut-hover p-5 flex items-start gap-4 flex-1">
              <div className="w-12 h-12 flex items-center justify-center shrink-0 border-2 border-line bg-bg shadow-[2px_2px_0px_#0a0d0a] overflow-hidden">
                {albumArt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={albumArt} alt="" className="w-full h-full object-cover" style={{ imageRendering: "auto" }} />
                ) : (
                  <span className="text-2xl">{item.icon}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-pixel text-[10px] uppercase mb-2 tracking-wider text-ink flex items-center gap-2">
                  {item.label}
                  {badge && (
                    <span className="inline-flex items-center gap-1 normal-case tracking-normal text-ink/70">
                      {playing && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-pulse inline-block" />
                      )}
                      {badge}
                    </span>
                  )}
                </div>
                <div className="font-mono text-[14px] sm:text-[15px] text-ink font-medium leading-snug">
                  {value}
                </div>
              </div>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}
