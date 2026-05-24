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
    title: "Derivative",
    short: "block coding platform for arduino & embedded systems.",
    long: "A visual block-based programming platform that lets users build Arduino and embedded systems projects without writing code. Drag-and-drop blocks generate real C/C++ that compiles and uploads to hardware.",
    status: "active",
    web: "https://www.codeatderivative.com",
    tags: ["next.js", "c++", "embedded"],
  },
  {
    title: "Virtual Mouse",
    short: "control your mouse with hand gestures via opencv + mediapipe.",
    long: "Python-based application using OpenCV and MediaPipe to track hand movements and translate them into mouse controls for hands-free computer interaction.",
    status: "archived",
    github: "https://github.com/ByapakSigdel/Virtual-Mouse",
    tags: ["python", "opencv", "mediapipe"],
  },
  {
    title: "E-commerce Builder",
    short: "platform to build and deploy custom e-commerce sites.",
    long: "Built during an internship — lets users create fully functional e-commerce websites without coding, with product management, payment integration, and customizable templates. Hosted at shopatbanau.com.",
    status: "completed",
    web: "https://shopatbanau.com",
    tags: ["next.js", "stripe", "saas"],
  },
  {
    title: "NexOS",
    short: "lightweight linux-based custom os for optimized performance.",
    long: "A custom-built Linux-based OS focused on optimized communication and efficient memory management, developed during our minor project.",
    status: "archived",
    tags: ["linux", "os", "c"],
  },
  {
    title: "WEB3 Blog Dapp",
    short: "decentralized blogging on the solana blockchain.",
    long: "A DApp enabling users to publish and read blogs stored on Solana, using React.js for the frontend with wallet authentication and smart contracts.",
    status: "archived",
    github: "https://github.com/ByapakSigdel/Web3-Dapp",
    tags: ["solana", "react", "web3"],
  },
  {
    title: "Automatic PetFeeder",
    short: "iot device to automate pet feeding schedules.",
    long: "Arduino-based IoT project — schedule feeding times, monitor via sensors, and control dispensing remotely through a connected app.",
    status: "completed",
    github: "https://github.com/ByapakSigdel/Pet-feeder",
    tags: ["arduino", "iot", "embedded"],
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
