import { Link2, ClipboardPaste, SlidersHorizontal, Download, Sparkles, Music, Smartphone, ShieldCheck, ChevronDown } from "lucide-react";
import { socialContent } from "@/lib/social-content";
import type { SocialPlatform } from "@/lib/social";
import type { Language } from "@/lib/i18n";

const stepIcons = [Link2, ClipboardPaste, SlidersHorizontal, Download];
const featureIcons = [Sparkles, Music, Smartphone, ShieldCheck];

export function SocialContent({ language, platform }: { language: Language; platform: SocialPlatform }) {
  const c = socialContent(language, platform);
  return <div className="mx-auto max-w-5xl space-y-12 pb-12 sm:space-y-16 sm:pb-16">
    <section>
      <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">{c.howTitle}</h2>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{c.steps.map(([title, body], i) => { const Icon = stepIcons[i] ?? Download; return <li key={title} className="rounded-xl bg-card p-4 shadow-card"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><h3 className="text-sm font-semibold text-foreground">{i + 1}. {title}</h3></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></li>; })}</ol>
    </section>
    <section>
      <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">{c.whyTitle}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">{c.features.map(([title, body], i) => { const Icon = featureIcons[i] ?? Sparkles; return <div key={title} className="flex gap-3 rounded-xl bg-card p-4 shadow-card"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success"><Icon className="h-5 w-5" /></span><div><h3 className="text-sm font-semibold text-foreground">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div></div>; })}</div>
    </section>
    <section className="rounded-xl bg-muted p-5 text-center">
      <h2 className="text-lg font-semibold text-foreground">{c.linksTitle}</h2>
      <p className="mt-2 break-words font-mono text-xs text-muted-foreground sm:text-sm">{c.links}</p>
    </section>
    <section className="mx-auto max-w-3xl">
      <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">{c.faqTitle}</h2>
      <div className="mt-6 space-y-2">{c.faq.map(([q, a]) => <details key={q} className="group rounded-xl bg-card p-4 shadow-card"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground">{q}<ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" /></summary><p className="mt-2 text-sm leading-6 text-muted-foreground">{a}</p></details>)}</div>
    </section>
  </div>;
}
