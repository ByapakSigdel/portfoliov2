"use client";
import { useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";

const BOX = 58; // rendered box size (px)
const EGG = 34;
const SPEED = 115; // patrol speed px/sec
const HIT_DIST = 34; // you must click roughly ON the crate (skill, no auto-aim)

type Rect = { x: number; y: number; w: number; h: number };

// point on the rectangle perimeter at parameter t∈[0,1) (clockwise from top-left)
function perimeterPoint(r: Rect, t: number) {
  const P = 2 * (r.w + r.h);
  let d = (((t % 1) + 1) % 1) * P;
  if (d < r.w) return { x: r.x + d, y: r.y };
  d -= r.w;
  if (d < r.h) return { x: r.x + r.w, y: r.y + d };
  d -= r.h;
  if (d < r.w) return { x: r.x + r.w - d, y: r.y + r.h };
  d -= r.w;
  return { x: r.x, y: r.y + r.h - d };
}

let eggSeq = 0;

export function BoxGame() {
  const { enabled } = useCanvas();
  const boxRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<Rect | null>(null);
  const boxCenter = useRef({ x: 0, y: 0 });
  const tRef = useRef(0);
  const lastTs = useRef(0);
  const aliveRef = useRef(true); // box currently patrolling (not broken)

  const [frame, setFrame] = useState(1); // 1=intact … 5=shattered
  const [visible, setVisible] = useState(true);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [eggs, setEggs] = useState<{ id: number; x: number; y: number; hit: boolean }[]>([]);
  const [splats, setSplats] = useState<{ id: number; x: number; y: number }[]>([]);

  // patrol loop
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = (ts: number) => {
      const footer = document.querySelector<HTMLElement>('[data-piece="footer"]');
      if (footer) {
        const b = footer.getBoundingClientRect();
        const pad = 6;
        rectRef.current = {
          x: b.left + window.scrollX - pad,
          y: b.top + window.scrollY - pad,
          w: b.width + pad * 2,
          h: b.height + pad * 2,
        };
      }
      const r = rectRef.current;
      if (r) {
        const dt = lastTs.current ? (ts - lastTs.current) / 1000 : 0;
        if (aliveRef.current) tRef.current += (SPEED * dt) / (2 * (r.w + r.h));
        const p = perimeterPoint(r, tRef.current);
        boxCenter.current = p;
        if (boxRef.current) boxRef.current.style.transform = `translate(${p.x - BOX / 2}px, ${p.y - BOX / 2}px)`;
        if (badgeRef.current) badgeRef.current.style.transform = `translate(${r.x + r.w - 118}px, ${r.y - 30}px)`;
      }
      lastTs.current = ts;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  // throw an egg when clicking inside the footer region
  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      const r = rectRef.current;
      if (!r) return;
      const px = e.pageX, py = e.pageY;
      if (px < r.x || px > r.x + r.w || py < r.y || py > r.y + r.h) return;
      if ((e.target as HTMLElement)?.closest("a,button,input,textarea")) return;
      // you must actually click ON the moving crate — no auto-aim
      const c = boxCenter.current;
      const hit = aliveRef.current && Math.hypot(c.x - px, c.y - py) < HIT_DIST;
      const id = ++eggSeq;
      setEggs((list) => [...list, { id, x: px, y: py, hit }]);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [enabled]);

  const breakBox = () => {
    if (!aliveRef.current) return;
    aliveRef.current = false;
    setScore((s) => s + 1);
    let f = 2;
    const step = () => {
      setFrame(f);
      if (f < 5) {
        f++;
        window.setTimeout(step, 90);
      } else {
        window.setTimeout(() => setVisible(false), 160);
        // respawn somewhere new on the border after a beat
        window.setTimeout(() => {
          tRef.current = Math.random();
          setFrame(1);
          setVisible(true);
          aliveRef.current = true;
        }, 2200);
      }
    };
    step();
  };

  const onEggDone = (egg: { id: number; x: number; y: number; hit: boolean }) => {
    setEggs((list) => list.filter((x) => x.id !== egg.id));
    if (egg.hit) {
      breakBox();
    } else {
      setMisses((m) => m + 1);
      const sid = ++eggSeq;
      setSplats((list) => [...list, { id: sid, x: egg.x, y: egg.y }]);
      window.setTimeout(() => setSplats((list) => list.filter((s) => s.id !== sid)), 450);
    }
  };

  if (!enabled) return null;

  return (
    <>
      <div
        ref={boxRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: BOX,
          height: BOX,
          zIndex: 35,
          pointerEvents: "none",
          display: visible ? "block" : "none",
          filter: "drop-shadow(2px 3px 0 rgba(7,9,10,0.3))",
        }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/sprites/box${frame}.png`}
          alt="crate"
          draggable={false}
          style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }}
        />
      </div>

      <div
        ref={badgeRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 35,
          pointerEvents: "none",
          fontFamily: "var(--font-pixel), monospace",
          fontSize: 10,
          color: "#07090a",
          background: "rgba(243,232,207,0.9)",
          border: "2px solid #07090a",
          padding: "4px 7px",
          whiteSpace: "nowrap",
        }}
        aria-hidden
      >
        🥚 hit {score} · miss {misses}
      </div>

      {eggs.map((egg) => (
        <Egg key={egg.id} egg={egg} onDone={() => onEggDone(egg)} />
      ))}

      {splats.map((s) => (
        <div
          key={s.id}
          aria-hidden
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: 30,
            height: 30,
            zIndex: 36,
            pointerEvents: "none",
            borderRadius: "50%",
            background: "radial-gradient(circle, #f6e3b0 0%, #e8c668 55%, transparent 72%)",
            animation: "splatPop 0.45s ease-out forwards",
          }}
        />
      ))}
    </>
  );
}

function Egg({
  egg,
  onDone,
}: {
  egg: { id: number; x: number; y: number; hit: boolean };
  onDone: () => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/sprites/egg.png"
      alt="egg"
      draggable={false}
      onAnimationEnd={onDone}
      style={{
        position: "absolute",
        left: egg.x,
        top: egg.y,
        width: EGG,
        height: "auto",
        zIndex: 36,
        pointerEvents: "none",
        imageRendering: "pixelated",
        animation: "eggLob 0.34s ease-out forwards",
      }}
    />
  );
}
