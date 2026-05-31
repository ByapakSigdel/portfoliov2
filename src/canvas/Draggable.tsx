"use client";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";

type Props = {
  id: string;
  children: React.ReactNode;
  className?: string;
  /** hovering the piece makes it bounce and toss up a ✋ greeting */
  greet?: boolean;
};

export function Draggable({ id, children, className, greet }: Props) {
  const {
    enabled,
    editMode,
    tool,
    getOffset,
    setOffset,
    registerPiece,
    eggBus,
  } = useCanvas();

  const offset = getOffset(id);
  const controls = useAnimation();
  const [grow, setGrow] = useState(false);
  const [spin, setSpin] = useState(false);
  const [blush, setBlush] = useState(false);
  const [jump, setJump] = useState(false);
  const [wave, setWave] = useState(false);
  const greetCooldown = useRef(false);
  const startOffset = useRef({ x: 0, y: 0 });

  const doGreet = () => {
    if (!enabled || !greet || greetCooldown.current) return;
    greetCooldown.current = true;
    setJump(true);
    setWave(true);
    setTimeout(() => setJump(false), 600);
    setTimeout(() => setWave(false), 900);
    setTimeout(() => { greetCooldown.current = false; }, 1100);
  };

  useEffect(() => registerPiece(id), [id, registerPiece]);

  useEffect(() => {
    controls.start({ x: offset.x, y: offset.y, transition: { type: "spring", stiffness: 500, damping: 40 } });
  }, [offset.x, offset.y, controls]);

  useEffect(() => {
    return eggBus.subscribe((e) => {
      if (e.type === "spin" && e.pieceIds.includes(id)) {
        setSpin(true);
        setTimeout(() => setSpin(false), 1200);
      }
      if (e.type === "grow" && e.pieceId === id) {
        setGrow(true);
        setTimeout(() => setGrow(false), 1400);
      }
      if (e.type === "blush" && id === "hero-mascot") {
        setBlush(true);
        setTimeout(() => setBlush(false), 1600);
      }
    });
  }, [eggBus, id]);

  const canDrag = enabled && editMode && tool === "select";

  return (
    <motion.div
      data-piece={id}
      drag={canDrag}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => {
        startOffset.current = { ...offset };
      }}
      onDragEnd={(_, info) => {
        setOffset(id, startOffset.current.x + info.offset.x, startOffset.current.y + info.offset.y);
      }}
      animate={controls}
      style={{
        position: "relative",
        cursor: canDrag ? "grab" : undefined,
        touchAction: canDrag ? "none" : undefined,
        userSelect: canDrag ? "none" : undefined,
        zIndex: canDrag ? 5 : undefined,
      }}
      whileDrag={{ cursor: "grabbing", scale: 1.02, zIndex: 50 }}
      className={className}
      onMouseEnter={doGreet}
      onDoubleClick={() => {
        if (!enabled) return;
        setJump(true);
        setTimeout(() => setJump(false), 600);
      }}
      tabIndex={canDrag ? 0 : -1}
      onKeyDown={(e) => {
        if (!canDrag) return;
        const step = e.shiftKey ? 16 : 8;
        if (e.key === "ArrowLeft") { e.preventDefault(); setOffset(id, offset.x - step, offset.y); }
        if (e.key === "ArrowRight") { e.preventDefault(); setOffset(id, offset.x + step, offset.y); }
        if (e.key === "ArrowUp") { e.preventDefault(); setOffset(id, offset.x, offset.y - step); }
        if (e.key === "ArrowDown") { e.preventDefault(); setOffset(id, offset.x, offset.y + step); }
        if (e.key === "Home") { e.preventDefault(); setOffset(id, 0, 0); }
      }}
    >
      <div
        className={jump ? "piece-jump" : undefined}
        style={{
          height: "100%",
          transformOrigin: "center",
          transform: `${spin ? "rotate(360deg) " : ""}${grow ? "scale(1.25) " : ""}`.trim(),
          transition: spin ? "transform 1.2s ease-in-out" : "transform 1.2s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {children}
        {wave && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: -10,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 26,
              pointerEvents: "none",
              zIndex: 20,
              animation: "pieceJump 0.6s ease-out",
            }}
          >
            ✋
          </span>
        )}
        {blush && id === "hero-mascot" && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "30%",
              top: "55%",
              width: "40%",
              height: "12%",
              background: "radial-gradient(ellipse at center, rgba(232,116,58,0.7), transparent 70%)",
              pointerEvents: "none",
              animation: "blink 0.6s ease-in-out 2",
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
