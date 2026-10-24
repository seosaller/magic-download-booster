import { ArrowUp, Video, Clapperboard, Gem, Rocket, FileVideo, Smartphone, CircleDollarSign, MousePointerClick, MonitorSmartphone, Globe, Zap, ShieldCheck, Link as LinkIcon, Clipboard, Download, CircleHelp, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { emoji: "📹", title: "Open Facebook", text: "Open Facebook and find the video or Reel you want to download." },
  { emoji: "🔗", title: "Copy the link", text: "Tap Share and copy the video link." },
  { emoji: "📋", title: "Paste it here", text: "Paste the link into our Facebook Video Downloader." },
  { emoji: "📥", title: "Choose & download", text: "Choose the available video quality and download your video." },
];
const tools = [
  { icon: Video, title: "Facebook Video Downloader", text: "Save public videos using a Facebook link.", tone: "bg-primary/10 text-primary" },
  { icon: Clapperboard, title: "Reels Downloader", text: "Save supported Facebook Reels to your device.", tone: "bg-chart-2/10 text-chart-2" },
  { icon: Gem, title: "HD & Full HD", text: "Choose clearer video quality when available.", tone: "bg-primary/10 text-primary" },
  { icon: Rocket, title: "2K & 4K Downloader", text: "Get high-resolution videos when supported.", tone: "bg-chart-2/10 text-chart-2" },
  { icon: FileVideo, title: "Facebook Video to MP4", text: "Save MP4 files for easy playback anywhere.", tone: "bg-primary/10 text-primary" },
  { icon: Smartphone, title: "Online Video Downloader", text: "Download in your browser. No app required.", tone: "bg-chart-2/10 text-chart-2" },
];
const benefits = [
  { emoji: "🔓", title: "No Sign-Up Needed", text: "Paste a link and get your file. No account, no email, no app install." },
  { emoji: "🎞️", title: "HD & SD Options", text: "Download in the same High Definition or Standard Definition stream Facebook serves the video in." },
  { emoji: "📱", title: "Works On Any Device", text: "Runs in the browser on Android, iPhone, Windows, and Mac — nothing to install." },
  { emoji: "♾️", title: "100% Free, No Limits", text: "Save as many public videos and reels as you want, at no cost." },
];
const faqs = [
  { q: "How can I download Facebook Reels?", a: "Open the Reel on Facebook, copy its link, and paste it into our Facebook Reels Downloader. Select an available quality and download the video." },
  { q: "Can I download Facebook videos in 2K or 4K?", a: "Yes, when the original video and the available download source support 2K or 4K quality. Not every Facebook video is available in these resolutions." },
  { q: "Is this Facebook Video Downloader free?", a: "Yes, the tool is designed for free use. You can paste a supported Facebook video link and check the available download options without installing an app." },
  { q: "Can I download Facebook videos on my mobile phone?", a: "Yes. You can use the downloader in a mobile browser on Android or iPhone. The available download options may vary depending on your device and the video source." },
];

export function HomeContent({ onStart }: { onStart: () => void }) {
  return <div className="mx-auto max-w-5xl">
    <section className="py-12 sm:py-16" aria-labelledby="home-intro">
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="home-intro" className="text-2xl font-bold sm:text-3xl">Facebook Video Downloader</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">Download Facebook videos and Reels in HD, 2K, and 4K quality with ease. Just copy the video link from Facebook, paste it into the downloader, and get your video in a few clicks. No app installation or account login is needed.</p>
      </div>
      <h3 className="mt-10 text-center text-lg font-semibold">How to Download Facebook Videos</h3>
      <ol className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => <li key={step.title} className="relative border-t-2 border-primary/20 pt-6">
          <div className="flex items-center justify-between"><span aria-hidden="true" className="grid size-10 place-items-center text-3xl">{step.emoji}</span><span className="text-sm font-semibold text-muted-foreground">0{i + 1}</span></div>
          <h4 className="mt-4 text-base font-semibold">{step.title}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
        </li>)}
      </ol>
    </section>

    <section className="grid items-center gap-6 border-y border-border py-10 sm:grid-cols-[minmax(0,1fr)_auto]" aria-labelledby="quality-title">
      <div><h2 id="quality-title" className="text-xl font-bold sm:text-2xl">Download Facebook Videos in HD, 2K, and 4K</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Save your favorite Facebook videos in the best quality available. Our tool helps you download videos in HD, Full HD, 2K, or 4K when the original video and source link support these options.</p></div>
      <div className="flex gap-3" aria-label="Available source resolutions">{["HD", "2K", "4K"].map(q => <div key={q} className="grid size-16 place-items-center rounded-lg border border-primary/20 bg-primary/5 text-xl font-bold text-primary">{q}</div>)}</div>
    </section>

    <section className="py-12 sm:py-16" aria-labelledby="tools-title">
      <h2 id="tools-title" className="text-2xl font-bold">Our Download Tools</h2>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {tools.map((tool, i) => <article key={tool.title} className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center text-3xl">{["📹", "🎬", "💎", "🚀", "🎵", "📱"][i]}</span>
            <Download aria-hidden="true" className="size-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
          </div>
          <h3 className="mt-4 text-base font-semibold leading-6">{tool.title}</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{tool.text}</p>
        </article>)}
      </div>
    </section>

    <section className="relative py-12 text-center before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:bg-muted/50 isolate" aria-labelledby="benefits-title">
      <h2 id="benefits-title" className="text-2xl font-bold">Why people use FB Download Hub</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">A straightforward tool built around three things: speed, video quality, and not asking for anything you don't need to give.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(item => <article key={item.title} className="rounded-lg border border-border bg-card px-5 py-7"><span aria-hidden="true" className="mx-auto grid size-10 place-items-center text-3xl">{item.emoji}</span><h3 className="mt-4 text-base font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></article>)}</div>
      <p className="mt-6 text-xs leading-5 text-muted-foreground">MP3 and high-quality conversions depend on CloudConvert availability and conversion credits.</p>
    </section>

    <section className="mx-auto max-w-3xl py-12 sm:py-16" aria-labelledby="faq">
      <div className="flex items-center gap-3"><span aria-hidden="true" className="grid size-9 shrink-0 place-items-center text-3xl">💬</span><h2 id="faq" className="text-2xl font-bold">Frequently Asked Questions</h2></div>
      <div className="mt-6 divide-y divide-border border-y border-border">{faqs.map(f => <details key={f.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">{f.q}<ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary><p className="mt-3 pr-6 text-sm leading-7 text-muted-foreground">{f.a}</p></details>)}</div>
    </section>

    <section className="border-t border-border pb-12 pt-10 text-center" aria-labelledby="start-title">
      <h2 id="start-title" className="text-2xl font-bold">Start Downloading Facebook Videos</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Ready to save a video or Reel? Copy its Facebook link, paste it into the box above, and check the available download options. Enjoy an easy way to save videos for offline viewing.</p>
      <Button onClick={onStart} className="mt-6 gap-2 transition active:scale-[0.96]"><ArrowUp />Back to downloader</Button>
      <p className="mx-auto mt-7 flex max-w-2xl items-start justify-center gap-2 text-xs leading-6 text-muted-foreground"><ShieldCheck aria-hidden="true" className="mt-1 size-4 shrink-0 text-chart-2" /><span><strong className="font-semibold">Note:</strong> Only download videos you own or have permission to save. Respect the creator's rights and Facebook's terms.</span></p>
    </section>
  </div>;
}