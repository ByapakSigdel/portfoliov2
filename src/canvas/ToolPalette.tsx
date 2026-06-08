"use client";
import { useEffect, useState } from "react";
import {
  MousePointer2,
  Pencil,
  Eraser,
  Stamp,
  StickyNote,
  Undo2,
  Redo2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useCanvas } from "./CanvasContext";
import { PENCIL_COLORS, SpritePreview, SVG_SPRITES, PIXEL_SPRITES, IMAGE_SPRITES } from "./sprites";
import { Tool } from "./types";

const TOOLS: { key: Tool; label: string; hotkey: string; Icon: LucideIcon }[] = [
  { key: "select", label: "select & move", hotkey: "V", Icon: MousePointer2 },
  { key: "pencil", label: "draw", hotkey: "P", Icon: Pencil },
  { key: "eraser", label: "erase", hotkey: "E", Icon: Eraser },
  { key: "stamp", label: "stickers", hotkey: "S", Icon: Stamp },
  { key: "sticky", label: "sticky note", hotkey: "N", Icon: StickyNote },
];

export function ToolPalette() {
  const {
    enabled,
    tool,
    setTool,
    pencilColor,
    setPencilColor,
    pencilSize,
    setPencilSize,
    activeStamp,
    setActiveStamp,
    undo,
    redo,
    reset,
    eggBus,
  } = useCanvas();

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt && (tgt.tagName === "TEXTAREA" || tgt.tagName === "INPUT" || tgt.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
        if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
        return;
      }
      if (e.key === "Escape") { setTool("select"); return; }
      const found = TOOLS.find((t) => t.hotkey.toLowerCase() === e.key.toLowerCase());
      if (found) { e.preventDefault(); setTool(found.key); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, undo, redo, setTool]);

  useEffect(() => {
    return eggBus.subscribe((ev) => {
      if (ev.type === "toast") showToast(ev.msg);
    });
  }, [eggBus]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 2000);
  };

  if (!enabled) return null;

  const activeLabel = TOOLS.find((t) => t.key === tool)?.label ?? tool;
  const hasFlyout = tool === "pencil" || tool === "stamp";

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 100,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          // let pointer events through the container's transparent margins so you
          // can still draw "behind" the palette; only the panel + flyout capture them
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, pointerEvents: "none" }}>
          <div
            className="brut"
            style={{
              background: "#f3e8cf",
              padding: 7,
              display: "flex",
              flexDirection: "column",
              gap: 5,
              pointerEvents: "auto",
            }}
          >
            {TOOLS.map((t) => (
              <Btn
                key={t.key}
                title={`${t.label} · ${t.hotkey}`}
                active={tool === t.key}
                onClick={() => setTool(t.key)}
              >
                <t.Icon size={19} strokeWidth={2.25} />
              </Btn>
            ))}

            <span style={{ height: 2, background: "#07090a", margin: "3px 2px", opacity: 0.85 }} />

            <Btn title="undo · ⌘Z" onClick={undo}>
              <Undo2 size={18} strokeWidth={2.25} />
            </Btn>
            <Btn title="redo · ⌘⇧Z" onClick={redo}>
              <Redo2 size={18} strokeWidth={2.25} />
            </Btn>
            <Btn
              title="clear everything"
              danger
              onClick={() => { if (confirm("clear all drawings, stamps & notes?")) { reset(); showToast("cleared"); } }}
            >
              <Trash2 size={18} strokeWidth={2.25} />
            </Btn>
          </div>

          {/* current tool caption — keeps it obvious what's selected */}
          <span
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: 8,
              color: "#07090a",
              background: "#fff",
              border: "2px solid #07090a",
              padding: "3px 6px",
              whiteSpace: "nowrap",
            }}
          >
            {activeLabel}
          </span>
        </div>

        {/* Flyout: draw colours / sticker picker */}
        {hasFlyout && (
          <div
            className="brut"
            style={{ background: "#ffffff", padding: 10, maxWidth: 220, maxHeight: "70vh", overflowY: "auto", pointerEvents: "auto" }}
          >
            {tool === "pencil" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Heading>colour</Heading>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {PENCIL_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setPencilColor(c)}
                      title={c}
                      style={{
                        width: 24,
                        height: 24,
                        background: c,
                        border: "2px solid #07090a",
                        outline: pencilColor === c ? "2px solid #e8743a" : "none",
                        outlineOffset: 1,
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
                <Heading>size</Heading>
                <div style={{ display: "flex", gap: 5 }}>
                  {[2, 3, 5, 8].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPencilSize(s)}
                      style={{
                        width: 30,
                        height: 26,
                        background: pencilSize === s ? "#4a8f3d" : "#ffffff",
                        color: pencilSize === s ? "#ffffff" : "#07090a",
                        border: "2px solid #07090a",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tool === "stamp" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Heading>naruto</Heading>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[...IMAGE_SPRITES, ...PIXEL_SPRITES].map((s) => (
                    <StampButton key={s.key} k={s.key} label={s.label} active={activeStamp === s.key} onClick={() => setActiveStamp(s.key)} />
                  ))}
                </div>
                <Heading>pixels</Heading>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {SVG_SPRITES.map((s) => (
                    <StampButton key={s.key} k={s.key} label={s.label} active={activeStamp === s.key} onClick={() => setActiveStamp(s.key)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 32,
            transform: "translateX(-50%)",
            background: "#07090a",
            color: "#f3e8cf",
            fontFamily: "var(--font-pixel), monospace",
            fontSize: 11,
            padding: "10px 14px",
            border: "2px solid #07090a",
            boxShadow: "4px 4px 0 0 #4a8f3d",
            zIndex: 200,
            pointerEvents: "none",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

function Btn({
  children,
  title,
  active,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const bg = active ? "#4a8f3d" : danger ? "#fff" : "#fff";
  const fg = active ? "#fff" : danger ? "#b04a18" : "#07090a";
  return (
    <button
      onClick={onClick}
      title={title}
      className="brut-press"
      style={{
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        color: fg,
        border: "2px solid #07090a",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "var(--font-pixel)", fontSize: 9 }}>{children}</div>;
}

function StampButton({ k, label, active, onClick }: { k: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 38,
        height: 38,
        background: active ? "#f0b388" : "#ffffff",
        border: "2px solid #07090a",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 0,
      }}
    >
      <SpritePreview k={k} />
    </button>
  );
}
