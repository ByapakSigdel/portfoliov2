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

/* ---- a small coiled snake icon by the writing divider — click to play ---- */
const ICON = 30;
function drawSnakeIcon(cv: HTMLCanvasElement) {
  cv.width = ICON;
  cv.height = ICON;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, ICON, ICON);
  const cx = ICON / 2 - 1.5, cy = ICON / 2 + 1;
  // a little spiral coil
  const pts: { x: number; y: number }[] = [];
  const turns = 1.55, steps = 48;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * 2 * Math.PI;
    const r = 2.4 + (i / steps) * 8.4;
    pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const stroke = (color: string, w: number) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.stroke();
  };
  const bw = 5.5;
  stroke("#07090a", bw + 3); // brutalist outline
  stroke("#4a8f3d", bw); // green body
  stroke("#7cbf63", bw * 0.34); // dorsal stripe

  // head at the outer end of the coil
  const h = pts[pts.length - 1];
  const p = pts[pts.length - 4];
  const ang = Math.atan2(h.y - p.y, h.x - p.x);
  ctx.beginPath(); ctx.arc(h.x, h.y, 4.3, 0, Math.PI * 2); ctx.fillStyle = "#5fa052"; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = "#07090a"; ctx.stroke();
  const ex = h.x + Math.cos(ang) * 1.1, ey = h.y + Math.sin(ang) * 1.1;
  ctx.beginPath(); ctx.arc(ex, ey, 1.5, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
  ctx.beginPath(); ctx.arc(ex + Math.cos(ang) * 0.6, ey + Math.sin(ang) * 0.6, 0.8, 0, Math.PI * 2); ctx.fillStyle = "#07090a"; ctx.fill();
  // tongue
  ctx.strokeStyle = "#e0392f"; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(h.x + Math.cos(ang) * 3.8, h.y + Math.sin(ang) * 3.8);
  ctx.lineTo(h.x + Math.cos(ang) * 7, h.y + Math.sin(ang) * 7);
  ctx.stroke();
}

function SnakeRibbon({ onPlay }: { onPlay: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawn = useRef(false);

  useEffect(() => {
    let raf = 0;
    const place = () => {
      const bar = document.querySelector("[data-snake-bar]");
      const wrap = wrapRef.current;
      const cv = canvasRef.current;
      if (bar && wrap && cv) {
        const r = bar.getBoundingClientRect();
        if (r.width < 12) { wrap.style.opacity = "0"; }
        else {
          wrap.style.opacity = "1";
          wrap.style.transform = `translate(${Math.round(r.left + 3)}px, ${Math.round(r.top + 1.5 - ICON / 2)}px)`;
          if (!drawn.current) { drawn.current = true; drawSnakeIcon(cv); }
        }
      }
      raf = requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={wrapRef}
      onClick={onPlay}
      title="🐍 play snake!"
      style={{ position: "fixed", left: 0, top: 0, width: ICON, height: ICON, zIndex: 45, cursor: "pointer", pointerEvents: "auto" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
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

    // ---- a clean, hand-drawn snake: one thick rounded path (no gaps, no seams),
    // a brown body with a dorsal stripe + black outline, a head with eyes and a
    // flicking tongue. Colours echo the snake.png ribbon. ----
    const drawSnake = (ox: number, oy: number) => {
      if (snake.length === 0) return;
      const pts = snake.map((s) => ({ x: s.x * CELL + CELL / 2 - ox, y: s.y * CELL + CELL / 2 - oy }));
      const bw = CELL * 0.82;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const strokePath = (color: string, w: number) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        ctx.stroke();
      };
      strokePath("#1c0f07", bw + 4); // outline
      strokePath("#7a3a18", bw); // body
      strokePath("#a85e2c", bw * 0.34); // dorsal stripe

      // head
      const h = pts[0];
      const d = snake.length > 1
        ? { x: Math.sign(snake[0].x - snake[1].x), y: Math.sign(snake[0].y - snake[1].y) }
        : dir;
      ctx.beginPath();
      ctx.arc(h.x, h.y, bw * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = "#8a4520";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1c0f07";
      ctx.stroke();
      // eyes (perpendicular to travel, looking forward)
      const px = -d.y, py = d.x;
      const ecx = h.x + d.x * bw * 0.12, ecy = h.y + d.y * bw * 0.12;
      const eo = bw * 0.3;
      for (const sgn of [1, -1]) {
        const ex = ecx + px * eo * sgn, ey = ecy + py * eo * sgn;
        ctx.beginPath(); ctx.arc(ex, ey, CELL * 0.15, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = "#1c0f07"; ctx.stroke();
        ctx.beginPath(); ctx.arc(ex + d.x * 1.6, ey + d.y * 1.6, CELL * 0.07, 0, Math.PI * 2); ctx.fillStyle = "#07090a"; ctx.fill();
      }
      // forked tongue, flicking
      if (performance.now() % 1400 < 320) {
        const mx = h.x + d.x * bw * 0.55, my = h.y + d.y * bw * 0.55;
        const tx = mx + d.x * CELL * 0.42, ty = my + d.y * CELL * 0.42;
        ctx.strokeStyle = "#e0392f"; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx, ty); ctx.lineTo(tx + px * CELL * 0.13 + d.x * CELL * 0.07, ty + py * CELL * 0.13 + d.y * CELL * 0.07);
        ctx.moveTo(tx, ty); ctx.lineTo(tx - px * CELL * 0.13 + d.x * CELL * 0.07, ty - py * CELL * 0.13 + d.y * CELL * 0.07);
        ctx.stroke();
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
      // snake
      drawSnake(ox, oy);
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
