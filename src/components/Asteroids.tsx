"use client";
import { useEffect, useRef, useState } from "react";

type Ship = { x: number; y: number; a: number; vx: number; vy: number; invuln: number };
type Bullet = { x: number; y: number; vx: number; vy: number; life: number };
type Roid = { x: number; y: number; vx: number; vy: number; r: number; a: number; spin: number; verts: number[] };

const HEIGHT = 76; // a subtle strip, not a billboard
const ROT = 0.075;
const THRUST = 0.1;
const FRICTION = 0.99;
const MAXV = 3.2;
const BULLET_V = 4.6;
const BULLET_LIFE = 40;
const FIRE_CD = 9;
const SIZE = { L: 17, M: 11, S: 7 };
const COLORS = { bg: "#0a0d0a", line: "#cdbf9b", ship: "#9ee6a0", bullet: "#e8743a", thrust: "#e8a87c" };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeRoid(x: number, y: number, r: number): Roid {
  const n = 10;
  const verts = Array.from({ length: n }, () => rand(0.72, 1.12));
  const sp = rand(0.35, 1.0) * (SIZE.L / r) * 0.5 + 0.25;
  const dir = rand(0, Math.PI * 2);
  return { x, y, vx: Math.cos(dir) * sp, vy: Math.sin(dir) * sp, r, a: rand(0, Math.PI * 2), spin: rand(-0.03, 0.03), verts };
}

export default function Asteroids() {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);

  const activeRef = useRef(false);
  const ship = useRef<Ship>({ x: 200, y: HEIGHT / 2, a: -Math.PI / 2, vx: 0, vy: 0, invuln: 0 });
  const bullets = useRef<Bullet[]>([]);
  const roids = useRef<Roid[]>([]);
  const keys = useRef<Record<string, boolean>>({});
  const fireCd = useRef(0);
  const sz = useRef({ w: 400, h: HEIGHT, dpr: 1 });
  const scoreR = useRef(0);
  const livesR = useRef(3);
  const overR = useRef(false);

  useEffect(() => {
    const wrapEl = wrap.current;
    const canvas = cv.current;
    if (!wrapEl || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function spawnWave() {
      const { w, h } = sz.current;
      const out: Roid[] = [];
      for (let i = 0; i < 3; i++) {
        let x = 0;
        let y = 0;
        do {
          x = rand(0, w);
          y = rand(0, h);
        } while (Math.hypot(x - w / 2, y - h / 2) < 48);
        out.push(makeRoid(x, y, SIZE.L));
      }
      roids.current = out;
    }

    function reset() {
      const { w, h } = sz.current;
      scoreR.current = 0;
      livesR.current = 3;
      overR.current = false;
      setScore(0);
      setLives(3);
      setOver(false);
      bullets.current = [];
      ship.current = { x: w / 2, y: h / 2, a: -Math.PI / 2, vx: 0, vy: 0, invuln: 70 };
      spawnWave();
    }

    function resize() {
      const r = wrapEl!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sz.current = { w: r.width, h: r.height, dpr };
      canvas!.width = Math.round(r.width * dpr);
      canvas!.height = Math.round(r.height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ship.current.x = Math.min(ship.current.x, r.width);
      ship.current.y = Math.min(ship.current.y, r.height);
      if (!roids.current.length) {
        ship.current.x = r.width / 2;
        ship.current.y = r.height / 2;
        spawnWave();
      }
      if (!activeRef.current) draw(); // keep the idle scene rendered (frozen)
    }

    function fire() {
      const s = ship.current;
      bullets.current.push({
        x: s.x + Math.cos(s.a) * 8,
        y: s.y + Math.sin(s.a) * 8,
        vx: Math.cos(s.a) * BULLET_V + s.vx,
        vy: Math.sin(s.a) * BULLET_V + s.vy,
        life: BULLET_LIFE,
      });
    }

    function update() {
      const { w, h } = sz.current;
      const s = ship.current;
      const playing = activeRef.current && !overR.current;

      if (playing) {
        if (keys.current.left) s.a -= ROT;
        if (keys.current.right) s.a += ROT;
        if (keys.current.up) {
          s.vx += Math.cos(s.a) * THRUST;
          s.vy += Math.sin(s.a) * THRUST;
        }
        if (fireCd.current > 0) fireCd.current--;
        if (keys.current.space && fireCd.current === 0) {
          fire();
          fireCd.current = FIRE_CD;
        }
      }

      const spd = Math.hypot(s.vx, s.vy);
      if (spd > MAXV) {
        s.vx *= MAXV / spd;
        s.vy *= MAXV / spd;
      }
      s.vx *= FRICTION;
      s.vy *= FRICTION;
      s.x = (s.x + s.vx + w) % w;
      s.y = (s.y + s.vy + h) % h;
      if (s.invuln > 0) s.invuln--;

      for (const b of bullets.current) {
        b.x = (b.x + b.vx + w) % w;
        b.y = (b.y + b.vy + h) % h;
        b.life--;
      }
      bullets.current = bullets.current.filter((b) => b.life > 0);

      for (const a of roids.current) {
        a.x = (a.x + a.vx + w) % w;
        a.y = (a.y + a.vy + h) % h;
        a.a += a.spin;
      }

      for (let i = roids.current.length - 1; i >= 0; i--) {
        const a = roids.current[i];
        for (let j = bullets.current.length - 1; j >= 0; j--) {
          const b = bullets.current[j];
          if (Math.hypot(a.x - b.x, a.y - b.y) < a.r) {
            bullets.current.splice(j, 1);
            roids.current.splice(i, 1);
            scoreR.current += a.r > SIZE.M ? 20 : a.r > SIZE.S ? 50 : 100;
            setScore(scoreR.current);
            if (a.r > SIZE.M) roids.current.push(makeRoid(a.x, a.y, SIZE.M), makeRoid(a.x, a.y, SIZE.M));
            else if (a.r > SIZE.S) roids.current.push(makeRoid(a.x, a.y, SIZE.S), makeRoid(a.x, a.y, SIZE.S));
            break;
          }
        }
      }

      if (!roids.current.length) spawnWave();

      if (playing && s.invuln === 0) {
        for (const a of roids.current) {
          if (Math.hypot(a.x - s.x, a.y - s.y) < a.r + 5) {
            livesR.current--;
            setLives(livesR.current);
            s.x = w / 2;
            s.y = h / 2;
            s.vx = 0;
            s.vy = 0;
            s.a = -Math.PI / 2;
            s.invuln = 90;
            if (livesR.current <= 0) {
              overR.current = true;
              activeRef.current = false;
              setOver(true);
              setActive(false);
            }
            break;
          }
        }
      }
    }

    function draw() {
      const { w, h } = sz.current;
      ctx!.fillStyle = COLORS.bg;
      ctx!.fillRect(0, 0, w, h);

      ctx!.strokeStyle = COLORS.line;
      ctx!.lineWidth = 1.5;
      for (const a of roids.current) {
        ctx!.save();
        ctx!.translate(a.x, a.y);
        ctx!.rotate(a.a);
        ctx!.beginPath();
        const n = a.verts.length;
        for (let k = 0; k < n; k++) {
          const ang = (k / n) * Math.PI * 2;
          const rr = a.r * a.verts[k];
          const px = Math.cos(ang) * rr;
          const py = Math.sin(ang) * rr;
          if (k === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
        ctx!.closePath();
        ctx!.stroke();
        ctx!.restore();
      }

      ctx!.fillStyle = COLORS.bullet;
      for (const b of bullets.current) {
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, 1.6, 0, Math.PI * 2);
        ctx!.fill();
      }

      const s = ship.current;
      const blink = s.invuln > 0 && Math.floor(s.invuln / 5) % 2 === 0;
      if (!blink) {
        ctx!.save();
        ctx!.translate(s.x, s.y);
        ctx!.rotate(s.a);
        ctx!.strokeStyle = COLORS.ship;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(8, 0);
        ctx!.lineTo(-6, -5);
        ctx!.lineTo(-3, 0);
        ctx!.lineTo(-6, 5);
        ctx!.closePath();
        ctx!.stroke();
        if (activeRef.current && !overR.current && keys.current.up) {
          ctx!.strokeStyle = COLORS.thrust;
          ctx!.beginPath();
          ctx!.moveTo(-3, -2.5);
          ctx!.lineTo(-8, 0);
          ctx!.lineTo(-3, 2.5);
          ctx!.stroke();
        }
        ctx!.restore();
      }
    }

    // the loop runs ONLY while actively playing — idle = a frozen, static scene
    let raf = 0;
    function loop() {
      update();
      draw();
      if (!activeRef.current) {
        raf = 0;
        return; // froze: deactivated or game over
      }
      raf = requestAnimationFrame(loop);
    }
    function startLoop() {
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function stopLoop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function activate() {
      if (overR.current) reset();
      activeRef.current = true;
      setActive(true);
      wrapEl!.focus();
      startLoop();
    }
    function deactivate() {
      activeRef.current = false;
      keys.current = {};
      setActive(false);
      stopLoop();
      draw(); // freeze the current frame
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!activeRef.current) return;
      const k = e.key.toLowerCase();
      let used = true;
      if (k === "arrowleft" || k === "a") keys.current.left = true;
      else if (k === "arrowright" || k === "d") keys.current.right = true;
      else if (k === "arrowup" || k === "w") keys.current.up = true;
      else if (k === " " || k === "spacebar") keys.current.space = true;
      else if (k === "escape") deactivate();
      else used = false;
      if (used) e.preventDefault();
    }
    function onKeyUp(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") keys.current.left = false;
      else if (k === "arrowright" || k === "d") keys.current.right = false;
      else if (k === "arrowup" || k === "w") keys.current.up = false;
      else if (k === " " || k === "spacebar") keys.current.space = false;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrapEl);
    resize();

    wrapEl.addEventListener("click", activate);
    wrapEl.addEventListener("blur", deactivate);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrapEl.removeEventListener("click", activate);
      wrapEl.removeEventListener("blur", deactivate);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div
      ref={wrap}
      tabIndex={0}
      aria-label="asteroids mini-game — click to play"
      className="mt-8 brut bg-ink relative overflow-hidden outline-none cursor-pointer select-none"
      style={{ height: HEIGHT }}
    >
      <canvas ref={cv} className="block w-full h-full" />

      <div className="absolute top-1.5 left-2.5 font-pixel text-[8px] pointer-events-none opacity-80" style={{ color: COLORS.line }}>
        {score}
      </div>
      <div className="absolute top-1.5 right-2.5 font-pixel text-[8px] pointer-events-none opacity-80" style={{ color: COLORS.ship }}>
        {"▲".repeat(Math.max(0, lives)) || "·"}
      </div>

      {!active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-pixel text-[8px] sm:text-[9px] opacity-70" style={{ color: COLORS.line }}>
            {over ? `game over · ${score} · click to retry` : "▶ asteroids · click to play"}
          </span>
        </div>
      )}
    </div>
  );
}
