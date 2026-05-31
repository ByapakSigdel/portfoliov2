import { SpriteConfig } from "./SpriteAnimator";

// ─────────────────────────────────────────────────────────────────────────
// NINJA sprite-sheet config.
//
// Point `src` at the sheet PNG you drop into /public/sprites/.
// The CC0 "Ninja Adventure" pack (pixel-boy, itch.io) ships 16×16 character
// frames laid out as rows. The frame coords below are sensible defaults — open
// your downloaded sheet, count the columns/rows for each action, and tweak the
// [col,row] lists + frameW/H to match. The engine itself is layout-agnostic.
// ─────────────────────────────────────────────────────────────────────────
export const NINJA: SpriteConfig = {
  src: "/sprites/ninja-sheet.png",
  frameW: 16,
  frameH: 16,
  scale: 4,
  clips: {
    idle: { frames: [[0, 0], [1, 0], [2, 0], [3, 0]], fps: 6, loop: true },
    run: { frames: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]], fps: 12, loop: true },
    throw: { frames: [[0, 2], [1, 2], [2, 2], [3, 2]], fps: 14, loop: false },
    jump: { frames: [[0, 3], [1, 3]], fps: 8, loop: false },
  },
};
