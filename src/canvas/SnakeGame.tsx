"use client";
import { useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";

export function SnakeGame() {
  const { enabled } = useCanvas();
  const [playing, setPlaying] = useState(false);
  if (!enabled) return null;
  return (
    <>
      {!playing && <SnakeRibbon onPlay={() => setPlaying(true)} />}
      {playing && <SnakeOverlay onExit={() => setPlaying(false)} />}
    </>
  );
}

/* ---- the decorative snake (snake.png) wrapping the writing divider ---- */
// content bbox measured from snake.png (1536x1024): x[138-1501] y[385-717]
const RIB_H = 52; // tall enough that the body weaves above & below the line
function SnakeRibbon({ onPlay }: { onPlay: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const place = () => {
      const bar = document.querySelector("[data-snake-bar]");
      const el = ref.current;
      if (bar && el) {
        const r = bar.getBoundingClientRect();
        const W = r.width;
        if (W < 20) { el.style.opacity = "0"; raf = requestAnimationFrame(place); return; }
        el.style.opacity = "1";
        el.style.width = `${W}px`;
        el.style.height = `${RIB_H}px`;
        // stretch the snake across the WHOLE divider, centred on the line so its
        // body crosses over/under it; scaleX(-1) flips it to face right
        el.style.transform = `translate(${r.left}px, ${r.top + 1.5 - RIB_H / 2}px) scaleX(-1)`;
        el.style.backgroundSize = `${(1536 * W) / 1364}px ${(1024 * RIB_H) / 333}px`;
        el.style.backgroundPosition = `${(-138 * W) / 1364}px ${(-385 * RIB_H) / 333}px`;
      }
      raf = requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      onClick={onPlay}
      title="🐍 click to play snake!"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        backgroundImage: "url(/sprites/snake.png)",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        zIndex: 45,
        cursor: "pointer",
        pointerEvents: "auto",
      }}
    />
  );
}

/* ---- the full-screen snake game ---- */
type Pt = { x: number; y: number };
const CELL = 22;

function SnakeOverlay({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const restartRef = useRef<() => void>(() => {});
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = window.innerWidth; // viewport (camera) size
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    // the WHOLE document is the playfield; the viewport is a camera that follows the snake
    const sx0 = window.scrollX;
    const sy0 = window.scrollY;
    const docW = Math.max(document.documentElement.scrollWidth, W);
    const docH = Math.max(document.documentElement.scrollHeight, H);
    const cols = Math.floor(docW / CELL);
    const rows = Math.floor(docH / CELL);

    // obstacles = every content block, in DOCUMENT cell coords, captured AT START
    const obstacles = new Set<string>();
    document.querySelectorAll("[data-piece]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const left = r.left + sx0, top = r.top + sy0;
      const c0 = Math.max(0, Math.floor(left / CELL));
      const c1 = Math.min(cols - 1, Math.floor((left + r.width - 1) / CELL));
      const r0 = Math.max(0, Math.floor(top / CELL));
      const r1 = Math.min(rows - 1, Math.floor((top + r.height - 1) / CELL));
      for (let c = c0; c <= c1; c++) for (let rr = r0; rr <= r1; rr++) obstacles.add(`${c},${rr}`);
    });
    // keep the head within this band of the viewport; scroll when it strays
    const updateCamera = (center: boolean) => {
      const hx = snake[0].x * CELL, hy = snake[0].y * CELL;
      const sx = window.scrollX, sy = window.scrollY;
      let tx = sx, ty = sy;
      if (center) { tx = hx - W / 2; ty = hy - H / 2; }
      else {
        const px = hx - sx, py = hy - sy;
        if (px < W * 0.3) tx = hx - W * 0.3; else if (px > W * 0.7) tx = hx - W * 0.7;
        if (py < H * 0.3) ty = hy - H * 0.3; else if (py > H * 0.7) ty = hy - H * 0.7;
      }
      tx = Math.max(0, Math.min(docW - W, tx));
      ty = Math.max(0, Math.min(docH - H, ty));
      if (Math.round(tx) !== Math.round(sx) || Math.round(ty) !== Math.round(sy)) window.scrollTo(tx, ty);
    };
    const isObstacle = (c: number, r: number) => obstacles.has(`${c},${r}`);
    const free = (c: number, r: number) => c >= 0 && c < cols && r >= 0 && r < rows && !isObstacle(c, r);

    // game state
    let snake: Pt[] = [];
    let dir: Pt = { x: 0, y: 1 };
    let nextDir: Pt = { x: 0, y: 1 };
    let food: Pt = { x: 0, y: 0 };
    let alive = true;
    let stepMs = 115;
    let acc = 0;
    let localScore = 0;

    const placeFood = () => {
      // bias food near the head (within ~a viewport) so it's reachable, not lost across the page
      const hy = snake.length ? snake[0].y : Math.floor((sy0 + H / 2) / CELL);
      const band = Math.floor(H / CELL) + 8;
      for (let t = 0; t < 5000; t++) {
        const x = (Math.random() * cols) | 0;
        const y = Math.max(0, Math.min(rows - 1, hy + ((Math.random() * band * 2) | 0) - band));
        if (free(x, y) && !snake.some((s) => s.x === x && s.y === y)) return { x, y };
      }
      for (let t = 0; t < 5000; t++) {
        const f = { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
        if (free(f.x, f.y) && !snake.some((s) => s.x === f.x && s.y === f.y)) return f;
      }
      return { x: 0, y: 0 };
    };

    const reset = () => {
      // start in a free vertical run within the view where the player clicked
      const startRow = Math.floor((sy0 + H * 0.35) / CELL);
      let start: Pt | null = null;
      for (let dr = 0; dr < rows && !start; dr++) {
        for (const ry of [startRow + dr, startRow - dr]) {
          if (ry < 1 || ry > rows - 5) continue;
          for (let c = 1; c < cols - 1; c++) {
            if (free(c, ry) && free(c, ry + 1) && free(c, ry + 2) && free(c, ry + 3)) { start = { x: c, y: ry }; break; }
          }
          if (start) break;
        }
      }
      if (!start) {
        outer: for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (free(c, r)) { start = { x: c, y: r }; break outer; }
      }
      const s = start || { x: 1, y: Math.floor(sy0 / CELL) + 2 };
      snake = [{ x: s.x, y: s.y + 2 }, { x: s.x, y: s.y + 1 }, { x: s.x, y: s.y }];
      dir = { x: 0, y: 1 };
      nextDir = { x: 0, y: 1 };
      food = placeFood();
      alive = true;
      stepMs = 115;
      localScore = 0;
      setScore(0);
      setOver(false);
      updateCamera(true);
    };
    restartRef.current = reset;
    reset();

    const step = () => {
      if (!alive) return;
      // commit a non-reversing direction
      if (nextDir.x !== -dir.x || nextDir.y !== -dir.y) dir = nextDir;
      const nx = snake[0].x + dir.x;
      const ny = snake[0].y + dir.y;
      // the edges of the WHOLE document are the walls
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || isObstacle(nx, ny) || snake.some((s) => s.x === nx && s.y === ny)) {
        alive = false;
        setOver(true);
        return;
      }
      snake.unshift({ x: nx, y: ny });
      if (nx === food.x && ny === food.y) {
        localScore += 1;
        setScore(localScore);
        stepMs = Math.max(70, 115 - Math.floor(localScore / 4) * 6);
        food = placeFood();
      } else {
        snake.pop();
      }
      updateCamera(false); // scroll the page to follow the snake
    };

    const roundRect = (x: number, y: number, w: number, h: number, rad: number) => {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    };

    // ---- snake sprites (content bboxes measured from the PNGs); head.png faces
    // LEFT, body is a horizontal strip, corner connects right+down, tail tip LEFT ----
    type Tile = { img: HTMLImageElement; bb: { x: number; y: number; w: number; h: number } };
    const mkImg = (src: string) => { const im = new Image(); im.src = src; return im; };
    const SP: Record<string, Tile> = {
      head: { img: mkImg("/sprites/snake-head.png"), bb: { x: 316, y: 332, w: 760, h: 392 } },
      body: { img: mkImg("/sprites/snake-body.png"), bb: { x: 695, y: 426, w: 144, h: 144 } },
      corner: { img: mkImg("/sprites/snake-corner.png"), bb: { x: 454, y: 427, w: 716, h: 236 } },
      tail: { img: mkImg("/sprites/snake-tail.png"), bb: { x: 398, y: 390, w: 726, h: 249 } },
    };
    const spritesReady = () => Object.values(SP).every((s) => s.img.complete && s.img.naturalWidth > 0);
    // direction between two adjacent cells, handling wall wrap
    const segDir = (from: Pt, to: Pt): Pt => {
      let dx = to.x - from.x; if (dx > 1) dx = -1; else if (dx < -1) dx = 1;
      let dy = to.y - from.y; if (dy > 1) dy = -1; else if (dy < -1) dy = 1;
      return { x: dx, y: dy };
    };
    // map a LEFT-facing tile so it points in direction d (flip for right, rotate for up/down)
    const faceTransform = (d: Pt) => {
      if (d.x === 1) return { rot: 0, fx: true };
      if (d.y === -1) return { rot: 90, fx: false };
      if (d.y === 1) return { rot: -90, fx: false };
      return { rot: 0, fx: false }; // left
    };
    const drawTile = (s: Tile, cx: number, cy: number, rot: number, fx: boolean, fy: boolean) => {
      ctx.save();
      ctx.translate(cx, cy);
      if (rot) ctx.rotate((rot * Math.PI) / 180);
      if (fx || fy) ctx.scale(fx ? -1 : 1, fy ? -1 : 1);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(s.img, s.bb.x, s.bb.y, s.bb.w, s.bb.h, -CELL / 2, -CELL / 2, CELL, CELL);
      ctx.restore();
    };
    const drawSnakeSprites = (ox: number, oy: number) => {
      for (let i = 0; i < snake.length; i++) {
        const cx = snake[i].x * CELL + CELL / 2 - ox;
        const cy = snake[i].y * CELL + CELL / 2 - oy;
        if (i === 0) {
          const d = snake.length > 1 ? segDir(snake[1], snake[0]) : dir;
          const t = faceTransform(d);
          drawTile(SP.head, cx, cy, t.rot, t.fx, false);
        } else if (i === snake.length - 1) {
          const d = segDir(snake[i - 1], snake[i]); // tip points away from the body
          const t = faceTransform(d);
          drawTile(SP.tail, cx, cy, t.rot, t.fx, false);
        } else {
          const a = segDir(snake[i], snake[i - 1]); // toward head
          const b = segDir(snake[i], snake[i + 1]); // toward tail
          if (a.x === -b.x && a.y === -b.y) {
            drawTile(SP.body, cx, cy, a.x !== 0 ? 0 : 90, false, false);
          } else {
            // corner base connects right+down → flipX for left, flipY for up
            drawTile(SP.corner, cx, cy, 0, a.x === -1 || b.x === -1, a.y === -1 || b.y === -1);
          }
        }
      }
    };

    const draw = () => {
      const ox = window.scrollX; // camera offset (document → screen)
      const oy = window.scrollY;
      ctx.clearRect(0, 0, W, H);
      // dim the page for focus
      ctx.fillStyle = "rgba(18,16,14,0.34)";
      ctx.fillRect(0, 0, W, H);
      // danger zones (content blocks) — only the ones currently on screen
      ctx.fillStyle = "rgba(214,64,40,0.22)";
      const vc0 = Math.floor(ox / CELL), vc1 = Math.ceil((ox + W) / CELL);
      const vr0 = Math.floor(oy / CELL), vr1 = Math.ceil((oy + H) / CELL);
      for (let c = vc0; c <= vc1; c++) for (let r = vr0; r <= vr1; r++) if (obstacles.has(`${c},${r}`)) ctx.fillRect(c * CELL - ox, r * CELL - oy, CELL, CELL);
      // food (apple)
      const fx = food.x * CELL + CELL / 2 - ox;
      const fy = food.y * CELL + CELL / 2 - oy;
      ctx.fillStyle = "#e0392f";
      ctx.beginPath();
      ctx.arc(fx, fy, CELL * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(fx - 3, fy - 3, CELL * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3a6e2e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy - CELL * 0.32);
      ctx.lineTo(fx + 3, fy - CELL * 0.5);
      ctx.stroke();
      // snake — use the sprites once loaded, else a simple procedural fallback
      if (spritesReady()) {
        drawSnakeSprites(ox, oy);
      } else {
        for (let i = snake.length - 1; i >= 0; i--) {
          const s = snake[i];
          const x = s.x * CELL - ox, y = s.y * CELL - oy;
          ctx.fillStyle = i === 0 ? "#5fa052" : "#4a8f3d";
          roundRect(x + 1.5, y + 1.5, CELL - 3, CELL - 3, 5);
          ctx.fill();
          ctx.strokeStyle = "#07090a";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      if (alive) {
        acc += dt;
        while (acc >= stepMs) { acc -= stepMs; step(); }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "escape") { exitRef.current(); return; }
      let nd: Pt | null = null;
      if (k === "arrowup" || k === "w") nd = { x: 0, y: -1 };
      else if (k === "arrowdown" || k === "s") nd = { x: 0, y: 1 };
      else if (k === "arrowleft" || k === "a") nd = { x: -1, y: 0 };
      else if (k === "arrowright" || k === "d") nd = { x: 1, y: 0 };
      if (nd) { e.preventDefault(); nextDir = nd; }
    };
    window.addEventListener("keydown", onKey, { passive: false });

    // the game drives the scroll (camera); block manual scrolling, and make our
    // programmatic scrolls instant (the site has smooth-scroll enabled)
    const prevScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    const blockScroll = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
      window.scrollTo(sx0, sy0); // return to where the player started
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "auto" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-pixel), monospace",
          fontSize: 11,
          color: "#f3e8cf",
          background: "#07090a",
          border: "2px solid #4a8f3d",
          padding: "8px 14px",
          whiteSpace: "nowrap",
        }}
      >
        🐍 snake · score {score} · arrows/WASD · roam the whole site · Esc to exit
      </div>

      <button
        onClick={onExit}
        style={{ position: "absolute", top: 14, right: 14, fontFamily: "var(--font-pixel), monospace", fontSize: 10, color: "#07090a", background: "#f3e8cf", border: "2px solid #07090a", padding: "8px 12px", cursor: "pointer" }}
      >
        ✕ exit
      </button>

      {over && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "#f3e8cf",
            border: "3px solid #07090a",
            boxShadow: "8px 8px 0 0 #07090a",
            padding: "22px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-pixel), monospace", fontSize: 18, color: "#07090a" }}>game over</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#07090a" }}>you ate {score} 🍎</div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => restartRef.current()} className="brut-press" style={{ fontFamily: "var(--font-pixel), monospace", fontSize: 11, color: "#fff", background: "#4a8f3d", border: "2px solid #07090a", padding: "8px 14px", cursor: "pointer" }}>
              ↻ play again
            </button>
            <button onClick={onExit} className="brut-press" style={{ fontFamily: "var(--font-pixel), monospace", fontSize: 11, color: "#07090a", background: "#fff", border: "2px solid #07090a", padding: "8px 14px", cursor: "pointer" }}>
              ✕ exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
