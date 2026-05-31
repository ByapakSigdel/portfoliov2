import React from "react";

type SvgSpriteDef = {
  key: string;
  label: string;
  svg: React.ReactNode;
};

export type PixelSpriteDef = {
  key: string;
  label: string;
  palette: Record<string, string>;
  rows: string[];
};

const px = (x: number, y: number, c: string, k: string | number) => (
  <rect key={k} x={x} y={y} width={1} height={1} fill={c} shapeRendering="crispEdges" />
);

const butterfly = (
  <g>
    {[
      [3, 1, "#e8743a"], [4, 1, "#e8743a"],
      [2, 2, "#e8743a"], [3, 2, "#b04a18"], [4, 2, "#b04a18"], [5, 2, "#e8743a"],
      [1, 3, "#e8743a"], [2, 3, "#b04a18"], [5, 3, "#b04a18"], [6, 3, "#e8743a"],
      [3, 4, "#07090a"], [4, 4, "#07090a"],
      [3, 5, "#07090a"], [4, 5, "#07090a"],
      [1, 6, "#e8743a"], [2, 6, "#b04a18"], [5, 6, "#b04a18"], [6, 6, "#e8743a"],
      [2, 7, "#e8743a"], [3, 7, "#e8743a"], [4, 7, "#e8743a"], [5, 7, "#e8743a"],
    ].map(([x, y, c], i) => px(x as number, y as number, c as string, i))}
  </g>
);

const mushroom = (
  <g>
    {[
      [3, 1, "#b04a18"], [4, 1, "#b04a18"],
      [2, 2, "#e8743a"], [3, 2, "#ffffff"], [4, 2, "#e8743a"], [5, 2, "#b04a18"],
      [1, 3, "#e8743a"], [2, 3, "#e8743a"], [3, 3, "#e8743a"], [4, 3, "#ffffff"], [5, 3, "#e8743a"], [6, 3, "#b04a18"],
      [1, 4, "#b04a18"], [2, 4, "#ffffff"], [3, 4, "#e8743a"], [4, 4, "#e8743a"], [5, 4, "#e8743a"], [6, 4, "#b04a18"],
      [3, 5, "#f3e8cf"], [4, 5, "#f3e8cf"],
      [3, 6, "#f3e8cf"], [4, 6, "#f3e8cf"],
    ].map(([x, y, c], i) => px(x as number, y as number, c as string, i))}
  </g>
);

const heart = (
  <g>
    {[
      [1, 1, "#b04a18"], [2, 1, "#b04a18"], [5, 1, "#b04a18"], [6, 1, "#b04a18"],
      [1, 2, "#e8743a"], [2, 2, "#b04a18"], [3, 2, "#b04a18"], [4, 2, "#b04a18"], [5, 2, "#b04a18"], [6, 2, "#e8743a"],
      [1, 3, "#e8743a"], [2, 3, "#b04a18"], [3, 3, "#b04a18"], [4, 3, "#b04a18"], [5, 3, "#b04a18"], [6, 3, "#e8743a"],
      [2, 4, "#e8743a"], [3, 4, "#b04a18"], [4, 4, "#b04a18"], [5, 4, "#e8743a"],
      [3, 5, "#e8743a"], [4, 5, "#e8743a"],
    ].map(([x, y, c], i) => px(x as number, y as number, c as string, i))}
  </g>
);

const star = (
  <g>
    {[
      [3, 0, "#e8a87c"], [4, 0, "#e8a87c"],
      [3, 1, "#e8743a"], [4, 1, "#e8743a"],
      [0, 2, "#e8a87c"], [1, 2, "#e8743a"], [2, 2, "#e8743a"], [3, 2, "#e8743a"], [4, 2, "#e8743a"], [5, 2, "#e8743a"], [6, 2, "#e8743a"], [7, 2, "#e8a87c"],
      [1, 3, "#e8743a"], [2, 3, "#e8743a"], [3, 3, "#e8743a"], [4, 3, "#e8743a"], [5, 3, "#e8743a"], [6, 3, "#e8743a"],
      [2, 4, "#e8743a"], [3, 4, "#e8743a"], [4, 4, "#e8743a"], [5, 4, "#e8743a"],
      [1, 5, "#e8743a"], [2, 5, "#e8743a"], [5, 5, "#e8743a"], [6, 5, "#e8743a"],
      [0, 6, "#e8a87c"], [1, 6, "#e8743a"], [6, 6, "#e8743a"], [7, 6, "#e8a87c"],
    ].map(([x, y, c], i) => px(x as number, y as number, c as string, i))}
  </g>
);

const skull = (
  <g>
    {[
      [2, 1, "#f3e8cf"], [3, 1, "#f3e8cf"], [4, 1, "#f3e8cf"], [5, 1, "#f3e8cf"],
      [1, 2, "#f3e8cf"], [2, 2, "#f3e8cf"], [3, 2, "#f3e8cf"], [4, 2, "#f3e8cf"], [5, 2, "#f3e8cf"], [6, 2, "#f3e8cf"],
      [1, 3, "#f3e8cf"], [2, 3, "#07090a"], [3, 3, "#f3e8cf"], [4, 3, "#f3e8cf"], [5, 3, "#07090a"], [6, 3, "#f3e8cf"],
      [1, 4, "#f3e8cf"], [2, 4, "#07090a"], [3, 4, "#f3e8cf"], [4, 4, "#f3e8cf"], [5, 4, "#07090a"], [6, 4, "#f3e8cf"],
      [2, 5, "#f3e8cf"], [3, 5, "#07090a"], [4, 5, "#07090a"], [5, 5, "#f3e8cf"],
      [2, 6, "#f3e8cf"], [3, 6, "#f3e8cf"], [4, 6, "#f3e8cf"], [5, 6, "#f3e8cf"],
      [2, 7, "#f3e8cf"], [4, 7, "#f3e8cf"], [6, 7, "#f3e8cf"],
    ].map(([x, y, c], i) => px(x as number, y as number, c as string, i))}
  </g>
);

export const SVG_SPRITES: SvgSpriteDef[] = [
  { key: "butterfly", label: "butterfly", svg: butterfly },
  { key: "mushroom", label: "mushroom", svg: mushroom },
  { key: "heart", label: "heart", svg: heart },
  { key: "star", label: "star", svg: star },
  { key: "skull", label: "skull", svg: skull },
];

// ── Naruto pixel-art stickers ──────────────────────────────────────
// Each row is a string; every char maps to a palette colour, "." / " " = transparent.
const PAL = {
  K: "#07090a", // outline
  o: "#f08a3c", // orange
  O: "#c25a16", // orange shadow
  y: "#ffd23f", // blonde hair
  Y: "#e0a81e", // hair shadow
  s: "#ffce9e", // skin
  S: "#e0a06a", // skin shadow
  b: "#3b7dd8", // headband blue
  B: "#245a9e", // blue shadow
  m: "#cdd6dd", // metal
  M: "#8a96a1", // metal shadow
  w: "#ffffff", // white
  p: "#ff8fb0", // pink swirl
  P: "#e85f8a", // pink dark
  c: "#7cc6ff", // rasengan light
  C: "#2f7fd0", // rasengan core
  D: "#1c4f8a", // rasengan deep
  g: "#4a8f3d", // leaf green
  h: "#3a2a18", // handle brown
  n: "#f6e3b0", // noodle
  r: "#a86a34", // bowl
  R: "#7a4a22", // bowl dark
} as const;

export const PIXEL_SPRITES: PixelSpriteDef[] = [
  {
    key: "narutomaki",
    label: "naruto-maki",
    palette: PAL,
    rows: [
      "....KKKKKK....",
      "..KKwwwwwwKK..",
      ".KwwwwwwwwwwK.",
      ".KwwwPPPPwwwK.",
      "KwwwPpppPwwwwK",
      "KwwPpwwwwPpwwK",
      "KwwPpwPPwpPwwK",
      "KwwPpwwPwpPwwK",
      "KwwwPppPPpwwwK",
      ".KwwwPPPPwwwK.",
      ".KwwwwwwwwwwK.",
      "..KKwwwwwwKK..",
      "....KKKKKK....",
    ],
  },
  {
    key: "headband",
    label: "leaf headband",
    palette: PAL,
    rows: [
      "KKKKKKKKKKKKKKKKKK",
      "KbbKmmmmmmmmmmKbbK",
      "KbbKmmgggmmmmmKbbK",
      "KbbKmgmmgmmmmmKbbK",
      "KbbKmgmggmmmmmKbbK",
      "KbbKmggmmmmmmmKbbK",
      "KbbKmmgmmmmmmmKbbK",
      "KbbKmmmmmmmmmmKbbK",
      "KKKKKKKKKKKKKKKKKK",
    ],
  },
  {
    key: "rasengan",
    label: "rasengan",
    palette: PAL,
    rows: [
      "....KKKKKK....",
      "..KKccccccKK..",
      ".KccccCCccccK.",
      ".KcccCDDCcccK.",
      "KcccCDwwDCcccK",
      "KccCDwDDwDCccK",
      "KccCwDCCDwCccK",
      "KccCDwDDwDCccK",
      "KcccCDwwDCcccK",
      ".KcccCDDCcccK.",
      ".KccccCCccccK.",
      "..KKccccccKK..",
      "....KKKKKK....",
    ],
  },
  {
    key: "kunai",
    label: "kunai",
    palette: PAL,
    rows: [
      "...KK...",
      "..KmmK..",
      "..KmMK..",
      ".KmmMMK.",
      ".KmmMMK.",
      ".KmmMMK.",
      ".KmmMMK.",
      ".KKmMKK.",
      "..KhhK..",
      "..KhhK..",
      "..KhhK..",
      ".KhhhhK.",
      ".Kh..hK.",
      ".KhhhhK.",
      "..KKKK..",
    ],
  },
  {
    key: "shuriken",
    label: "shuriken",
    palette: PAL,
    rows: [
      "......K......",
      ".....KmK.....",
      "....KmmmK....",
      "...KmmmmmK...",
      "..KmmmmmmmK..",
      ".KmmmMKMmmmK.",
      "KmmmMKKKMmmmK",
      ".KmmmMKMmmmK.",
      "..KmmmmmmmK..",
      "...KmmmmmK...",
      "....KmmmK....",
      ".....KmK.....",
      "......K......",
    ],
  },
  {
    key: "ramen",
    label: "ramen",
    palette: PAL,
    rows: [
      "..K........K..",
      "...KnnnnnnK...",
      "..KnpPnnnpwK..",
      ".KnwnpPwnnnnK.",
      "KrnnnnnnnnnnrK",
      "KRrrrrrrrrrrRK",
      ".KRrrrrrrrrRK.",
      "..KRRRRRRRRK..",
      "....KKKKKK....",
    ],
  },
];

// Real image sprites you drop into /public/sprites — rendered as <img>.
export type ImageSpriteDef = {
  key: string;
  label: string;
  src: string;
  /** render multiplier — sprites with lots of transparent padding need >1 */
  scale?: number;
};

export const IMAGE_SPRITES: ImageSpriteDef[] = [
  { key: "naruto", label: "naruto", src: "/sprites/NarutoSprite.png", scale: 1.9 },
];

export type SpriteKind = "image" | "pixel" | "svg";

export const ALL_STAMP_KEYS = [
  ...IMAGE_SPRITES.map((s) => s.key),
  ...PIXEL_SPRITES.map((s) => s.key),
  ...SVG_SPRITES.map((s) => s.key),
];

function PixelArt({ def, size }: { def: PixelSpriteDef; size: number }) {
  const h = def.rows.length;
  const w = Math.max(...def.rows.map((r) => r.length));
  const rects: React.ReactNode[] = [];
  def.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = def.palette[row[x]];
      if (c) rects.push(px(x, y, c, `${x}-${y}`));
    }
  });
  const scale = size / Math.max(w, h);
  return (
    <svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      style={{ imageRendering: "pixelated", display: "block" }}
      aria-hidden
    >
      {rects}
    </svg>
  );
}

export function Sprite({ k, size = 32 }: { k: string; size?: number }) {
  const img = IMAGE_SPRITES.find((s) => s.key === k);
  if (img) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={img.src}
        alt={img.label}
        draggable={false}
        style={{ height: size * (img.scale ?? 1), width: "auto", display: "block" }}
      />
    );
  }
  const pixel = PIXEL_SPRITES.find((s) => s.key === k);
  if (pixel) return <PixelArt def={pixel} size={size} />;
  const def = SVG_SPRITES.find((s) => s.key === k);
  if (!def) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }} aria-hidden>
      {def.svg}
    </svg>
  );
}

/** Compact preview that fits inside a ~36px tool button. */
export function SpritePreview({ k }: { k: string }) {
  const isImg = IMAGE_SPRITES.some((s) => s.key === k);
  if (isImg) {
    const img = IMAGE_SPRITES.find((s) => s.key === k)!;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img.src} alt={img.label} draggable={false} style={{ height: 32, width: "auto", display: "block" }} />;
  }
  const isPixel = PIXEL_SPRITES.some((s) => s.key === k);
  return <Sprite k={k} size={isPixel ? 30 : 26} />;
}

export const PENCIL_COLORS = [
  "#07090a", // ink
  "#e8743a", // orange
  "#4a8f3d", // dino green
  "#b04a18", // deep orange
  "#2a5a22", // deep green
  "#ffffff", // white
];
