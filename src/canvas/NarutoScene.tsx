"use client";
import { useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";

const NARUTO_GIF =
  "/sprites/naruto__sasuke_battle__jus_gif_test___stance_by_pedronickmugen_dbycc46.gif";
const MADARA = "/sprites/madara.png";
const M_CELL = 96; // madara sheet cell size (9×6 grid of 96px)
const M_IDLE = [0, 1, 2]; // row-0 fighting-stance frames → idle loop

// A little face-off in the naruto-themed "now" section: Naruto (left) squares up
// against Madara (right). Click Naruto and he lunges — Madara recoils with a clash.
export function NarutoScene() {
  const { enabled } = useCanvas();
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const [lunging, setLunging] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [clash, setClash] = useState(false);

  // anchor both fighters to the "now" section's gutters, tracked every frame
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const place = () => {
      const now = document.querySelector('[data-piece="now"]');
      if (now) {
        const r = now.getBoundingClientRect();
        const vw = window.innerWidth;
        const y = r.top + Math.min(r.height * 0.5, 130);
        if (leftRef.current) leftRef.current.style.transform = `translate(${Math.max(6, r.left - 78)}px, ${y}px)`;
        if (rightRef.current) rightRef.current.style.transform = `translate(${Math.min(vw - 116, r.right + 14)}px, ${y}px)`;
      }
      raf = requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  // madara idle frame cycle
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % M_IDLE.length), 230);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  const clashNow = () => {
    setLunging(true);
    window.setTimeout(() => setLunging(false), 460);
    window.setTimeout(() => {
      setShaking(true);
      setClash(true);
      window.setTimeout(() => setShaking(false), 440);
      window.setTimeout(() => setClash(false), 460);
    }, 220);
  };

  return (
    <>
      {/* Naruto — left, facing right toward Madara */}
      <div ref={leftRef} style={{ position: "fixed", left: 0, top: 0, zIndex: 28, pointerEvents: "none" }}>
        <div className="naruto-float">
          <div className={lunging ? "naruto-lunge" : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={NARUTO_GIF}
              alt="naruto"
              onClick={clashNow}
              title="naruto — click to strike!"
              draggable={false}
              style={{
                width: 36 * 1.75,
                height: "auto",
                maxWidth: "none",
                imageRendering: "pixelated",
                transform: "scaleX(-1)", // flip to face right
                cursor: "pointer",
                pointerEvents: "auto",
                filter: "drop-shadow(2px 3px 0 rgba(7,9,10,0.28))",
              }}
            />
          </div>
        </div>
      </div>

      {/* Madara — right, facing left toward Naruto */}
      <div ref={rightRef} style={{ position: "fixed", left: 0, top: 0, zIndex: 28, pointerEvents: "none" }}>
        <div className="madara-float">
          <div className={shaking ? "madara-shake" : undefined} style={{ position: "relative", width: M_CELL, height: M_CELL }}>
            <div
              aria-hidden
              style={{
                width: M_CELL,
                height: M_CELL,
                backgroundImage: `url(${MADARA})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: `${-M_IDLE[frame] * M_CELL}px 0px`,
                imageRendering: "pixelated",
                transform: "scaleX(-1) scale(1.12)", // flip to face left + scale up a touch
                transformOrigin: "center bottom",
                filter: "drop-shadow(-2px 3px 0 rgba(7,9,10,0.28))",
              }}
            />
            {clash && <span className="naruto-clash">✦</span>}
          </div>
        </div>
      </div>
    </>
  );
}
