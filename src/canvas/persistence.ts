import { CanvasState, EMPTY_STATE, Stamp } from "./types";

const KEY = "portfolio-canvas-v2";

// Drawings/stamps are ephemeral by default — they are NOT auto-saved, so a
// reload always starts fresh from the defaults (or an explicitly-saved layout /
// a shared URL). Only `Save` (localStorage) and `Share` (URL hash) persist.
export function loadState(): CanvasState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const fromHash = readHashState();
    if (fromHash) return fromHash;
    const saved = localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as CanvasState;
  } catch {}
  return defaultState();
}

// Naruto stickers pre-placed in the page gutters on first visit.
// Positions are computed from the live viewport so they sit in the empty
// margins beside the centred content (max-w 1024px) rather than over it.
export function defaultState(): CanvasState {
  if (typeof window === "undefined") return EMPTY_STATE;
  const vw = window.innerWidth;
  const contentLeft = Math.max(0, (vw - 1024) / 2);
  const contentRight = vw - contentLeft;
  const leftBand = contentLeft - 60; // x centre for left-gutter stickers
  const rightBand = contentRight + 60; // x centre for right-gutter stickers
  const canLeft = leftBand > 110; // clear of the fixed toolbar (~76px)
  const canRight = rightBand < vw - 30;

  const stamps: Stamp[] = [];
  let n = 0;
  const add = (sprite: string, x: number, y: number, rot: number) =>
    stamps.push({ id: `def-${++n}`, sprite, x: Math.round(x), y: Math.round(y), rot });

  if (canRight) {
    add("headband", rightBand, 250, -6);
    add("kunai", rightBand, 470, 9);
    add("ramen", rightBand, 770, -4);
    add("shuriken", rightBand, 1110, 12);
  }
  if (canLeft) {
    add("naruto", leftBand, 330, 5);
    add("rasengan", leftBand, 620, -8);
    add("narutomaki", leftBand, 980, 6);
  }
  // narrow desktop: tuck two into the top corners of the sky
  if (!canLeft && !canRight) {
    add("headband", Math.min(vw - 70, contentRight + 30), 240, -6);
    add("kunai", Math.max(95, contentLeft + 30), 300, 9);
  }
  return { ...EMPTY_STATE, stamps };
}

export function persistLocal(state: CanvasState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function clearLocal() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function encodeShareUrl(state: CanvasState): string {
  const json = JSON.stringify(state);
  const b64 = typeof window === "undefined" ? "" : btoa(unescape(encodeURIComponent(json)));
  const url = new URL(window.location.href);
  url.hash = `c=${b64}`;
  return url.toString();
}

function readHashState(): CanvasState | null {
  if (!window.location.hash) return null;
  const m = window.location.hash.match(/c=([^&]+)/);
  if (!m) return null;
  try {
    const json = decodeURIComponent(escape(atob(m[1])));
    return JSON.parse(json) as CanvasState;
  } catch {
    return null;
  }
}
