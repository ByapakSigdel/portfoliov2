export type Tool = "select" | "pencil" | "eraser" | "stamp" | "sticky";

export type Point = { x: number; y: number };

export type Stroke = {
  id: string;
  color: string;
  size: number;
  points: Point[];
};

export type Stamp = {
  id: string;
  sprite: string;
  x: number;
  y: number;
  rot: number;
};

export type Sticky = {
  id: string;
  x: number;
  y: number;
  text: string;
};

export type PieceOffset = { x: number; y: number };

export type CanvasState = {
  offsets: Record<string, PieceOffset>;
  strokes: Stroke[];
  stamps: Stamp[];
  stickies: Sticky[];
};

export const EMPTY_STATE: CanvasState = {
  offsets: {},
  strokes: [],
  stamps: [],
  stickies: [],
};

export const PIECES = {
  HERO_MASCOT: "hero-mascot",
  HERO_TEXT: "hero-text",
  MARQUEE: "marquee",
  NOW: "now",
  WORK: "work",
  WRITING: "writing",
  TASTE: "taste",
  FOOTER: "footer",
} as const;
