"use client";
import React, { useEffect, useRef, useState } from "react";

// A single named animation clip. `frames` is a list of [col, row] cells in the
// sprite sheet, so any sheet layout (grid, one-row-per-anim, scattered) works.
export type Clip = {
  frames: [number, number][];
  fps: number;
  loop?: boolean; // default true
};

export type SpriteConfig = {
  src: string; // sprite sheet PNG in /public
  frameW: number;
  frameH: number;
  scale: number;
  clips: Record<string, Clip>;
};

type Props = {
  config: SpriteConfig;
  clip: string;
  flip?: boolean;
  onClipEnd?: (clip: string) => void;
  /** rendered if the sheet PNG is missing/unreadable (graceful degradation) */
  fallback?: React.ReactNode;
};

/**
 * Plays a sprite-sheet animation by stepping [col,row] cells on a rAF clock.
 * No dependencies — just a scaled, pixelated background-position step.
 */
export function SpriteAnimator({ config, clip, flip = false, onClipEnd, fallback }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [frameIdx, setFrameIdx] = useState(0);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const idxRef = useRef(0);
  const endRef = useRef(onClipEnd);
  endRef.current = onClipEnd;

  // preload + existence check
  useEffect(() => {
    let alive = true;
    const img = new window.Image();
    img.onload = () => alive && setStatus("ready");
    img.onerror = () => alive && setStatus("error");
    img.src = config.src;
    return () => {
      alive = false;
    };
  }, [config.src]);

  // step the active clip
  useEffect(() => {
    if (status !== "ready") return;
    const c = config.clips[clip];
    if (!c || c.frames.length === 0) return;
    idxRef.current = 0;
    setFrameIdx(0);
    lastRef.current = performance.now();
    const interval = 1000 / c.fps;
    const tick = (t: number) => {
      if (t - lastRef.current >= interval) {
        lastRef.current = t;
        let next = idxRef.current + 1;
        if (next >= c.frames.length) {
          if (c.loop === false) {
            endRef.current?.(clip);
            return; // freeze on last frame
          }
          next = 0;
        }
        idxRef.current = next;
        setFrameIdx(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, clip, config]);

  if (status === "error") return <>{fallback ?? null}</>;

  const { frameW, frameH, scale, src } = config;
  const c = config.clips[clip] ?? Object.values(config.clips)[0];
  const [col, row] = c?.frames[Math.min(frameIdx, (c?.frames.length ?? 1) - 1)] ?? [0, 0];

  return (
    <div
      style={{
        width: frameW * scale,
        height: frameH * scale,
        overflow: "hidden",
        transform: flip ? "scaleX(-1)" : undefined,
        visibility: status === "ready" ? "visible" : "hidden",
      }}
      aria-hidden
    >
      <div
        style={{
          width: frameW,
          height: frameH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: `-${col * frameW}px -${row * frameH}px`,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
