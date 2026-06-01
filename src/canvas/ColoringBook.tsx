"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";
import { PAINTINGS, type Painting } from "./paintings.data";

const CELL = 15; // behind-section drawing grid cell size
const ORIG_W = 188; // gutter reference width
const KEY = "cb-progress-v2";

type Saved = { slugs: string[]; cells: Record<string, number[]> };

const bySlug = (slug: string) => PAINTINGS.find((p) => p.slug === slug)!;
const isStarted = (c: number[]) => c.some((v) => v >= 0);
const isComplete = (c: number[], p: Painting) => c.length > 0 && c.every((v, i) => v === p.grid[i]);

function loadSaved(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && Array.isArray(s.slugs) && s.cells) return s;
  } catch {}
  return null;
}
function pickTwo(): string[] {
  const idx = PAINTINGS.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return [PAINTINGS[idx[0]].slug, PAINTINGS[idx[1]].slug];
}

/**
 * Taste-section companion. The original paintings sit in the gutters (always
 * shown); the colour-by-number drawing grids hide BEHIND the section — faintly
 * visible as a hint, and only fully revealed/colourable once the section is
 * dragged aside. Two random masterpieces per reload; unfinished work is kept.
 */
export function ColoringBook({ revealPieceId }: { revealPieceId: string }) {
  const { enabled, getOffset, eggBus } = useCanvas();
  const offset = getOffset(revealPieceId);
  const revealed = Math.hypot(offset.x, offset.y) > 60; // section dragged aside

  const [pair, setPair] = useState<string[] | null>(null);
  const [cellsMap, setCellsMap] = useState<Record<string, number[]>>({});
  const announced = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saved = loadSaved();
    const hasProgress =
      saved &&
      saved.slugs.length === 2 &&
      saved.slugs.every((s) => bySlug(s)) &&
      Object.values(saved.cells).some((c) => c && c.some((v) => v >= 0));
    if (hasProgress) {
      const map: Record<string, number[]> = {};
      for (const s of saved!.slugs) {
        const p = bySlug(s);
        const c = saved!.cells[s];
        map[s] = c && c.length === p.grid.length ? c : new Array(p.grid.length).fill(-1);
        if (isComplete(map[s], p)) announced.current.add(s);
      }
      setPair(saved!.slugs);
      setCellsMap(map);
    } else {
      const slugs = pickTwo();
      setPair(slugs);
      setCellsMap(Object.fromEntries(slugs.map((s) => [s, new Array(bySlug(s).grid.length).fill(-1)])));
    }
  }, []);

  useEffect(() => {
    if (!pair) return;
    const cells: Record<string, number[]> = {};
    for (const s of pair) {
      const p = bySlug(s);
      const c = cellsMap[s];
      if (c && isStarted(c) && !isComplete(c, p)) cells[s] = c;
    }
    try {
      if (Object.keys(cells).length) localStorage.setItem(KEY, JSON.stringify({ slugs: pair, cells }));
      else localStorage.removeItem(KEY);
    } catch {}
  }, [cellsMap, pair]);

  useEffect(() => {
    if (!pair) return;
    for (const s of pair) {
      const p = bySlug(s);
      const c = cellsMap[s];
      if (c && isComplete(c, p) && !announced.current.has(s)) {
        announced.current.add(s);
        eggBus.emit({ type: "toast", msg: `🖼️ ${p.title} — ${p.artist}!` });
      }
    }
  }, [cellsMap, pair, eggBus]);

  if (!enabled || !pair) return null;

  const paintCell = (slug: string, i: number, colorIdx: number) =>
    setCellsMap((m) => {
      const p = bySlug(slug);
      const c = m[slug];
      if (!c || c[i] === p.grid[i]) return m;
      const n = c.slice();
      n[i] = colorIdx;
      return { ...m, [slug]: n };
    });

  const progress = (slug: string) => {
    const p = bySlug(slug);
    const c = cellsMap[slug] || [];
    const correct = c.reduce((n, v, i) => n + (v === p.grid[i] ? 1 : 0), 0);
    return { pct: Math.round((correct / p.grid.length) * 100), done: correct === p.grid.length };
  };

  return (
    <>
      {/* ORIGINAL references — in the gutters, always shown */}
      <Original slug={pair[0]} side="left" {...progress(pair[0])} />
      <Original slug={pair[1]} side="right" {...progress(pair[1])} />

      {/* DRAWING grids — behind the section, subtle until it's dragged aside */}
      <div
        aria-hidden={!revealed}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          flexWrap: "wrap",
          opacity: revealed ? 1 : 0.28,
          filter: revealed ? "none" : "saturate(0.7)",
          pointerEvents: revealed ? "auto" : "none",
          transition: "opacity 0.45s ease, filter 0.45s ease",
        }}
      >
        {pair.map((slug) => (
          <GridStation key={slug} painting={bySlug(slug)} cells={cellsMap[slug] || []} onPaint={(i, c) => paintCell(slug, i, c)} interactive={revealed} />
        ))}
      </div>
    </>
  );
}

function Original({ slug, side, pct, done }: { slug: string; side: "left" | "right"; pct: number; done: boolean }) {
  const p = bySlug(slug);
  return (
    <div
      data-cb-original={slug}
      className="brut"
      style={{
        position: "absolute",
        // stagger them: left sits up top, right drops to the bottom
        ...(side === "left" ? { top: 4 } : { bottom: 4 }),
        [side]: -(ORIG_W + 14),
        width: ORIG_W,
        zIndex: 6,
        background: "#fdf6e3",
        padding: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        pointerEvents: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.image} alt={p.title} style={{ width: "100%", height: 158, objectFit: "cover", border: "2px solid #07090a", display: "block" }} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#07090a", textAlign: "center", lineHeight: 1.3 }}>
        {done ? "✓ " : ""}{p.title}
      </span>
      <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 9, border: "2px solid #07090a", background: "#fff" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "#4a8f3d", transition: "width 0.15s" }} />
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#07090a" }}>{pct}%</span>
      </div>
    </div>
  );
}

function GridStation({ painting, cells, onPaint, interactive }: { painting: Painting; cells: number[]; onPaint: (i: number, color: number) => void; interactive: boolean }) {
  const [sel, setSel] = useState(0);
  const dragging = useRef(false);

  useEffect(() => {
    const up = () => { dragging.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const correct = useMemo(() => cells.reduce((n, c, i) => n + (c === painting.grid[i] ? 1 : 0), 0), [cells, painting.grid]);
  const done = correct === painting.grid.length && painting.grid.length > 0;
  const gridW = painting.gw * CELL;
  const gridH = painting.gh * CELL;
  const paint = (i: number) => onPaint(i, sel);
  const remaining = (idx: number) => painting.grid.reduce((n, t, i) => n + (t === idx && cells[i] !== idx ? 1 : 0), 0);

  return (
    <div data-cb-station={painting.slug} className="brut" style={{ background: "#fdf6e3", padding: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <span style={{ fontFamily: "var(--font-pixel), monospace", fontSize: 8, color: "#07090a" }}>🎨 {painting.title}</span>

      <div style={{ position: "relative", width: gridW, height: gridH, border: "2px solid #07090a", boxShadow: "2px 2px 0 0 #07090a" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: `repeat(${painting.gw}, ${CELL}px)`, gridTemplateRows: `repeat(${painting.gh}, ${CELL}px)`, width: gridW, height: gridH }}
          onMouseLeave={() => { dragging.current = false; }}
        >
          {painting.grid.map((target, i) => {
            const cur = cells[i];
            const isCorrect = cur === target;
            const highlight = interactive && !isCorrect && target === sel;
            return (
              <div
                key={i}
                data-cb-cell={i}
                onMouseDown={(e) => { e.preventDefault(); dragging.current = true; paint(i); }}
                onMouseEnter={() => { if (dragging.current) paint(i); }}
                className={highlight ? "cb-hi" : undefined}
                style={{ width: CELL, height: CELL, boxSizing: "border-box", border: "1px solid rgba(7,9,10,0.15)", background: cur >= 0 ? painting.palette[cur] : "#fffef8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 7, color: "rgba(7,9,10,0.5)", cursor: "pointer", userSelect: "none" }}
              >
                {!isCorrect && target + 1}
              </div>
            );
          })}
        </div>
        {done && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={painting.image} alt={painting.title} className="painting-reveal" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>

      {done ? (
        <span style={{ fontFamily: "var(--font-pixel), monospace", fontSize: 8, color: "#07090a" }}>{painting.artist}, {painting.year}</span>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", maxWidth: gridW }}>
          {painting.palette.map((c, i) => {
            const rem = remaining(i);
            return (
              <button
                key={i}
                data-cb-swatch={i}
                onClick={() => setSel(i)}
                title={`colour ${i + 1} · ${rem} left`}
                style={{ width: 19, height: 19, background: c, border: "2px solid #07090a", outline: sel === i ? "2px solid #e8743a" : "none", outlineOffset: 1, cursor: "pointer", opacity: rem === 0 ? 0.4 : 1, fontFamily: "var(--font-mono)", fontSize: 8, color: "#fff", textShadow: "0 0 2px #000,0 0 2px #000" }}
              >
                {rem === 0 ? "✓" : i + 1}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
