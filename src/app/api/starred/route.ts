import { NextResponse } from "next/server";

// A random repo from my GitHub stars — the genuine "rabbit hole". Re-rolls each
// request; the starred list is cached for an hour to stay under the
// unauthenticated GitHub rate limit.

export const dynamic = "force-dynamic";

const STARRED = "https://api.github.com/users/ByapakSigdel/starred?per_page=100";

type Repo = {
  name: string;
  html_url: string;
  description?: string | null;
  language?: string | null;
  owner?: { login: string };
};

export async function GET() {
  try {
    const res = await fetch(STARRED, {
      headers: { "User-Agent": "mahan-portfolio", Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ ok: false });
    const repos = (await res.json()) as Repo[];
    const list = (repos ?? []).filter((r) => r?.html_url);
    if (!list.length) return NextResponse.json({ ok: false });

    const r = list[Math.floor(Math.random() * list.length)];
    return NextResponse.json({
      ok: true,
      name: r.name,
      owner: r.owner?.login ?? "",
      description: r.description ?? "",
      language: r.language ?? "",
      url: r.html_url,
    });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
