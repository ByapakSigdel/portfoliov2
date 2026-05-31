import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Articles from "@/components/Articles";
import Recommendations from "@/components/Recommendations";
import NowPlaying from "@/components/NowPlaying";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import EasterEggs from "@/components/EasterEggs";
import Marquee from "@/components/Marquee";
import { Draggable } from "@/canvas/Draggable";
import { CanvasLayer } from "@/canvas/CanvasLayer";
import { ToolPalette } from "@/canvas/ToolPalette";
import { AnimatedNinja } from "@/canvas/AnimatedNinja";
import { BoxGame } from "@/canvas/BoxGame";
import { SectionExplainer } from "@/canvas/SectionExplainer";
import { PIECES } from "@/canvas/types";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <EasterEggs />
      <Nav />
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 pt-24 pb-32">
        <Hero />
        <Draggable id={PIECES.MARQUEE}>
          <Marquee />
        </Draggable>
        <Draggable id={PIECES.NOW}>
          <Section id="now" eyebrow="01" title="now" bg="#5fa052"
            explain="A snapshot of what I'm building and listening to right now — the 'currently' page of the site.">
            <NowPlaying />
          </Section>
        </Draggable>
        <Draggable id={PIECES.WORK}>
          <Section id="work" eyebrow="02" title="work" bg="#e08043"
            explain="Projects I've shipped. Scribble on any individual card to read what it does.">
            <Projects />
          </Section>
        </Draggable>
        <Draggable id={PIECES.WRITING}>
          <Section id="writing" eyebrow="03" title="writing" bg="#e8a87c"
            explain="Notes and articles I've written — things I figured out and wanted to keep.">
            <Articles />
          </Section>
        </Draggable>
        <Draggable id={PIECES.TASTE}>
          <Section id="taste" eyebrow="04" title="taste" bg="#5fa052"
            explain="The music, media and ideas that shape how I think and build.">
            <Recommendations />
          </Section>
        </Draggable>
        <Draggable id={PIECES.FOOTER}>
          <Footer />
        </Draggable>
      </div>
      <AnimatedNinja />
      <BoxGame />
      <SectionExplainer />
      <CanvasLayer />
      <ToolPalette />
    </main>
  );
}

function Section({
  id,
  eyebrow,
  title,
  bg,
  explain,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  bg: string;
  explain?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mt-16 sm:mt-24"
      data-explain={explain}
      data-explain-name={`#${eyebrow} — ${title}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <span
          className="font-pixel text-[11px] px-3 py-1.5 border-2 border-line text-ink"
          style={{ background: bg, boxShadow: "4px 4px 0 0 #07090a" }}
        >
          #{eyebrow}
        </span>
        <h2 className="font-pixel text-lg sm:text-2xl lowercase text-ink">{title}</h2>
        <span className="flex-1 h-[3px] bg-line" />
      </div>
      {children}
    </section>
  );
}
