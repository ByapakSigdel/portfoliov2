import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Articles from "@/components/Articles";
import Recommendations from "@/components/Recommendations";
import NowPlaying from "@/components/NowPlaying";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import EasterEggs from "@/components/EasterEggs";
import Marquee from "@/components/Marquee";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <EasterEggs />
      <Nav />
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 pt-24 pb-32">
        <Hero />
        <Marquee />
        <Section id="now" eyebrow="01" title="now" bg="#5fa052">
          <NowPlaying />
        </Section>
        <Section id="work" eyebrow="02" title="work" bg="#e08043">
          <Projects />
        </Section>
        <Section id="writing" eyebrow="03" title="writing" bg="#e8a87c">
          <Articles />
        </Section>
        <Section id="taste" eyebrow="04" title="taste" bg="#5fa052">
          <Recommendations />
        </Section>
        <Footer />
      </div>
    </main>
  );
}

function Section({
  id,
  eyebrow,
  title,
  bg,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-16 sm:mt-24">
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
