"use client";
import { useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasContext";

// Animated Gen-V sprites — self-hosted in /public/sprites/pokemon so nothing
// depends on an external host (ad/privacy blockers were hiding the hotlinked ones).
const SPRITE = (name: string) => `/sprites/pokemon/${name}.gif`;

// Rarity tiers. ballCol = column in /sprites/pokeballs.png (poké=0, great=1,
// ultra=3, master=4), so the ball's COLOUR signals the rarity. weight makes the
// rarer balls genuinely rarer to roll, and each tier has its own pokémon pool.
type Pair = { base: string; evo: string };
type Rarity = {
  key: string;
  short: string;
  ballName: string;
  ballCol: number;
  weight: number;
  color: string;
  glow: string;
  aura: boolean;
  pairs: Pair[];
};

const RARITIES: Rarity[] = [
  {
    key: "common", short: "poké", ballName: "poké ball", ballCol: 0, weight: 60,
    color: "#e0392f", glow: "rgba(224,57,47,0)", aura: false,
    pairs: [
      { base: "caterpie", evo: "metapod" },
      { base: "pikachu", evo: "raichu" },
      { base: "magikarp", evo: "gyarados" },
    ],
  },
  {
    key: "uncommon", short: "great", ballName: "great ball", ballCol: 1, weight: 26,
    color: "#2f6fe0", glow: "rgba(47,111,224,0.55)", aura: true,
    pairs: [
      { base: "bulbasaur", evo: "ivysaur" },
      { base: "charmander", evo: "charmeleon" },
      { base: "squirtle", evo: "wartortle" },
      { base: "chikorita", evo: "bayleef" },
      { base: "cyndaquil", evo: "quilava" },
      { base: "totodile", evo: "croconaw" },
      { base: "treecko", evo: "grovyle" },
      { base: "torchic", evo: "combusken" },
      { base: "mudkip", evo: "marshtomp" },
    ],
  },
  {
    key: "rare", short: "ultra", ballName: "ultra ball", ballCol: 2, weight: 11,
    color: "#f2b01e", glow: "rgba(242,176,30,0.6)", aura: true,
    pairs: [
      { base: "eevee", evo: "vaporeon" },
      { base: "riolu", evo: "lucario" },
    ],
  },
  {
    key: "legendary", short: "master", ballName: "master ball", ballCol: 4, weight: 3,
    color: "#7b3fc0", glow: "rgba(123,63,192,0.85)", aura: true,
    pairs: [
      { base: "dratini", evo: "dragonair" },
      { base: "gible", evo: "gabite" },
    ],
  },
];

const R_TOTAL = RARITIES.reduce((a, r) => a + r.weight, 0);
function rollRarity() {
  let r = Math.random() * R_TOTAL;
  for (let i = 0; i < RARITIES.length; i++) if ((r -= RARITIES[i].weight) < 0) return i;
  return 0;
}
// first load shows a spread (common, ultra, master) so the rarity tiers are
// obvious at a glance; re-rolls after that are weighted-random.
const FIRST_RARITY = [0, 2, 3];

const SPARKS = [
  { l: "4%", t: "8%", d: 0, c: "✨" },
  { l: "84%", t: "2%", d: 0.08, c: "⭐" },
  { l: "-6%", t: "54%", d: 0.16, c: "⭐" },
  { l: "92%", t: "50%", d: 0.12, c: "✨" },
  { l: "38%", t: "-14%", d: 0.04, c: "✨" },
  { l: "62%", t: "88%", d: 0.2, c: "⭐" },
];

const COUNT = 3; // pokéballs scattered around the work section

// closed → opening → out (hungry) → evolving → evolved
type Phase = "closed" | "opening" | "out" | "evolving" | "evolved";

/**
 * Anchors a little troupe of pokéballs to the "work" section's gutters, tracking
 * it every frame (it's a draggable piece) so the pokémon theme lives there.
 */
export function PokeZone() {
  const { enabled } = useCanvas();
  const wraps = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const place = () => {
      const work = document.querySelector('[data-piece="work"]');
      if (work) {
        const r = work.getBoundingClientRect();
        const vw = window.innerWidth;
        const slots = [
          { x: r.left - 92, y: r.top + r.height * 0.14 },
          { x: r.left - 92, y: r.top + r.height * 0.56 },
          { x: r.right + 22, y: r.top + r.height * 0.34 },
        ];
        for (let i = 0; i < COUNT; i++) {
          const el = wraps.current[i];
          if (!el) continue;
          const x = Math.max(6, Math.min(vw - 88, slots[i].x));
          el.style.transform = `translate(${x}px, ${slots[i].y}px)`;
        }
      }
      raf = requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {Array.from({ length: COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            wraps.current[i] = el;
          }}
          style={{ position: "fixed", left: 0, top: 0, width: 72, height: 72, zIndex: 88, pointerEvents: "none" }}
        >
          <PokeCreature id={`poke-${i}`} seed={i} side={i < 2 ? "left" : "right"} />
        </div>
      ))}
    </>
  );
}

function PokeCreature({ id, seed, side }: { id: string; seed: number; side: "left" | "right" }) {
  const { eggBus } = useCanvas();

  const [rarityIdx, setRarityIdx] = useState(0);
  const [pairIdx, setPairIdx] = useState(0);
  const needRef = useRef(4); // clicks to crack it open (3–5)
  const [phase, setPhase] = useState<Phase>("closed");
  const [clicks, setClicks] = useState(0);
  const [wobbleKey, setWobbleKey] = useState(0);
  const [risen, setRisen] = useState(false);

  // evolution sub-state
  const [showEvo, setShowEvo] = useState(false);
  const [silhouette, setSilhouette] = useState(false);
  const [flash, setFlash] = useState(false);
  const [sparkle, setSparkle] = useState(false);

  const monRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const timers = useRef<number[]>([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const pickFresh = (forced?: number) => {
    const r = forced != null ? forced : rollRarity();
    setRarityIdx(r);
    setPairIdx(Math.floor(Math.random() * RARITIES[r].pairs.length));
    needRef.current = 3 + Math.floor(Math.random() * 3);
  };

  useEffect(() => {
    alive.current = true; // reset on (re)mount — StrictMode runs cleanup then mounts again
    pickFresh(FIRST_RARITY[seed] ?? undefined);
    return () => {
      alive.current = false;
      timers.current.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rarity = RARITIES[rarityIdx];
  const pair = rarity.pairs[pairIdx];

  // run the classic evolution flicker, then settle on the evolved form
  const runEvolve = () => {
    if (phaseRef.current !== "out") return;
    setPhase("evolving");
    const steps = [260, 240, 220, 190, 170, 150, 130, 110, 95, 85, 80, 75];
    let i = 0;
    let show = false;
    const tick = () => {
      if (!alive.current) return;
      if (i >= steps.length) {
        setSilhouette(false);
        setShowEvo(true);
        setFlash(true);
        setSparkle(true);
        timers.current.push(window.setTimeout(() => alive.current && setFlash(false), 650));
        timers.current.push(
          window.setTimeout(() => {
            if (!alive.current) return;
            setSparkle(false);
            setPhase("evolved");
            eggBus.emit({ type: "toast", msg: `✨ ${pair.evo} — a ${rarity.key} catch!` });
          }, 1100)
        );
        return;
      }
      show = !show;
      setShowEvo(show);
      setSilhouette(true);
      i++;
      timers.current.push(window.setTimeout(tick, steps[i - 1]));
    };
    tick();
  };

  // feed events (from the bag) target a specific pokémon id
  const feedRef = useRef(runEvolve);
  feedRef.current = runEvolve;
  useEffect(
    () =>
      eggBus.subscribe((ev) => {
        if (ev.type === "feed" && ev.id === id && phaseRef.current === "out") feedRef.current();
      }),
    [eggBus, id]
  );

  const handleBallClick = () => {
    if (phase !== "closed") return;
    setWobbleKey((k) => k + 1);
    const next = clicks + 1;
    setClicks(next);
    if (next >= needRef.current) {
      setPhase("opening");
      setRisen(false);
      timers.current.push(window.setTimeout(() => alive.current && setPhase("out"), 520));
    }
  };

  const again = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setClicks(0);
    setRisen(false);
    setShowEvo(false);
    setSilhouette(false);
    setFlash(false);
    setSparkle(false);
    pickFresh();
    setPhase("closed");
  };

  const currentName =
    phase === "evolved" ? pair.evo : phase === "evolving" && showEvo ? pair.evo : pair.base;

  const bubble =
    phase === "out"
      ? "feed me a berry to evolve!"
      : phase === "evolved"
      ? `${pair.evo}! thanks ⭐`
      : null;

  const showMon = phase === "out" || phase === "evolving" || phase === "evolved";

  return (
    <>
      {/* speech bubble */}
      {bubble && (
        <div
          style={{
            position: "absolute",
            top: -58,
            [side === "left" ? "left" : "right"]: 30,
            maxWidth: 150,
            background: "#fff",
            border: "2px solid #07090a",
            boxShadow: "3px 3px 0 0 #4a8f3d",
            padding: "6px 8px",
            fontFamily: "var(--font-pixel), monospace",
            fontSize: 8,
            lineHeight: 1.5,
            color: "#07090a",
          }}
        >
          {bubble}
        </div>
      )}

      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          bottom: 4,
          width: 50,
          height: 9,
          transform: "translateX(-50%)",
          background: "rgba(7,9,10,0.22)",
          borderRadius: "50%",
          filter: "blur(1px)",
        }}
      />

      {showMon && (
        <div
          ref={monRef}
          data-poke-hungry={phase === "out" ? id : undefined}
          className={`poke-mon ${risen ? "poke-mon-bob" : "poke-mon-rise"}`}
          onAnimationEnd={() => setRisen(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SPRITE(currentName)}
            alt={currentName}
            draggable={false}
            style={{
              height: 74,
              width: "auto",
              maxWidth: "none", // override Tailwind preflight's max-width:100% so width isn't capped → no squish
              display: "block",
              imageRendering: "pixelated",
              filter: silhouette
                ? "brightness(0) invert(1) drop-shadow(0 0 7px #fff)"
                : "drop-shadow(2px 3px 0 rgba(7,9,10,0.25))",
              transition: "filter 0.05s linear",
            }}
          />
          {flash && <span className="poke-evolve-flash" />}
          {sparkle &&
            SPARKS.map((s, n) => (
              <span
                key={n}
                className="poke-spark"
                style={{ left: s.l, top: s.t, fontSize: 16, animationDelay: `${s.d}s` }}
              >
                {s.c}
              </span>
            ))}
        </div>
      )}

      <button
        onClick={handleBallClick}
        title={phase === "closed" ? "a wild pokéball! click to open it" : undefined}
        aria-label="pokéball — click to open"
        style={{
          position: "absolute",
          left: "50%",
          bottom: 6,
          transform: "translateX(-50%)",
          width: 72,
          height: 72,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: phase === "closed" ? "pointer" : "default",
          pointerEvents: "auto",
        }}
      >
        {rarity.aura && (phase === "closed" || phase === "opening") && (
          <span
            aria-hidden
            className="pb-aura"
            style={{ background: `radial-gradient(circle, ${rarity.glow} 0%, transparent 70%)` }}
          />
        )}
        <div
          key={wobbleKey}
          className={`pb-ball ${
            phase === "closed"
              ? wobbleKey > 0
                ? "wob"
                : ""
              : phase === "opening"
              ? "open-frame"
              : "open-frame vanish"
          }`}
          style={{ ["--pb-x"]: `${-rarity.ballCol * 41}px` } as React.CSSProperties}
        />
        {phase === "opening" && <span className="pb-flash" />}
      </button>

      {/* status / replay caption */}
      <div
        style={{
          position: "absolute",
          top: 74,
          left: 0,
          width: 72,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          fontFamily: "var(--font-pixel), monospace",
          fontSize: 7,
          color: "#07090a",
        }}
      >
        {/* rarity chip — the ball colour already signals it, this spells it out */}
        <span
          style={{
            background: rarity.color,
            color: "#fff",
            border: "2px solid #07090a",
            padding: "1px 4px",
            fontSize: 6,
            lineHeight: 1.5,
            letterSpacing: "0.04em",
          }}
        >
          {rarity.short}
        </span>
        {phase === "closed" && (
          <span>{clicks === 0 ? "tap!" : "·".repeat(clicks) + "˚".repeat(Math.max(0, needRef.current - clicks))}</span>
        )}
        {phase === "evolved" && (
          <button
            onClick={again}
            className="brut-press"
            style={{
              pointerEvents: "auto",
              fontFamily: "var(--font-pixel), monospace",
              fontSize: 7,
              padding: "3px 6px",
              background: "#f3e8cf",
              border: "2px solid #07090a",
              cursor: "pointer",
            }}
          >
            ↻ another
          </button>
        )}
      </div>
    </>
  );
}
