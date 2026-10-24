import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function infoHead(title: string, description: string) {
  return { meta: [
    { title: `${title} — FB Download Hub` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — FB Download Hub` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] };
}

export function InfoPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
    <Button asChild variant="ghost" className="mb-6 gap-2 text-primary transition active:scale-[0.96]">
      <Link to="/"><ArrowLeft />Back to downloader</Link>
    </Button>
    <h1 className="text-3xl font-bold text-foreground">{title}</h1>
    <p className="mt-4 text-base leading-7 text-muted-foreground">{intro}</p>
    <div className="mt-9 space-y-8 text-sm leading-7 text-muted-foreground [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_ul]:list-disc">{children}</div>
  </main>;
}