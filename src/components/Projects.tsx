"use client";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import { TbWorld } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";

type Status = "active" | "completed" | "archived";

const projects: {
  title: string;
  short: string;
  long: string;
  status: Status;
  github?: string;
  web?: string;
  tags: string[];
}[] = [
  {
    title: "monoline",
    short: "aesthetic drawing in your terminal — braille strokes, shape snap, palettes, symmetry.",
    long: "A terminal canvas for freehand drawing with live stroke smoothing, Ctrl-drag shape correction (line / circle / ellipse / rect), curated palettes, symmetry modes, dot grid, and reveal animations. Install with pip and draw with a mouse in any TTY.",
    status: "active",
    github: "https://github.com/ByapakSigdel/monoline",
    tags: ["python", "terminal", "cli"],
  },
  {
    title: "LinkUp",
    short: "couples-focused social app — a private sky for two, not another group chat.",
    long: "A Turbo monorepo for a couples social platform: Next.js web, mobile client, and Node API with Postgres/Redis. Shared moments become a living star map — chat, memories, and rituals built only for two. Live at linkup.mahansigdel.com.np.",
    status: "active",
    github: "https://github.com/ByapakSigdel/linkup",
    web: "https://linkup.mahansigdel.com.np",
    tags: ["next.js", "typescript", "postgres"],
  },
  {
    title: "Derivative",
    short: "block coding platform for arduino & embedded systems.",
    long: "A visual block-based programming platform that lets users build Arduino and embedded systems projects without writing code. Drag-and-drop blocks generate real C/C++ that compiles and uploads to hardware.",
    status: "active",
    web: "https://www.codeatderivative.com",
    tags: ["next.js", "c++", "embedded"],
  },
  {
    title: "derivative-cli",
    short: "remote arduino compiler — go rest api, 16 boards, zero local toolchain.",
    long: "A dockerized Go REST API that compiles Arduino C++ sketches remotely and returns ready-to-flash firmware for 16 microcontroller boards — no local toolchain required. The compile service that powers Derivative.",
    status: "active",
    github: "https://github.com/ByapakSigdel/derivative-cli",
    tags: ["go", "docker", "arduino"],
  },
  {
    title: "scratch",
    short: "dj-turntable scratch / scrub engine in raw c.",
    long: "Portable vinyl-style scrub engine in pure C — variable-rate bidirectional resampling so a jog wheel (or on-screen platter) pitches, reverses, freezes, and glides back to play. Hardware-agnostic core plus a Python testbench for demos.",
    status: "completed",
    github: "https://github.com/ByapakSigdel/scratch",
    tags: ["c", "audio", "embedded"],
  },
  {
    title: "nepali-tts",
    short: "offline multi-speaker nepali text-to-speech (vits / onnx).",
    long: "Full pipeline for training a multi-speaker Nepali (Devanagari) TTS model with piper/VITS on OpenSLR data, exportable to ONNX for fully offline inference — scripts, configs, and reproduction notes included.",
    status: "active",
    github: "https://github.com/ByapakSigdel/nepali-tts",
    tags: ["python", "ml", "tts"],
  },
  {
    title: "TithiMiti",
    short: "modern nepali calendar app — bikram sambat ⇄ gregorian, festivals, panchanga.",
    long: "A React Native (Expo) Nepali calendar that converts between Bikram Sambat and Gregorian dates and surfaces lunar info, festivals, and panchanga details — bridging cultural tradition with a modern mobile UI.",
    status: "active",
    github: "https://github.com/ByapakSigdel/TithiMiti",
    tags: ["react native", "expo", "typescript"],
  },
  {
    title: "waybar-nepali-calendar",
    short: "waybar widget with a bikram sambat calendar popup, tuned for hyprland.",
    long: "A Python Waybar module with an interactive calendar popup supporting both Gregorian and Bikram Sambat — event management, automatic theme matching, and Nepali holidays baked in.",
    status: "active",
    github: "https://github.com/ByapakSigdel/waybar-nepali-calendar",
    tags: ["python", "linux", "hyprland"],
  },
  {
    title: "nats-server",
    short: "oss contribution — healthz ignores expired jwt accounts.",
    long: "Upstream contribution to NATS.io's high-performance messaging server: skip expired JWT accounts during JetStream healthz scans so monitor endpoints stay green in clustered deployments with stale account credentials.",
    status: "completed",
    github: "https://github.com/nats-io/nats-server/pull/8379",
    tags: ["go", "nats", "oss"],
  },
  {
    title: "E-commerce Builder",
    short: "platform to build and deploy custom e-commerce sites.",
    long: "Built during an internship — lets users create fully functional e-commerce websites without coding, with product management, payment integration, and customizable templates. Hosted at shopatbanau.com.",
    status: "completed",
    web: "https://shopatbanau.com",
    tags: ["next.js", "stripe", "saas"],
  },
];

const statusStyle: Record<Status, { bg: string; label: string }> = {
  active: { bg: "#5fa052", label: "active" },
  completed: { bg: "#e8a87c", label: "completed" },
  archived: { bg: "#fffaf0", label: "archived" },
};

const cardBg = ["#fffaf0", "#f4ead5"];

export default function Projects() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-4">
      {projects.map((p, i) => {
        const isOpen = open === i;
        const s = statusStyle[p.status];
        return (
          <div
            key={p.title}
            className="brut flex flex-col"
            style={{ background: cardBg[i % 2] }}
            data-explain={p.long}
            data-explain-name={p.title}
          >
            <div className="border-b-2 border-line bg-panel px-3 py-1.5 flex items-center justify-between shrink-0">
               <div className="flex gap-1.5">
                 <span className="w-2.5 h-2.5 bg-line inline-block" />
                 <span className="w-2.5 h-2.5 bg-line inline-block" />
                 <span className="w-2.5 h-2.5 bg-line inline-block" />
               </div>
               <span className="font-pixel text-[10px] text-ink lowercase">{p.title.replace(/\s+/g, '_').toLowerCase()}.md</span>
            </div>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left group"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <span
                  className="font-pixel text-[11px] w-10 h-10 flex items-center justify-center border-2 border-line shrink-0"
                  style={{ background: "#e08043" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-pixel text-sm sm:text-base text-ink">{p.title}</h3>
                    <span
                      className="font-pixel text-[8px] uppercase px-1.5 py-1 border-2 border-line"
                      style={{ background: s.bg }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="text-sm sm:text-[15px] text-ink/85 font-medium leading-snug">{p.short}</p>
                </div>
              </div>
              <span
                className={`font-pixel text-sm w-8 h-8 flex items-center justify-center border-2 border-line bg-bg transition-transform shrink-0 ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-5 pb-5 pl-4 sm:pl-20 border-t-[3px] border-line pt-4">
                    <p className="text-[15px] sm:text-base text-ink font-medium leading-relaxed">{p.long}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span key={t} className="tag-pixel">
                          {t}
                        </span>
                      ))}
                    </div>
                    {(p.github || p.web) && (
                      <div className="mt-4 flex gap-2 flex-wrap">
                        {p.github && (
                          <a
                            href={p.github}
                            target="_blank"
                            rel="noreferrer"
                            className="tag-pixel bg-panel hover:bg-orange-spike brut-hover-sm"
                          >
                            <FaGithub className="mr-1.5" /> source
                          </a>
                        )}
                        {p.web && (
                          <a
                            href={p.web}
                            target="_blank"
                            rel="noreferrer"
                            className="tag-pixel bg-dino-green hover:bg-orange-spike brut-hover-sm"
                          >
                            <TbWorld className="mr-1.5" /> live
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
