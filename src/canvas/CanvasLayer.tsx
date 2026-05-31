"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";
import { Sprite } from "./sprites";
import { Stroke, Point } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const CONFETTI = ["🍥", "🔥", "⭐", "🌀", "🍜", "🦖", "🏴‍☠️"];

// Original, playful one-liners (not quotes from anything).
const STOP_LINES = [
  "Okay, that's enough art for one lifetime. 🖐️",
  "Halt! You shall not doodle.",
  "I'm gonna stop you right there, champ.",
  "Pencils down — it's a portfolio, not a coloring book 😄",
  "Whoa, save some ink for the rest of us.",
  "Your scribbles have summoned me.",
  "Masterpiece detected. Backing away slowly…",
];

export function CanvasLayer() {
  const {
    enabled,
    editMode,
    tool,
    pencilColor,
    pencilSize,
    activeStamp,
    state,
    addStroke,
    eraseStrokeNear,
    addStamp,
    removeStamp,
    addSticky,
    updateSticky,
    removeSticky,
    eggBus,
  } = useCanvas();

  const [drawing, setDrawing] = useState<Stroke | null>(null);
  const [sparkles, setSparkles] = useState<{ id: string; x: number; y: number }[]>([]);
  const [blueprint, setBlueprint] = useState(false);
  const [party, setParty] = useState<{ id: string; left: number; delay: number; dur: number; char: string }[] | null>(null);
  const [starfield, setStarfield] = useState<{ id: string; left: number; top: number; delay: number }[] | null>(null);
  const [swarm, setSwarm] = useState(false);
  const [stopGag, setStopGag] = useState<string | null>(null);
  const [gagPos, setGagPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const stopTimers = useRef<number[]>([]);
  const blockDraw = useRef(false);
  const lastErase = useRef(0);

  useEffect(() => {
    return eggBus.subscribe((e) => {
      if (e.type === "blueprint") {
        setBlueprint(true);
        setTimeout(() => setBlueprint(false), 4000);
      } else if (e.type === "party") {
        const pieces = Array.from({ length: 28 }, () => ({
          id: uid(),
          left: Math.random() * 100,
          delay: Math.random() * 0.6,
          dur: 1.8 + Math.random() * 1.4,
          char: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
        }));
        setParty(pieces);
        document.body.classList.add("party");
        setTimeout(() => { setParty(null); document.body.classList.remove("party"); }, 3000);
      } else if (e.type === "shake") {
        document.body.classList.add("canvas-shake");
        setTimeout(() => document.body.classList.remove("canvas-shake"), 600);
      } else if (e.type === "starfield") {
        const stars = Array.from({ length: 40 }, () => ({
          id: uid(),
          left: Math.random() * 100,
          top: Math.random() * 100,
          delay: Math.random() * 1.5,
        }));
        setStarfield(stars);
        setTimeout(() => setStarfield(null), 3500);
      } else if (e.type === "swarm") {
        setSwarm(true);
        setTimeout(() => setSwarm(false), 1600);
      } else if (e.type === "stop") {
        const W = 190, H = 230;
        const vw = window.innerWidth, vh = window.innerHeight;
        const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
        // appear right where the cursor is (convert page → viewport coords)
        const mx = clamp(e.x - window.scrollX - 60, 8, vw - W);
        const my = clamp(e.y - window.scrollY - 150, 8, vh - H);
        setStopGag(STOP_LINES[Math.floor(Math.random() * STOP_LINES.length)]);
        setGagPos({ x: mx, y: my });
        blockDraw.current = true; // genuinely stop the scribbling for a beat
        stopTimers.current.forEach((t) => window.clearTimeout(t));
        stopTimers.current = [
          window.setTimeout(() => setGagPos({ x: vw - W - 14, y: vh - H - 4 }), 1500),
          window.setTimeout(() => { blockDraw.current = false; }, 2300),
          window.setTimeout(() => setStopGag(null), 6000),
        ];
      }
    });
  }, [eggBus]);

  const active = enabled && editMode;
  const interactive = active && tool !== "select";

  const pageCoords = useCallback((ev: React.PointerEvent) => {
    return { x: ev.pageX, y: ev.pageY };
  }, []);

  const onPointerDown = (ev: React.PointerEvent) => {
    if (!interactive) return;
    if (blockDraw.current && tool === "pencil") return; // Nagato is stopping you
    const p = pageCoords(ev);
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
    if (tool === "pencil") {
      setDrawing({ id: uid(), color: pencilColor, size: pencilSize, points: [p] });
      addSparkle(p);
    } else if (tool === "eraser") {
      eraseStrokeNear(p.x, p.y);
    } else if (tool === "stamp") {
      addStamp({
        id: uid(),
        sprite: activeStamp,
        x: p.x,
        y: p.y,
        rot: Math.floor(Math.random() * 24 - 12),
      });
    } else if (tool === "sticky") {
      addSticky({ id: uid(), x: p.x, y: p.y, text: "" });
    }
  };

  const onPointerMove = (ev: React.PointerEvent) => {
    if (!interactive) return;
    const p = pageCoords(ev);
    if (tool === "pencil" && drawing) {
      const last = drawing.points[drawing.points.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) > 2) {
        setDrawing({ ...drawing, points: [...drawing.points, p] });
      }
    } else if (tool === "eraser") {
      const now = performance.now();
      if (now - lastErase.current > 30) {
        eraseStrokeNear(p.x, p.y);
        lastErase.current = now;
      }
    }
  };

  const onPointerUp = () => {
    if (tool === "pencil" && drawing) {
      if (drawing.points.length > 1) addStroke(drawing);
      setDrawing(null);
    }
  };

  const addSparkle = (p: Point) => {
    const id = uid();
    setSparkles((s) => [...s, { id, x: p.x, y: p.y }]);
    setTimeout(() => setSparkles((s) => s.filter((x) => x.id !== id)), 800);
  };

  if (!enabled) return null;

  return (
    <>
      <div
        aria-hidden={!interactive}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: interactive ? "auto" : "none",
          zIndex: 40,
          cursor: cursorForTool(tool, interactive),
        }}
        className="canvas-layer"
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
        >
          {state.strokes.map((s) => (
            <polyline
              key={s.id}
              points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
              stroke={s.color}
              strokeWidth={s.size}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {drawing && (
            <polyline
              points={drawing.points.map((p) => `${p.x},${p.y}`).join(" ")}
              stroke={drawing.color}
              strokeWidth={drawing.size}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {state.stamps.map((s) => (
          <div
            key={s.id}
            className={swarm ? "wiggle" : undefined}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
              filter: "drop-shadow(2px 3px 0 rgba(7,9,10,0.35))",
              pointerEvents: tool === "eraser" ? "auto" : "none",
            }}
            onClick={(ev) => {
              if (tool === "eraser") {
                ev.stopPropagation();
                removeStamp(s.id);
              }
            }}
          >
            <Sprite k={s.sprite} size={46} />
          </div>
        ))}

        {state.stickies.map((s) => (
          <StickyNote
            key={s.id}
            sticky={s}
            onChange={(text) => updateSticky(s.id, { text })}
            onRemove={() => removeSticky(s.id)}
            eraserActive={tool === "eraser"}
          />
        ))}

        {sparkles.map((sp) => (
          <span
            key={sp.id}
            aria-hidden
            style={{
              position: "absolute",
              left: sp.x - 4,
              top: sp.y - 4,
              width: 8,
              height: 8,
              background: pencilColor,
              borderRadius: 2,
              pointerEvents: "none",
              opacity: 0.8,
              animation: "spk 0.8s ease-out forwards",
            }}
          />
        ))}
      </div>

      {blueprint && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(74,143,61,0.18)",
            backgroundImage:
              "linear-gradient(rgba(7,9,10,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(7,9,10,.4) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
            pointerEvents: "none",
            zIndex: 60,
            animation: "fadein 0.4s ease-out",
          }}
        />
      )}

      {starfield && (
        <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 61 }}>
          {starfield.map((st) => (
            <span
              key={st.id}
              style={{
                position: "absolute",
                left: `${st.left}%`,
                top: `${st.top}%`,
                color: "#e8743a",
                fontSize: 14,
                animation: `twinkle 1.4s ease-in-out ${st.delay}s infinite`,
              }}
            >
              ✦
            </span>
          ))}
        </div>
      )}

      {party && (
        <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 70, overflow: "hidden" }}>
          {party.map((c) => (
            <span
              key={c.id}
              style={{
                position: "absolute",
                left: `${c.left}%`,
                top: "-8%",
                fontSize: 22,
                animation: `confettiFall ${c.dur}s linear ${c.delay}s forwards`,
              }}
            >
              {c.char}
            </span>
          ))}
        </div>
      )}

      {stopGag && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            transform: `translate(${gagPos.x}px, ${gagPos.y}px)`,
            transition: "transform 0.7s cubic-bezier(.4,.1,.2,1)",
            zIndex: 120,
            pointerEvents: "none",
          }}
        >
        <div
          className="nagato-popup"
          onClick={() => setStopGag(null)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              maxWidth: 230,
              background: "#ffffff",
              border: "3px solid #07090a",
              boxShadow: "5px 5px 0 0 #07090a",
              padding: "10px 12px",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              fontWeight: 600,
              color: "#07090a",
              lineHeight: 1.35,
              position: "relative",
            }}
          >
            {stopGag}
            <span
              aria-hidden
              style={{
                position: "absolute",
                right: 34,
                bottom: -12,
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "12px solid #07090a",
              }}
            />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sprites/NagatoStop.png"
            alt="stop"
            draggable={false}
            style={{ height: 168, width: "auto", imageRendering: "auto", display: "block", filter: "drop-shadow(3px 4px 0 rgba(7,9,10,0.25))" }}
          />
        </div>
        </div>
      )}
    </>
  );
}

function StickyNote({
  sticky,
  onChange,
  onRemove,
  eraserActive,
}: {
  sticky: { id: string; x: number; y: number; text: string };
  onChange: (text: string) => void;
  onRemove: () => void;
  eraserActive: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!sticky.text) ref.current?.focus();
  }, [sticky.text]);

  return (
    <div
      style={{
        position: "absolute",
        left: sticky.x,
        top: sticky.y,
        width: 160,
        background: "#fff6a1",
        border: "2px solid #07090a",
        boxShadow: "4px 4px 0 0 #07090a",
        padding: 8,
        pointerEvents: "auto",
        zIndex: 5,
        transform: "rotate(-1.5deg)",
      }}
      onClick={(e) => {
        if (eraserActive) {
          e.stopPropagation();
          onRemove();
        }
      }}
    >
      <textarea
        ref={ref}
        value={sticky.text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="note…"
        rows={3}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 13,
          color: "#07090a",
        }}
      />
    </div>
  );
}

function cursorForTool(tool: string, interactive: boolean) {
  if (!interactive) return "default";
  switch (tool) {
    case "pencil":
      return "crosshair";
    case "eraser":
      return "cell";
    case "stamp":
      return "copy";
    case "sticky":
      return "text";
    default:
      return "default";
  }
}
