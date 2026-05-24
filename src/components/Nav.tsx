"use client";
import { useEffect, useState } from "react";

const links = [
  { href: "#now", label: "now" },
  { href: "#work", label: "work" },
  { href: "#writing", label: "writing" },
  { href: "#taste", label: "taste" },
];

export default function Nav() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Kathmandu",
        })
      );
    tick();
    const i = setInterval(tick, 30_000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-bg border-b-[3px] border-line">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 group">
          <span className="inline-block w-4 h-4 bg-dino-green border-2 border-line" />
          <span className="font-pixel text-[12px] text-ink">mahan.exe</span>
        </a>
        <nav className="hidden sm:flex items-center gap-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-pixel text-[10px] px-3 py-2 border-2 border-line bg-panel text-ink hover:bg-dino-green hover:text-ink hover:-translate-y-0.5 transition-all lowercase"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="font-mono text-[12px] text-ink hidden sm:flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-dino-green border-2 border-line" />
          ktm {time}
        </div>
      </div>
    </header>
  );
}
