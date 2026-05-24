"use client";

export default function Footer() {
  return (
    <footer className="mt-20 brut bg-ink text-bg p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        <div>
          <div className="font-pixel text-[11px] text-dino-green mb-3">// end_of_file</div>
          <p className="font-mono text-xs leading-relaxed max-w-sm">
            built with next.js + tailwind. typeset in press start 2p &amp; jetbrains mono.
            <br />
            press{" "}
            <kbd className="px-1.5 py-0.5 border-2 border-bg text-bg text-[10px] bg-ink mx-0.5">
              ~
            </kbd>{" "}
            for a terminal · try the konami code.
          </p>
        </div>
        <div className="font-pixel text-[10px] text-bg/70">
          © {new Date().getFullYear()} mahan sigdel
        </div>
      </div>
    </footer>
  );
}
