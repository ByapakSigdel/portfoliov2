"use client";
import { useEffect, useRef } from "react";
import { useCanvas } from "./CanvasContext";

const SPR = (n: string) => `/sprites/pokemon/${n}.gif`;

// Ambient "wild" pokémon that fill out the work-section gutters around the
// catchable balls (purely decorative). Balls sit at left 0.14/0.56 & right 0.34,
// so these tuck into the gaps. frac = vertical position along the work section.
type Decor = {
  name: string;
  side: "left" | "right";
  frac: number;
  h: number;
  xOff: number;
  float?: boolean;
  floatDur?: number;
  flip?: boolean;
};
const DECOR: Decor[] = [
  { name: "oddish", side: "left", frac: 0.35, h: 50, xOff: 84, flip: true },
  { name: "sentret", side: "left", frac: 0.7, h: 58, xOff: 92 },
  { name: "snorlax", side: "left", frac: 0.92, h: 86, xOff: 98 },
  { name: "pidgey", side: "right", frac: 0.07, h: 48, xOff: 22, float: true, floatDur: 3.1, flip: true },
  { name: "hoothoot", side: "right", frac: 0.5, h: 58, xOff: 16 },
  { name: "psyduck", side: "right", frac: 0.7, h: 54, xOff: 90 },
  { name: "jigglypuff", side: "right", frac: 0.9, h: 50, xOff: 20, float: true, floatDur: 3.6 },
];

export function PokeDecor() {
  const { enabled } = useCanvas();
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const place = () => {
      const work = document.querySelector('[data-piece="work"]');
      if (work) {
        const r = work.getBoundingClientRect();
        const vw = window.innerWidth;
        DECOR.forEach((d, i) => {
          const el = refs.current[i];
          if (!el) return;
          const x = d.side === "left" ? r.left - d.xOff : r.right + d.xOff;
          const cx = Math.max(4, Math.min(vw - 84, x));
          const y = r.top + d.frac * r.height;
          el.style.transform = `translate(${cx}px, ${y}px)`;
        });
      }
      raf = requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {DECOR.map((d, i) => (
        <div
          key={d.name}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-hidden
          style={{ position: "fixed", left: 0, top: 0, zIndex: 26, pointerEvents: "none" }}
        >
          <div
            className={d.float ? "decor-float" : undefined}
            style={{ position: "relative", animationDuration: d.floatDur ? `${d.floatDur}s` : undefined }}
          >
            {!d.float && (
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: -4,
                  width: d.h * 0.62,
                  height: 7,
                  transform: "translateX(-50%)",
                  background: "rgba(7,9,10,0.18)",
                  borderRadius: "50%",
                  filter: "blur(1px)",
                }}
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SPR(d.name)}
              alt=""
              draggable={false}
              style={{
                height: d.h,
                width: "auto",
                maxWidth: "none",
                display: "block",
                imageRendering: "pixelated",
                transform: d.flip ? "scaleX(-1)" : undefined,
                filter: "drop-shadow(2px 3px 0 rgba(7,9,10,0.22))",
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}
