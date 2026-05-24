"use client";
import { FaArrowRight } from "react-icons/fa6";

const articles = [
  {
    title: "Troubleshooting TTY1 issue & Creating a Bootable Drive",
    description: "deep dive into terminal interface debugging.",
    link: "https://blog.mahansigdel.com.np/troubleshooting-tty1-issue-and-creating-a-bootable-drive",
    date: "2024",
    bg: "#5fa052",
  },
  {
    title: "Remote Access for Linux from your Android/iOS",
    description: "step-by-step guide to reliable remote access setup.",
    link: "https://blog.mahansigdel.com.np/remote-access-for-linux",
    date: "2024",
    bg: "#e08043",
  },
  {
    title: "Just me, Python and a Discord bot that wouldn't listen",
    description: "a personal story and debugging journey.",
    link: "https://blog.mahansigdel.com.np/just-me-python-and-a-discord-bot-that-wouldnt-listen",
    date: "2024",
    bg: "#e8a87c",
  },
];

export default function Articles() {
  return (
    <div className="flex flex-col gap-4">
      {articles.map((a, i) => (
        <a
          key={i}
          href={a.link}
          target="_blank"
          rel="noreferrer"
          className="brut brut-hover group grid grid-cols-[auto_1fr_auto] gap-4 items-center p-4 sm:p-5"
          style={{ background: a.bg }}
        >
          <span className="font-pixel text-[10px] px-2 py-1.5 border-2 border-line bg-bg shrink-0">
            {a.date}
          </span>
          <div className="min-w-0">
            <h3 className="font-pixel text-sm sm:text-base text-ink leading-relaxed">
              {a.title}
            </h3>
            <p className="text-sm sm:text-[15px] text-ink/90 font-medium mt-2">{a.description}</p>
          </div>
          <span className="w-9 h-9 flex items-center justify-center border-2 border-line bg-bg group-hover:bg-ink group-hover:text-bg transition-colors">
            <FaArrowRight size={12} />
          </span>
        </a>
      ))}
    </div>
  );
}
