import type { Metadata, Viewport } from "next";
import { Press_Start_2P, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { CanvasProvider } from "@/canvas/CanvasContext";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// override with NEXT_PUBLIC_SITE_URL if the portfolio lives somewhere else
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mahansigdel.com.np";
const NAME = "Mahan Sigdel";
const TITLE = "Mahan Sigdel — Engineer & Maker";
const DESCRIPTION =
  "Mahan Sigdel is an engineer who loves tinkering with software and hardware — block-coding platforms, embedded systems, web apps, and playful experiments.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Mahan Sigdel",
  },
  description: DESCRIPTION,
  applicationName: NAME,
  keywords: [
    "Mahan Sigdel",
    "software engineer",
    "hardware engineer",
    "embedded systems",
    "full-stack developer",
    "Next.js developer",
    "Arduino",
    "portfolio",
    "Nepal",
  ],
  authors: [{ name: NAME, url: SITE_URL }],
  creator: NAME,
  publisher: NAME,
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: NAME,
    title: TITLE,
    description: "An engineer who loves tinkering with software and hardware.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mahan Sigdel — engineer & maker", type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "An engineer who loves tinkering with software and hardware.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#f3e8cf",
  colorScheme: "light",
};

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: NAME,
  url: SITE_URL,
  image: `${SITE_URL}/avatar.png`,
  jobTitle: "Software & Hardware Engineer",
  description: "An engineer who loves tinkering with software and hardware.",
  sameAs: [
    "https://github.com/ByapakSigdel",
    "https://www.linkedin.com/in/mahansigdel",
    "https://blog.mahansigdel.com.np",
  ],
  knowsAbout: ["Software Engineering", "Embedded Systems", "Web Development", "Next.js", "C++", "Arduino", "Hardware"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixel.variable} ${mono.variable} ${sans.variable}`}>
      <body>
        <CanvasProvider>{children}</CanvasProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
      </body>
    </html>
  );
}
