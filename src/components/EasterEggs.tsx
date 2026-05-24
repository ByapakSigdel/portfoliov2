"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

type Line = { kind: "in" | "out" | "sys"; text: string };

const HELP = [
  "available commands:",
  "  help        — show this list",
  "  whoami      — about mahan",
  "  projects    — list projects",
  "  socials     — links",
  "  resume      — open resume.pdf",
  "  clear       — clear the terminal",
  "  exit        — close terminal (or press ~)",
];

export default function EasterEggs() {
  const [konami, setKonami] = useState<string[]>([]);
  const [partyOn, setPartyOn] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { kind: "sys", text: "mahan.sh v1.0 — type `help` to begin." },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" || e.key === "~") {
        e.preventDefault();
        setTermOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && termOpen) {
        setTermOpen(false);
        return;
      }
      if (termOpen) return;
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      setKonami((prev) => {
        const next = [...prev, e.key].slice(-KONAMI.length);
        if (
          next.length === KONAMI.length &&
          next.every((k, i) => k.toLowerCase() === KONAMI[i].toLowerCase())
        ) {
          setPartyOn(true);
          setTimeout(() => setPartyOn(false), 6000);
          return [];
        }
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [termOpen]);

  useEffect(() => {
    if (termOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [termOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    const out: Line[] = [{ kind: "in", text: `$ ${raw}` }];
    switch (cmd) {
      case "":
        break;
      case "help":
        HELP.forEach((t) => out.push({ kind: "out", text: t }));
        break;
      case "whoami":
        out.push({
          kind: "out",
          text: "mahan sigdel — engineer based in kathmandu. tinkers with software & hardware.",
        });
        break;
      case "projects":
        [
          "derivative — block coding for arduino",
          "virtual mouse — opencv hand tracking",
          "nexos — custom linux distro",
          "petfeeder — iot pet feeder",
        ].forEach((t) => out.push({ kind: "out", text: "  • " + t }));
        break;
      case "socials":
        out.push({ kind: "out", text: "mail:     sigdelmb123@gmail.com" });
        out.push({ kind: "out", text: "linkedin: linkedin.com/in/mahansigdel" });
        out.push({ kind: "out", text: "github:   github.com/ByapakSigdel" });
        break;
      case "resume":
        out.push({ kind: "out", text: "opening resume.pdf..." });
        window.open("/resume.pdf", "_blank");
        break;
      case "clear":
        setLines([]);
        return;
      case "exit":
      case "quit":
        setTermOpen(false);
        return;
      case "sudo rm -rf /":
        out.push({ kind: "out", text: "nice try." });
        break;
      default:
        out.push({ kind: "out", text: `command not found: ${cmd}. type 'help'.` });
    }
    setLines((l) => [...l, ...out]);
  };

  return (
    <>
      <AnimatePresence>
        {partyOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: -4 }}
              className="font-pixel text-2xl sm:text-4xl px-6 py-4 bg-orange-spike border-[4px] border-line"
              style={{ boxShadow: "10px 10px 0 0 #0a0d0a" }}
            >
              ★ +30 LIVES ★
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {termOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 240 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-ink border-t-[4px] border-dino-green"
          >
            <div className="mx-auto max-w-5xl px-5 sm:px-8 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-pixel text-[10px] text-dino-green">~/mahan.sh</span>
                <button
                  onClick={() => setTermOpen(false)}
                  className="font-pixel text-[9px] px-2 py-1 border-2 border-bg text-bg hover:bg-orange-spike hover:text-ink hover:border-line"
                >
                  [esc] close
                </button>
              </div>
              <div className="h-48 sm:h-56 overflow-y-auto font-mono text-xs text-bg/90 leading-relaxed">
                {lines.map((l, i) => (
                  <div
                    key={i}
                    className={
                      l.kind === "in"
                        ? "text-dino-green"
                        : l.kind === "sys"
                        ? "text-orange-spike"
                        : "text-bg/85"
                    }
                  >
                    {l.text}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(input);
                  setInput("");
                }}
                className="flex items-center gap-2 pt-2 border-t-2 border-bg/30"
              >
                <span className="font-mono text-xs text-dino-green">$</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent outline-none font-mono text-xs text-bg placeholder:text-bg/40"
                  placeholder="type a command..."
                  spellCheck={false}
                  autoComplete="off"
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
