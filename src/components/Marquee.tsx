"use client";

const words = [
  "tinkering",
  "embedded systems",
  "block coding",
  "linux",
  "iot",
  "rust-curious",
  "python",
  "react",
  "arduino",
  "open source",
  "ctf",
  "low-level",
];

const colors = ["#5fa052", "#e08043", "#e8a87c", "#fffaf0"];

export default function Marquee() {
  const track = [...words, ...words];
  return (
    <div className="mt-8 brut bg-ink py-3 overflow-hidden">
      <div className="flex gap-6 marquee-track whitespace-nowrap w-max">
        {track.map((w, i) => (
          <span
            key={i}
            className="font-pixel text-[10px] px-3 py-1 border-2 border-line lowercase"
            style={{ background: colors[i % colors.length] }}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
