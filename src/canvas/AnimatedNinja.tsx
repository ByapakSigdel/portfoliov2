"use client";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";
import { Sprite } from "./sprites";

// Per-frame render metadata. The supplied PNGs are framed inconsistently, so
// each frame carries its own height/offset (computed from its opaque bounds) to
// normalise the character to a uniform on-screen size with feet on one baseline.
type Frame = { src: string; h: number; dx: number; dy: number };

const IDLE_FRAMES: Frame[] = [
  { src: "/sprites/narutost1.png", h: 123, dx: 1, dy: -25 },
  { src: "/sprites/narutost2.png", h: 144, dx: 2, dy: -25 },
];
const RUN_FRAMES: Frame[] = [
  { src: "/sprites/narutof1.png", h: 232, dx: 45, dy: -41 },
  { src: "/sprites/narutof2.png", h: 246, dx: 46, dy: -51 },
  { src: "/sprites/narutof3.png", h: 216, dx: 37, dy: -42 },
  { src: "/sprites/narutof4.png", h: 255, dx: 35, dy: -73 },
  { src: "/sprites/narutof5.png", h: 217, dx: 33, dy: -43 },
  { src: "/sprites/narutof6.png", h: 238, dx: 26, dy: -70 },
];

const CLIPS = {
  idle: { frames: IDLE_FRAMES, fps: 2.2 },
  run: { frames: RUN_FRAMES, fps: 11 },
};

const DASH = 130; // px the ninja scampers each hover
const MIN_X = -260; // furthest it runs left of home
const MAX_X = 30; // a little past home to the right

export function AnimatedNinja() {
  const { enabled } = useCanvas();
  const controls = useAnimationControls();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [running, setRunning] = useState(false);
  const [flip, setFlip] = useState(false); // false = facing right (as drawn)
  const [sleeping, setSleeping] = useState(false);
  const [kunais, setKunais] = useState<{ id: number; dir: 1 | -1 }[]>([]);
  const kunaiId = useRef(0);
  const dirRef = useRef<1 | -1>(-1); // -1 = run left, 1 = run right
  const dashGuard = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const runTimer = useRef(0);

  // doze off after a stretch of no mouse movement; wake on any move
  useEffect(() => {
    if (!enabled) return;
    let idle = 0;
    const wake = () => {
      setSleeping(false);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setSleeping(true), 12000);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [enabled]);

  // move to the current position — quick dash when running, snappy spring after drag
  useEffect(() => {
    controls.start({
      x: pos.x,
      y: pos.y,
      transition: running
        ? { duration: 0.5, ease: [0.3, 0.7, 0.3, 1] }
        : { type: "spring", stiffness: 500, damping: 40 },
    });
  }, [pos, running, controls]);

  if (!enabled) return null;

  const clip = running ? CLIPS.run : CLIPS.idle;

  // hover → actually run a short distance away (bounces within a small range)
  const doDash = () => {
    if (dashGuard.current) return;
    dashGuard.current = true;
    let dir = dirRef.current;
    let nx = pos.x + dir * DASH;
    if (nx < MIN_X || nx > MAX_X) {
      dir = (-dir) as 1 | -1;
      dirRef.current = dir;
      nx = Math.max(MIN_X, Math.min(MAX_X, pos.x + dir * DASH));
    }
    setFlip(dir < 0); // sprite faces right by default → flip when running left
    setRunning(true);
    setPos((p) => ({ ...p, x: nx }));
    window.clearTimeout(runTimer.current);
    runTimer.current = window.setTimeout(() => setRunning(false), 560);
    window.setTimeout(() => { dashGuard.current = false; }, 600);
  };

  const doThrow = () => {
    const id = ++kunaiId.current;
    const dir: 1 | -1 = flip ? -1 : 1; // throw the way he faces
    setKunais((k) => [...k, { id, dir }]);
    setTimeout(() => setKunais((k) => k.filter((x) => x.id !== id)), 750);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      animate={controls}
      onDragStart={() => { dragStart.current = pos; }}
      onDragEnd={(_, info) => setPos({ x: dragStart.current.x + info.offset.x, y: dragStart.current.y + info.offset.y })}
      onMouseEnter={doDash}
      onClick={doThrow}
      title="hover — he runs off! · click to throw · drag to move"
      style={{
        position: "absolute",
        top: 470,
        right: 36,
        width: 140,
        height: 150,
        zIndex: 30,
        cursor: "pointer",
        touchAction: "none",
      }}
    >
      <FrameSprite
        clipKey={running ? "run" : "idle"}
        frames={clip.frames}
        fps={clip.fps}
        flip={flip}
      />

      {sleeping && !running && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 6,
            left: "58%",
            fontSize: 20,
            zIndex: 5,
            pointerEvents: "none",
            animation: "zzzFloat 2.4s ease-in-out infinite",
          }}
        >
          💤
        </span>
      )}

      {kunais.map((k) => (
        <span
          key={k.id}
          aria-hidden
          className="kunai-fly"
          style={{
            position: "absolute",
            left: "50%",
            top: "45%",
            ["--kx" as string]: `${k.dir * 260}px`,
            transform: k.dir === -1 ? "scaleX(-1)" : undefined,
          }}
        >
          <Sprite k="kunai" size={26} />
        </span>
      ))}
    </motion.div>
  );
}

function FrameSprite({
  clipKey,
  frames,
  fps,
  flip,
}: {
  clipKey: string;
  frames: Frame[];
  fps: number;
  flip: boolean;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    if (frames.length <= 1) return;
    const id = window.setInterval(() => setI((p) => (p + 1) % frames.length), 1000 / fps);
    return () => window.clearInterval(id);
  }, [clipKey, frames.length, fps]);

  const f = frames[Math.min(i, frames.length - 1)];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={f.src}
      alt="naruto"
      draggable={false}
      style={{
        position: "absolute",
        bottom: f.dy,
        left: "50%",
        height: f.h,
        width: "auto",
        transform: `translateX(calc(-50% + ${flip ? -f.dx : f.dx}px))${flip ? " scaleX(-1)" : ""}`,
        transformOrigin: "bottom center",
        pointerEvents: "none",
        display: "block",
        filter: "drop-shadow(2px 3px 0 rgba(7,9,10,0.25))",
      }}
    />
  );
}
