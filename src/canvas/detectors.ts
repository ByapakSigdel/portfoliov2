import { Point, Stamp } from "./types";

export function strokeBBox(pts: Point[]) {
  if (!pts.length) return null;
  let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

// Detect a closed-loop / roughly-circular stroke
export function isClosedLoop(pts: Point[]): boolean {
  if (pts.length < 12) return false;
  const bb = strokeBBox(pts);
  if (!bb || bb.w < 40 || bb.h < 40) return false;
  const start = pts[0];
  const end = pts[pts.length - 1];
  const dist = Math.hypot(end.x - start.x, end.y - start.y);
  const diag = Math.hypot(bb.w, bb.h);
  return dist < diag * 0.25;
}

export function strokeCenter(pts: Point[]): Point | null {
  const bb = strokeBBox(pts);
  if (!bb) return null;
  return { x: (bb.minX + bb.maxX) / 2, y: (bb.minY + bb.maxY) / 2 };
}

// Find which (visible) pieces are enclosed by a loop. We do a simple
// bounding-box-contains check against the live DOM rect of each piece.
export function piecesInsideLoop(pts: Point[], pieceIds: string[]): string[] {
  const bb = strokeBBox(pts);
  if (!bb) return [];
  const out: string[] = [];
  for (const id of pieceIds) {
    const el = document.querySelector<HTMLElement>(`[data-piece="${id}"]`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 + window.scrollX;
    const cy = r.top + r.height / 2 + window.scrollY;
    if (cx >= bb.minX && cx <= bb.maxX && cy >= bb.minY && cy <= bb.maxY) {
      out.push(id);
    }
  }
  return out;
}

// 3 mushrooms within 120px horizontally and 80px vertically = "row of mushrooms"
export function mushroomRowDetected(stamps: Stamp[]): boolean {
  const m = stamps.filter((s) => s.sprite === "mushroom");
  if (m.length < 3) return false;
  for (let i = 0; i < m.length; i++) {
    for (let j = i + 1; j < m.length; j++) {
      for (let k = j + 1; k < m.length; k++) {
        const xs = [m[i].x, m[j].x, m[k].x];
        const ys = [m[i].y, m[j].y, m[k].y];
        const xSpan = Math.max(...xs) - Math.min(...xs);
        const ySpan = Math.max(...ys) - Math.min(...ys);
        if (xSpan <= 240 && ySpan <= 80) return true;
      }
    }
  }
  return false;
}

// Heart-ish: closed loop with two distinct top peaks (rough heuristic)
export function looksLikeHeart(pts: Point[]): boolean {
  if (!isClosedLoop(pts)) return false;
  const bb = strokeBBox(pts);
  if (!bb) return false;
  const topThird = bb.minY + bb.h * 0.33;
  const topPts = pts.filter((p) => p.y <= topThird);
  if (topPts.length < 6) return false;
  // Look for a dip in the middle: y rises then falls then rises again across x
  const mid = (bb.minX + bb.maxX) / 2;
  const left = topPts.filter((p) => p.x < mid);
  const right = topPts.filter((p) => p.x > mid);
  if (!left.length || !right.length) return false;
  const leftMin = Math.min(...left.map((p) => p.y));
  const rightMin = Math.min(...right.map((p) => p.y));
  const midPts = pts.filter((p) => Math.abs(p.x - mid) < bb.w * 0.1 && p.y < bb.minY + bb.h * 0.4);
  if (!midPts.length) return false;
  const midMax = Math.max(...midPts.map((p) => p.y));
  return midMax - Math.min(leftMin, rightMin) > bb.h * 0.08;
}
