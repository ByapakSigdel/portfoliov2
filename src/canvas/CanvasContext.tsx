"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CanvasState,
  EMPTY_STATE,
  PieceOffset,
  Stamp,
  Sticky,
  Stroke,
  Tool,
} from "./types";
import {
  clearLocal,
  encodeShareUrl,
  loadState,
  persistLocal,
} from "./persistence";
import {
  isClosedLoop,
  looksLikeHeart,
  mushroomRowDetected,
  piecesInsideLoop,
  strokeBBox,
} from "./detectors";

type EggEvent =
  | { type: "spin"; pieceIds: string[] }
  | { type: "grow"; pieceId: string }
  | { type: "blush" }
  | { type: "blueprint" }
  | { type: "party" }
  | { type: "shake" }
  | { type: "starfield" }
  | { type: "swarm" }
  | { type: "stop"; x: number; y: number }
  | { type: "explain"; name: string; text: string }
  | { type: "toast"; msg: string }
  | { type: "sparkle"; x: number; y: number };

type Ctx = {
  enabled: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  activeStamp: string;
  setActiveStamp: (s: string) => void;
  pencilColor: string;
  setPencilColor: (c: string) => void;
  pencilSize: number;
  setPencilSize: (n: number) => void;
  snapToGrid: boolean;
  setSnapToGrid: (v: boolean) => void;

  state: CanvasState;
  registerPiece: (id: string) => void;
  getOffset: (id: string) => PieceOffset;
  setOffset: (id: string, x: number, y: number) => void;
  addStroke: (s: Stroke) => void;
  eraseStrokeNear: (x: number, y: number, radius?: number) => void;
  addStamp: (s: Stamp) => void;
  removeStamp: (id: string) => void;
  addSticky: (s: Sticky) => void;
  updateSticky: (id: string, patch: Partial<Sticky>) => void;
  removeSticky: (id: string) => void;

  undo: () => void;
  redo: () => void;
  reset: () => void;
  saveLayout: () => void;
  shareUrl: () => string;

  eggBus: {
    subscribe: (fn: (e: EggEvent) => void) => () => void;
  };
  pieceIds: string[];
};

const CanvasCtx = createContext<Ctx | null>(null);

const SNAP = 8;
const snap = (n: number, on: boolean) => (on ? Math.round(n / SNAP) * SNAP : n);

export function useCanvas() {
  const c = useContext(CanvasCtx);
  if (!c) throw new Error("useCanvas must be inside <CanvasProvider>");
  return c;
}

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [tool, setTool] = useState<Tool>("select");
  const [activeStamp, setActiveStamp] = useState("butterfly");
  const [pencilColor, setPencilColor] = useState("#07090a");
  const [pencilSize, setPencilSize] = useState(3);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const [state, setState] = useState<CanvasState>(EMPTY_STATE);
  const undoStack = useRef<CanvasState[]>([]);
  const redoStack = useRef<CanvasState[]>([]);
  const initialised = useRef(false);

  const pieceIdsRef = useRef<Set<string>>(new Set());
  const [pieceIdsArr, setPieceIdsArr] = useState<string[]>([]);

  const subscribers = useRef<Set<(e: EggEvent) => void>>(new Set());
  const toolSequence = useRef<Tool[]>([]);
  const inkRef = useRef(0); // cumulative px of pencil drawn this session
  const nextStopInkRef = useRef(7500); // ink length that triggers the next "stop" gag

  const emit = useCallback((e: EggEvent) => {
    subscribers.current.forEach((fn) => fn(e));
  }, []);

  // Desktop / fine-pointer gating
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Load persisted state (after mount, after enabled known)
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const s = loadState();
    setState(s);
  }, []);

  // Track tool sequence for blueprint egg: select pencil eraser stamp pencil
  useEffect(() => {
    toolSequence.current = [...toolSequence.current, tool].slice(-5);
    const target: Tool[] = ["select", "pencil", "eraser", "stamp", "pencil"];
    if (
      toolSequence.current.length === 5 &&
      toolSequence.current.every((t, i) => t === target[i])
    ) {
      emit({ type: "blueprint" });
      toolSequence.current = [];
    }
  }, [tool, emit]);

  // Secret-word typing + arrow Konami code
  useEffect(() => {
    if (!enabled) return;
    const KONAMI = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
    ];
    const WORDS: Record<string, EggEvent[]> = {
      naruto: [{ type: "toast", msg: "believe it! 🍥" }, { type: "starfield" }],
      luffy: [{ type: "toast", msg: "king of the pirates 🏴‍☠️" }, { type: "party" }],
      goku: [{ type: "toast", msg: "KAMEHAMEHA 🔥" }, { type: "shake" }],
      party: [{ type: "party" }],
      dino: [{ type: "toast", msg: "rawr 🦖" }, { type: "grow" as const, pieceId: "hero-mascot" } as EggEvent],
    };
    let wordBuf = "";
    let konamiIdx = 0;
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt && (tgt.tagName === "TEXTAREA" || tgt.tagName === "INPUT" || tgt.isContentEditable)) return;

      // arrow konami
      const expected = KONAMI[konamiIdx];
      if (e.key === expected || e.key.toLowerCase() === expected) {
        konamiIdx++;
        if (konamiIdx === KONAMI.length) {
          emit({ type: "party" });
          emit({ type: "toast", msg: "↑↑↓↓←→←→ba — unlocked!" });
          konamiIdx = 0;
        }
      } else {
        konamiIdx = e.key === KONAMI[0] ? 1 : 0;
      }

      // secret words
      if (/^[a-zA-Z]$/.test(e.key)) {
        wordBuf = (wordBuf + e.key.toLowerCase()).slice(-12);
        for (const w of Object.keys(WORDS)) {
          if (wordBuf.endsWith(w)) {
            WORDS[w].forEach(emit);
            wordBuf = "";
            break;
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, emit]);

  const pushUndo = useCallback((prev: CanvasState) => {
    undoStack.current.push(prev);
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const mutate = useCallback(
    (fn: (s: CanvasState) => CanvasState) => {
      setState((prev) => {
        const next = fn(prev);
        pushUndo(prev);
        return next;
      });
    },
    [pushUndo]
  );

  const registerPiece = useCallback((id: string) => {
    if (!pieceIdsRef.current.has(id)) {
      pieceIdsRef.current.add(id);
      setPieceIdsArr(Array.from(pieceIdsRef.current));
    }
  }, []);

  const getOffset = useCallback(
    (id: string): PieceOffset => state.offsets[id] ?? { x: 0, y: 0 },
    [state.offsets]
  );

  const setOffset = useCallback(
    (id: string, x: number, y: number) => {
      mutate((s) => ({
        ...s,
        offsets: {
          ...s.offsets,
          [id]: { x: snap(x, snapToGrid), y: snap(y, snapToGrid) },
        },
      }));
    },
    [mutate, snapToGrid]
  );

  const addStroke = useCallback(
    (stroke: Stroke) => {
      mutate((s) => ({ ...s, strokes: [...s.strokes, stroke] }));
      // egg detection
      requestAnimationFrame(() => {
        let len = 0;
        for (let i = 1; i < stroke.points.length; i++) {
          len += Math.hypot(
            stroke.points[i].x - stroke.points[i - 1].x,
            stroke.points[i].y - stroke.points[i - 1].y
          );
        }
        if (looksLikeHeart(stroke.points)) {
          emit({ type: "blush" });
        } else if (isClosedLoop(stroke.points)) {
          const ids = piecesInsideLoop(stroke.points, Array.from(pieceIdsRef.current));
          if (ids.length) emit({ type: "spin", pieceIds: ids });
        }
        // Any doodle explains whatever it sits on — walks up to the nearest
        // [data-explain] element, so individual project cards work too.
        const bb = strokeBBox(stroke.points);
        if (bb) {
          const vx = (bb.minX + bb.maxX) / 2 - window.scrollX;
          const vy = (bb.minY + bb.maxY) / 2 - window.scrollY;
          for (const el of document.elementsFromPoint(vx, vy)) {
            const t = (el as HTMLElement).closest?.("[data-explain]") as HTMLElement | null;
            if (t) {
              emit({
                type: "explain",
                name: t.getAttribute("data-explain-name") || "",
                text: t.getAttribute("data-explain") || "",
              });
              break;
            }
          }
        }
        if (len > 2600) emit({ type: "shake" });
        // scribble-overload gag: Nagato says "stop" once enough total ink piles
        // up — counts cumulative length so a few big scribbles trigger it too.
        inkRef.current += len;
        if (inkRef.current >= nextStopInkRef.current) {
          nextStopInkRef.current = inkRef.current + 8000;
          const last = stroke.points[stroke.points.length - 1];
          emit({ type: "stop", x: last.x, y: last.y });
        }
      });
    },
    [mutate, emit]
  );

  const eraseStrokeNear = useCallback(
    (x: number, y: number, radius = 14) => {
      setState((prev) => {
        let changed = false;
        const strokes = prev.strokes.filter((stroke) => {
          for (const p of stroke.points) {
            if (Math.hypot(p.x - x, p.y - y) <= radius) {
              changed = true;
              return false;
            }
          }
          return true;
        });
        const stamps = prev.stamps.filter((st) => {
          if (Math.hypot(st.x - x, st.y - y) <= radius + 12) {
            changed = true;
            return false;
          }
          return true;
        });
        const stickies = prev.stickies.filter((st) => {
          if (Math.hypot(st.x - x, st.y - y) <= radius + 60) {
            changed = true;
            return false;
          }
          return true;
        });
        if (!changed) return prev;
        undoStack.current.push(prev);
        if (undoStack.current.length > 50) undoStack.current.shift();
        redoStack.current = [];
        const hadContent = prev.strokes.length + prev.stamps.length + prev.stickies.length > 0;
        const nowEmpty = strokes.length + stamps.length + stickies.length === 0;
        if (hadContent && nowEmpty) {
          requestAnimationFrame(() => emit({ type: "toast", msg: "clean slate ✨" }));
        }
        return { ...prev, strokes, stamps, stickies };
      });
    },
    [emit]
  );

  const addStamp = useCallback(
    (s: Stamp) => {
      mutate((cur) => ({ ...cur, stamps: [...cur.stamps, s] }));
      requestAnimationFrame(() => {
        setState((cur) => {
          if (mushroomRowDetected(cur.stamps)) {
            emit({ type: "grow", pieceId: "hero-mascot" });
          }
          if (cur.stamps.filter((x) => x.sprite === "star").length >= 3) {
            emit({ type: "starfield" });
          }
          if (cur.stamps.length >= 12) {
            emit({ type: "swarm" });
          }
          return cur;
        });
      });
    },
    [mutate, emit]
  );

  const removeStamp = useCallback(
    (id: string) =>
      mutate((s) => ({ ...s, stamps: s.stamps.filter((x) => x.id !== id) })),
    [mutate]
  );

  const addSticky = useCallback(
    (s: Sticky) =>
      mutate((cur) => ({ ...cur, stickies: [...cur.stickies, s] })),
    [mutate]
  );

  const updateSticky = useCallback(
    (id: string, patch: Partial<Sticky>) =>
      mutate((cur) => ({
        ...cur,
        stickies: cur.stickies.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      })),
    [mutate]
  );

  const removeSticky = useCallback(
    (id: string) =>
      mutate((cur) => ({
        ...cur,
        stickies: cur.stickies.filter((s) => s.id !== id),
      })),
    [mutate]
  );

  const undo = useCallback(() => {
    setState((cur) => {
      const prev = undoStack.current.pop();
      if (!prev) return cur;
      redoStack.current.push(cur);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState((cur) => {
      const next = redoStack.current.pop();
      if (!next) return cur;
      undoStack.current.push(cur);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => {
      undoStack.current.push(prev);
      return EMPTY_STATE;
    });
    inkRef.current = 0;
    nextStopInkRef.current = 7500;
    clearLocal();
  }, []);

  const saveLayout = useCallback(() => {
    persistLocal(state);
  }, [state]);

  const shareUrl = useCallback(() => encodeShareUrl(state), [state]);

  const eggBus = useMemo(
    () => ({
      subscribe: (fn: (e: EggEvent) => void) => {
        subscribers.current.add(fn);
        return () => subscribers.current.delete(fn) as unknown as void;
      },
    }),
    []
  );

  const value: Ctx = {
    enabled,
    editMode: enabled && editMode,
    setEditMode,
    tool,
    setTool,
    activeStamp,
    setActiveStamp,
    pencilColor,
    setPencilColor,
    pencilSize,
    setPencilSize,
    snapToGrid,
    setSnapToGrid,
    state,
    registerPiece,
    getOffset,
    setOffset,
    addStroke,
    eraseStrokeNear,
    addStamp,
    removeStamp,
    addSticky,
    updateSticky,
    removeSticky,
    undo,
    redo,
    reset,
    saveLayout,
    shareUrl,
    eggBus,
    pieceIds: pieceIdsArr,
  };

  return <CanvasCtx.Provider value={value}>{children}</CanvasCtx.Provider>;
}
