"use client";
import Image from "next/image";

const items = [
  {
    icon: "💻",
    label: "building",
    value: "derivative — block coding for arduino",
    bg: "#5fa052",
  },
  {
    icon: "📖",
    label: "reading",
    value: "the pragmatic programmer",
    bg: "#e08043",
  },
  {
    icon: "🎧",
    label: "listening",
    value: "lofi + city pop on loop",
    bg: "#e8a87c",
  },
  {
    icon: "📍",
    label: "based in",
    value: "kathmandu, nepal",
    bg: "#fffaf0",
  },
];

export default function NowPlaying() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 z-10 relative">
      {items.map(({ icon, label, value, bg }, i) => (
        <div
          key={i}
          className="brut flex flex-col"
          style={{ background: bg }}
        >
          <div className="border-b-2 border-line bg-panel px-3 py-1.5 flex items-center justify-between shrink-0">
             <div className="flex gap-1.5">
               <span className="w-2.5 h-2.5 bg-line inline-block" />
               <span className="w-2.5 h-2.5 bg-line inline-block" />
               <span className="w-2.5 h-2.5 bg-line inline-block" />
             </div>
             <span className="font-pixel text-[10px] text-ink lowercase">{label}.exe</span>
          </div>
          <div className="brut-hover p-5 flex items-start gap-4 flex-1">
            <div className="w-12 h-12 text-2xl flex items-center justify-center shrink-0 border-2 border-line bg-bg shadow-[2px_2px_0px_#0a0d0a]">
              {icon}
            </div>
            <div className="min-w-0">
              <div className="font-pixel text-[10px] uppercase mb-2 tracking-wider text-ink">
                {label}
              </div>
              <div className="font-mono text-[14px] sm:text-[15px] text-ink font-medium leading-snug">{value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
