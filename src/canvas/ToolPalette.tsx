"use client";
import { useEffect, useState } from "react";
import { useCanvas } from "./CanvasContext";
import { PENCIL_COLORS, SpritePreview, SVG_SPRITES, PIXEL_SPRITES, IMAGE_SPRITES } from "./sprites";
import { Tool } from "./types";

const TOOLS: { key: Tool; label: string; hotkey: string; icon: string }[] = [
  { key: "select", label: "select / move", hotkey: "V", icon: "⤢" },
  { key: "pencil", label: "pencil", hotkey: "P", icon: "✎" },
  { key: "eraser", label: "eraser", hotkey: "E", icon: "▦" },
  { key: "stamp", label: "stamp", hotkey: "S", icon: "★" },
  { key: "sticky", label: "sticky note", hotkey: "N", icon: "▤" },
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
    snapToGrid,
    setSnapToGrid,
    undo,
    redo,
    reset,
    saveLayout,
    shareUrl,
    eggBus,
  } = useCanvas();

  const [toast, setToast] = useState<string | null>(null);

  // Global hotkeys
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt && (tgt.tagName === "TEXTAREA" || tgt.tagName === "INPUT" || tgt.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
        if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
        if (e.key.toLowerCase() === "s") { e.preventDefault(); saveLayout(); showToast("layout saved"); return; }
        return;
      }
      if (e.key === "Escape") { setTool("select"); return; }
      const k = e.key.toLowerCase();
      const found = TOOLS.find((t) => t.hotkey.toLowerCase() === k);
      if (found) { e.preventDefault(); setTool(found.key); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, undo, redo, saveLayout, setTool]);

  // toast egg events
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

  const hasFlyout = tool === "pencil" || tool === "stamp";

  return (
    <>
      {/* Left-center vertical toolbar */}
      <div
        style={{
          position: "fixed",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          className="brut"
          style={{
            background: "#f3e8cf",
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {TOOLS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTool(t.key)}
              title={`${t.label} (${t.hotkey})`}
              className="brut-sm brut-press"
              style={toolBtn(tool === t.key)}
            >
              {t.icon}
            </button>
          ))}

          <span style={{ height: 2, background: "#07090a", margin: "2px 0" }} />

          <button onClick={undo} title="undo (⌘Z)" className="brut-sm brut-press" style={utilBtn()}>↶</button>
          <button onClick={redo} title="redo (⌘⇧Z)" className="brut-sm brut-press" style={utilBtn()}>↷</button>
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            title={`snap to grid: ${snapToGrid ? "on" : "off"}`}
            className="brut-sm brut-press"
            style={utilBtn(snapToGrid)}
          >
            #
          </button>
          <button
            onClick={() => { saveLayout(); showToast("layout saved"); }}
            title="save layout (⌘S)"
            className="brut-sm brut-press"
            style={utilBtn()}
          >
            ⤓
          </button>
          <button
            onClick={async () => {
              const url = shareUrl();
              try {
                await navigator.clipboard.writeText(url);
                showToast("share link copied");
              } catch {
                prompt("share link", url);
              }
            }}
            title="copy share link"
            className="brut-sm brut-press"
            style={utilBtn()}
          >
            ↗
          </button>
          <button
            onClick={() => { if (confirm("reset layout & drawings?")) { reset(); showToast("reset"); } }}
            title="reset everything"
            className="brut-sm brut-press"
            style={{ ...utilBtn(), background: "#b04a18", color: "#fff" }}
          >
            ⟲
          </button>
        </div>

        {/* Flyout: pencil colors / stamp picker */}
        {hasFlyout && (
          <div
            className="brut"
            style={{
              background: "#ffffff",
              padding: 10,
              maxWidth: 220,
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            {tool === "pencil" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontFamily: "var(--font-pixel)", fontSize: 9 }}>color</div>
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
                <div style={{ fontFamily: "var(--font-pixel)", fontSize: 9, marginTop: 4 }}>size</div>
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
                <div style={{ fontFamily: "var(--font-pixel)", fontSize: 9 }}>naruto</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[...IMAGE_SPRITES, ...PIXEL_SPRITES].map((s) => (
                    <StampButton key={s.key} k={s.key} label={s.label} active={activeStamp === s.key} onClick={() => setActiveStamp(s.key)} />
                  ))}
                </div>
                <div style={{ fontFamily: "var(--font-pixel)", fontSize: 9, marginTop: 4 }}>pixels</div>
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

      {/* hint label (first impression) */}
      <div
        style={{
          position: "fixed",
          left: 12,
          bottom: 12,
          zIndex: 90,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: "#1a1a14",
          background: "rgba(243,232,207,0.85)",
          border: "2px solid #07090a",
          padding: "4px 8px",
          pointerEvents: "none",
        }}
      >
        canvas: drag pieces · draw · stamp · {tool}
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
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
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

function toolBtn(active: boolean): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    background: active ? "#4a8f3d" : "#ffffff",
    color: active ? "#ffffff" : "#07090a",
    fontFamily: "var(--font-pixel), monospace",
    fontSize: 15,
    cursor: "pointer",
    lineHeight: 1,
  };
}

function utilBtn(active = false): React.CSSProperties {
  return {
    width: 40,
    height: 30,
    background: active ? "#4a8f3d" : "#ffffff",
    color: active ? "#ffffff" : "#07090a",
    fontFamily: "var(--font-pixel), monospace",
    fontSize: 13,
    cursor: "pointer",
    lineHeight: 1,
  };
}
