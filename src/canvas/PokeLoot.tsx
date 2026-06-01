"use client";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";

type Kind = "food" | "waste";
type Food = { uid: number; emoji: string; name: string };
type Drop = { uid: number; x: number; y: number; emoji: string };

// what's rattling around inside the crates — sometimes a treat, sometimes junk
const POOL: { kind: Kind; emoji: string; name: string; weight: number }[] = [
  { kind: "food", emoji: "🍓", name: "oran berry", weight: 3 },
  { kind: "food", emoji: "🍎", name: "an apple", weight: 2 },
  { kind: "food", emoji: "🍖", name: "hearty meat", weight: 2 },
  { kind: "food", emoji: "🍬", name: "a rare candy", weight: 1 },
  { kind: "waste", emoji: "🪨", name: "just a rock", weight: 2 },
  { kind: "waste", emoji: "🗑️", name: "rubbish", weight: 2 },
  { kind: "waste", emoji: "🥾", name: "an old boot", weight: 1 },
  { kind: "waste", emoji: "🧦", name: "a smelly sock", weight: 1 },
];
const TOTAL_W = POOL.reduce((a, b) => a + b.weight, 0);
function rollItem() {
  let r = Math.random() * TOTAL_W;
  for (const it of POOL) if ((r -= it.weight) < 0) return it;
  return POOL[0];
}

let seq = 0;

export function PokeLoot() {
  const { enabled, eggBus } = useCanvas();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [bag, setBag] = useState<Food[]>([]);

  useEffect(() => {
    return eggBus.subscribe((ev) => {
      if (ev.type !== "loot") return;
      const it = rollItem();
      const uid = ++seq;
      setDrops((d) => [...d, { uid, x: ev.x, y: ev.y, emoji: it.emoji }]);
      // resolve once the pop-out animation has played
      window.setTimeout(() => {
        setDrops((d) => d.filter((x) => x.uid !== uid));
        if (it.kind === "food") {
          setBag((b) => [...b, { uid, emoji: it.emoji, name: it.name }].slice(-12));
          eggBus.emit({ type: "toast", msg: `got ${it.emoji} ${it.name}! feed a pokémon ↑` });
        } else {
          eggBus.emit({ type: "toast", msg: `${it.emoji} ${it.name} — rubbish!` });
        }
      }, 880);
    });
  }, [eggBus]);

  if (!enabled) return null;

  const consume = (uid: number) => setBag((b) => b.filter((f) => f.uid !== uid));

  return (
    <>
      {/* items bursting out of a smashed crate */}
      {drops.map((d) => (
        <div
          key={d.uid}
          aria-hidden
          className="loot-pop"
          style={{
            position: "fixed",
            left: d.x,
            top: d.y,
            zIndex: 60,
            pointerEvents: "none",
            fontSize: 28,
            filter: "drop-shadow(2px 2px 0 rgba(7,9,10,0.3))",
          }}
        >
          {d.emoji}
        </div>
      ))}

      {/* the food bag — drag a treat onto a hungry pokémon to evolve it */}
      {bag.length > 0 && (
        <div
          style={{
            position: "fixed",
            right: 14,
            bottom: 14,
            zIndex: 92,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div
            className="brut"
            style={{
              background: "#f3e8cf",
              padding: "6px 8px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              maxWidth: 190,
              justifyContent: "flex-end",
              pointerEvents: "auto",
            }}
          >
            {bag.map((f) => (
              <FoodChip
                key={f.uid}
                food={f}
                onFeed={(monId) => {
                  eggBus.emit({ type: "feed", id: monId });
                  consume(f.uid);
                  eggBus.emit({ type: "toast", msg: `fed ${f.emoji} — yum!` });
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: 7,
              color: "#07090a",
              background: "#fff",
              border: "2px solid #07090a",
              padding: "2px 5px",
            }}
          >
            🎒 drag food → pokémon
          </span>
        </div>
      )}
    </>
  );
}

function FoodChip({ food, onFeed }: { food: Food; onFeed: (monId: string) => void }) {
  const controls = useAnimationControls();
  const ref = useRef<HTMLDivElement>(null);

  const onEnd = () => {
    const br = ref.current?.getBoundingClientRect();
    let fed = false;
    if (br) {
      const cx = br.left + br.width / 2;
      const cy = br.top + br.height / 2;
      const pad = 22;
      for (const m of Array.from(document.querySelectorAll("[data-poke-hungry]"))) {
        const mr = m.getBoundingClientRect();
        if (cx > mr.left - pad && cx < mr.right + pad && cy > mr.top - pad && cy < mr.bottom + pad) {
          const monId = m.getAttribute("data-poke-hungry");
          if (monId) {
            onFeed(monId);
            fed = true;
          }
          break;
        }
      }
    }
    if (!fed) controls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
  };

  return (
    <motion.div
      ref={ref}
      drag
      dragMomentum={false}
      animate={controls}
      onDragEnd={onEnd}
      whileDrag={{ scale: 1.3, zIndex: 99 }}
      title={`${food.name} — drag onto a hungry pokémon`}
      style={{ fontSize: 21, lineHeight: 1, cursor: "grab", touchAction: "none", userSelect: "none" }}
    >
      {food.emoji}
    </motion.div>
  );
}
