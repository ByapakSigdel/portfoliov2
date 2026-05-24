"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const quotes = [
  "no matter how deep the night, it always turns to day.",
  "reject common sense to make the impossible possible.",
  "i'll leave tomorrow's problems to tomorrow's me.",
  "if you don't take risks, you can't create a future.",
  "the world isn't perfect. but it's there for us.",
  "human strength lies in the ability to change yourself.",
  "power comes in response to a need, not a desire.",
];

export default function Hero() {
  const [quote, setQuote] = useState("");
  const [typed, setTyped] = useState("");
  const [frame, setFrame] = useState(1);
  const phrase = "an engineer who loves tinkering with software and hardware.";

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(phrase.slice(0, i));
      if (i >= phrase.length) clearInterval(id);
    }, 28);

    // Using a faster interval for a more snappy retro/pixel art feel
    const frameId = setInterval(() => {
      setFrame((prev) => (prev === 1 ? 2 : 1));
    }, 400);

    return () => {
      clearInterval(id);
      clearInterval(frameId);
    };
  }, []);

  return (
    <section id="top" className="pt-4 sm:pt-8">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-stretch">
        {/* Mascot card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="brut overflow-hidden flex items-end justify-center w-full md:w-56 relative"
          style={{ background: "#4a8f3d" }}
        >
          <div className="relative w-full flex items-end justify-center cursor-crosshair group mt-auto h-[240px] md:h-full">
            <Image
              src={`/frame${frame}.png`}
              alt="mahan"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 224px"
              className="object-contain object-bottom origin-bottom group-hover:scale-[1.03] transition-transform duration-300 translate-y-1"
            />
          </div>
        </motion.div>

        {/* Text card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="brut p-6 sm:p-8 flex flex-col justify-center"
          style={{ background: "#ffffff" }}
        >
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="tag-pixel" style={{ background: "#e8743a" }}>player_01</span>
            <span className="tag-pixel" style={{ background: "#4a8f3d", color: "#ffffff" }}>● available</span>
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl leading-[1.4] text-ink">
            mahan
            <br />
            <span
              className="inline-block px-2 -ml-1"
              style={{ background: "#4a8f3d", color: "#ffffff" }}
            >
              sigdel
            </span>
            <span style={{ color: "#e8743a" }}>.</span>
          </h1>

          <p className="mt-5 font-mono text-[16px] sm:text-[17px] text-ink font-medium min-h-[1.5em] leading-relaxed">
            {typed}
            <span className="cursor-blink text-orange-deep">▋</span>
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href="mailto:sigdelmb123@gmail.com"
              className="tag-pixel brut-hover-sm"
              style={{ background: "#ffffff" }}
            >
              ✉ mail
            </a>
            <a
              href="https://www.linkedin.com/in/mahansigdel"
              target="_blank"
              rel="noreferrer"
              className="tag-pixel brut-hover-sm"
              style={{ background: "#f0b388" }}
            >
              in/ linkedin
            </a>
            <a
              href="https://github.com/ByapakSigdel"
              target="_blank"
              rel="noreferrer"
              className="tag-pixel brut-hover-sm"
              style={{ background: "#ffffff" }}
            >
              @ github
            </a>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noreferrer"
              className="tag-pixel brut-hover-sm"
              style={{ background: "#0a0d0a", color: "#f5ecd7" }}
            >
              ↓ resume.pdf
            </a>
          </div>

          {quote && (
            <p
              className="mt-6 pl-3 py-1 border-l-[4px] text-[14px] sm:text-[15px] italic font-medium leading-relaxed"
              style={{ borderColor: "#e8743a", color: "#07090a" }}
            >
              &ldquo;{quote}&rdquo;
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
