import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: "🎬", title: "Find your Reel", text: "Open the public Reel you want to save on Facebook." },
  { icon: "🔗", title: "Copy its link", text: "Tap Share, then copy the Reel link." },
  { icon: "📋", title: "Paste it above", text: "Paste the link and press Download to find the available files." },
  { icon: "📥", title: "Save your file", text: "Choose video quality or convert the original sound to MP3." },
];

const faqs = [
  { question: "How do I download Facebook Reels with a link?", answer: "Open a public Reel on Facebook, select Share and copy its link. Paste it into the box above and press Download. Once processing finishes, choose an available video download or convert the sound to MP3." },
  { question: "Can I download Facebook Reels in HD, 1080p, 2K or 4K?", answer: "HD and SD downloads appear when those streams are available. Native 1080p Full HD, 2K or 4K video can be combined with its original audio using free browser processing when available. Not every Reel offers these resolutions, and this tool does not upscale a lower-resolution original." },
  { question: "Can I convert Facebook Reels to MP3 at 320 kbps?", answer: "Yes. After processing a supported Reel, choose Download MP3 · 320 kbps. Keep the page open during conversion, then save the finished MP3. Speech and music remain together. A 320 kbps file does not restore detail missing from the original sound, and a silent Reel cannot produce meaningful audio." },
  { question: "Does the Reels downloader work on Android and iPhone?", answer: "You can use the page in a browser on Android, iPhone, tablets and computers. On phones and tablets, paste your link in the top row and press Download below it. File saving and playback depend on your browser and device." },
  { question: "Can I download private or friends-only Facebook Reels?", answer: "No. This tool supports accessible public content, not private, friends-only or login-restricted Reels. It does not bypass Facebook privacy settings. Only save content you own or have permission to download." },
  { question: "Why is my Reel link not working?", answer: "The Reel may have been deleted, made private or restricted, or its media link may have expired. Open the original Reel on Facebook, copy its link again and retry. If MP3 or high-quality conversion fails, an available direct HD or SD download can still work." },
  { question: "Is Facebook Reels downloading free?", answer: "You can check supported public links and use available direct video downloads without signing up. High-quality video can be combined free in your browser, preserving its original sound and resolution. Device memory and file size limit local processing. CloudConvert remains an optional video fallback and handles MP3 conversion, which depends on available credits." },
  { question: "Where can I find the downloaded Reel?", answer: "Check your browser’s downloads list or the download location selected on your device. The file saves to your device rather than a library on this website. If the download link has expired, process the original Facebook link again to get a fresh one." },
];

export function ReelsContent() {
  return <div className="mx-auto max-w-5xl py-12 sm:py-16">
    <section aria-labelledby="reels-guide">
    <div className="mx-auto max-w-3xl text-center"><span aria-hidden="true" className="text-4xl">🎬</span>
    <h2 id="reels-guide" className="mt-4 text-2xl font-bold">Download Facebook Reels online</h2>
    <p className="mt-4 text-sm leading-7 text-muted-foreground">Use FB Download Hub to save an accessible public Facebook Reel to your device or convert its original sound to a 320 kbps MP3. Copy a Reel link, paste it above and check the available files—without installing another app or creating an account here.</p>
    </div>
    <h3 className="mt-10 text-center text-lg font-semibold">How to download a Facebook Reel</h3>
    <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{steps.map(step => <li key={step.title} className="rounded-lg border border-border bg-card p-5"><span aria-hidden="true" className="text-3xl">{step.icon}</span><h3 className="mt-4 text-base font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p></li>)}</ol>
    </section>

    <section className="py-12" aria-labelledby="reels-quality">
      <div className="flex items-center gap-3"><span aria-hidden="true" className="text-3xl">💎</span><h2 id="reels-quality" className="text-2xl font-bold">Facebook Reels video quality: HD, SD and higher resolutions</h2></div>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">Choose from the qualities actually available for your Reel. HD offers more detail when the original supports it; SD is useful when a smaller file matters more. Higher-resolution video may need processing to combine its video and audio streams before saving.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        { icon: "🎞️", title: "HD video", text: "Save the available high-definition stream.", tone: "bg-primary/5 border-primary/20" },
        { icon: "📦", title: "SD video", text: "Choose the standard-definition option when available.", tone: "bg-chart-2/5 border-chart-2/20" },
        { icon: "📺", title: "1080p Full HD", text: "Save native Full HD with original audio when the source supports it.", tone: "bg-chart-3/5 border-chart-3/20" },
        { icon: "🚀", title: "2K & 4K sources", text: "Higher resolutions depend on the original Reel—not upscaling.", tone: "bg-chart-1/5 border-chart-1/20" },
      ].map(item => <article key={item.title} className={`rounded-lg border p-5 ${item.tone}`}><span aria-hidden="true" className="text-3xl">{item.icon}</span><h3 className="mt-3 text-base font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></article>)}</div>
    </section>

    <section className="grid gap-5 pb-12 sm:grid-cols-[auto_minmax(0,1fr)]" aria-labelledby="reels-mp3">
      <span aria-hidden="true" className="grid size-16 place-items-center rounded-lg bg-chart-2/10 text-4xl">🎵</span>
      <div><h2 id="reels-mp3" className="text-2xl font-bold">Facebook Reels to MP3 — 320 kbps audio</h2>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">Want the sound instead of the video? The MP3 option converts the Reel’s original audio into a playable 320 kbps MP3 file. Spoken words, background music and other sounds stay together as they appear in the source; this is not a vocal-removal or music-separation tool.</p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">Press Download MP3 after the Reel is processed, wait for conversion and save the finished file. Encoding at 320 kbps does not improve a low-quality original recording. Conversion uses CloudConvert and depends on available credits.</p></div>
    </section>

    <section className="grid gap-8 pb-12 sm:grid-cols-2" aria-label="Device downloads and supported links">
      <div><span aria-hidden="true" className="text-3xl">📱</span><h2 className="mt-3 text-xl font-bold">Save Reels on mobile, tablet or computer</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Use your device’s browser to paste a link and download the available file. Check the browser’s downloads list or your selected download folder when saving finishes. Video and audio conversion run separately, so you can still use an available direct video download while MP3 processing runs.</p></div>
      <div><span aria-hidden="true" className="text-3xl">🔗</span><h2 className="mt-3 text-xl font-bold">Which Facebook Reel links can I use?</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Copy the public Reel’s link using Facebook’s Share menu. Common formats include <span className="break-all font-medium text-foreground">facebook.com/reel/…</span> and <span className="break-all font-medium text-foreground">facebook.com/share/r/…</span>. The Reel must still be accessible; a copied link does not make private or restricted content downloadable.</p></div>
    </section>

    <section className="mx-auto max-w-3xl pb-12" aria-labelledby="reels-faq">
      <div className="flex items-center gap-3"><span aria-hidden="true" className="text-3xl">💬</span><h2 id="reels-faq" className="text-2xl font-bold">Facebook Reels downloader FAQ</h2></div>
      <div className="mt-5">{faqs.map(faq => <details key={faq.question} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">{faq.question}<ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary><p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p></details>)}</div>
    </section>

    <section className="text-center" aria-labelledby="more-downloads"><h2 id="more-downloads" className="text-xl font-bold">Downloading a regular Facebook video?</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Use our Facebook Video Downloader for public video links, with the same available video and MP3 options.</p><Button asChild variant="outline" className="mt-5 gap-2 text-primary transition active:scale-[0.96]"><Link to="/en"><span aria-hidden="true">📹</span>Facebook Video Downloader</Link></Button></section>
    <p className="mt-8 text-center text-xs leading-6 text-muted-foreground">Only download Reels you own or have permission to save. Respect creators’ rights and Facebook’s terms.</p>
  </div>;
}