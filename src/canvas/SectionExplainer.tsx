"use client";
import { useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";

/**
 * Doodle over anything with a [data-explain] attribute and its blurb shows up
 * here. One reusable dialogue box: persistent, with a visibility toggle.
 */
export function SectionExplainer() {
  const { enabled, eggBus } = useCanvas();
  const [info, setInfo] = useState<{ name: string; text: string } | null>(null);
  const [hidden, setHidden] = useState(false);
  const currentName = useRef<string | null>(null);

  useEffect(() => {
    return eggBus.subscribe((e) => {
      if (e.type !== "explain" || !e.text) return;
      // only react when the target actually changes (respects a manual hide)
      if (e.name === currentName.current) return;
      currentName.current = e.name;
      setInfo({ name: e.name, text: e.text });
      setHidden(false);
    });
  }, [eggBus]);

  if (!enabled || !info) return null;

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        title="show explanation"
        style={{
          position: "fixed",
          top: 84,
          right: 16,
          zIndex: 110,
          fontFamily: "var(--font-pixel), monospace",
          fontSize: 10,
          background: "#4a8f3d",
          color: "#fff",
          border: "2px solid #07090a",
          boxShadow: "3px 3px 0 0 #07090a",
          padding: "6px 9px",
          cursor: "pointer",
          maxWidth: 220,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        ⓘ {info.name || "info"}
      </button>
    );
  }

  return (
    <div
      className="explain-box"
      key={info.name}
      style={{
        position: "fixed",
        top: 84,
        right: 16,
        width: 270,
        zIndex: 110,
        background: "#ffffff",
        border: "3px solid #07090a",
        boxShadow: "6px 6px 0 0 #07090a",
        fontFamily: "var(--font-mono), monospace",
        color: "#07090a",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: "#4a8f3d",
          color: "#fff",
          borderBottom: "3px solid #07090a",
          padding: "6px 8px",
        }}
      >
        <span style={{ fontFamily: "var(--font-pixel), monospace", fontSize: 10, lineHeight: 1.3 }}>
          {info.name || "what's this?"}
        </span>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={() => setHidden(true)} title="hide (toggle)" style={hdrBtn()}>–</button>
          <button onClick={() => { currentName.current = null; setInfo(null); }} title="close" style={hdrBtn()}>✕</button>
        </div>
      </div>
      <div style={{ padding: "10px 12px", fontSize: 13, lineHeight: 1.45, fontWeight: 500 }}>
        {info.text}
        <div style={{ marginTop: 8, fontSize: 10, opacity: 0.6 }}>✎ scribble on anything to learn about it</div>
      </div>
    </div>
  );
}

function hdrBtn(): React.CSSProperties {
  return {
    width: 20,
    height: 20,
    lineHeight: 1,
    background: "#fff",
    color: "#07090a",
    border: "2px solid #07090a",
    cursor: "pointer",
    fontFamily: "var(--font-mono), monospace",
    fontSize: 12,
    padding: 0,
  };
}
