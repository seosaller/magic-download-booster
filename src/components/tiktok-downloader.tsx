import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Clipboard, X, Download, CircleCheck, LoaderCircle, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTikTok } from "@/lib/tiktok.functions";
import { tiktokCopy, tiktokLinkError, resolveTikTokInBrowser, type TikTokVideo } from "@/lib/tiktok";
import { copy, type Language } from "@/lib/i18n";
import { startMp3, renderStatus } from "@/lib/render.functions";

function sizeLabel(bytes: number) { return bytes > 0 ? ` · ${(bytes / 1e6).toFixed(1)} MB` : ""; }
export function TikTokDownloader({ language }: { language: Language }) {
  const t = copy[language];
  const text = tiktokCopy[language];
  const run = useServerFn(fetchTikTok);
  const convertMp3 = useServerFn(startMp3);
  const checkMp3 = useServerFn(renderStatus);
  const [mp3, setMp3] = useState<{ status: "idle" | "working" | "done" | "error"; progress?: number; url?: string; size?: number; error?: string }>({ status: "idle" });
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState<TikTokVideo | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLElement>(null);
  const version = useRef(0);
  useEffect(() => () => { version.current++; }, []);
  useEffect(() => {
    if (!video) return;
    const frame = requestAnimationFrame(() => {
      if (!panel.current) return;
      const limit = window.matchMedia("(max-width: 1023px)").matches ? 128 : 64;
      window.scrollBy({ top: Math.min(limit, Math.max(0, panel.current.getBoundingClientRect().top - 24)), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [video]);
  function accept(value: string) {
    const next = value.trim();
    setUrl(next);
    const message = tiktokLinkError(next);
    setError(message);
    setAccepted(!message);
    input.current?.focus();
  }
  async function paste() {
    try {
      const value = await navigator.clipboard.readText();
      if (!value.trim()) { setError("Your clipboard is empty. Copy a TikTok video link first, or paste it manually."); return; }
      accept(value);
    } catch { setError("Clipboard access was denied. Please paste the TikTok link into the box manually."); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    const message = tiktokLinkError(url);
    setError(message);
    if (message) { input.current?.focus(); return; }
    setLoading(true); setVideo(null); setAccepted(false); setMp3({ status: "idle" });
    const current = ++version.current;
    try {
      const local = await resolveTikTokInBrowser(url.trim());
      if (current !== version.current) return;
      if (local) { setVideo(local); return; }
      const result = await run({ data: { url } });
      if (current !== version.current) return;
      if (result.ok) setVideo(result.video); else setError(result.error);
    } catch { if (current === version.current) setError("Unable to process this TikTok link. Please check your connection and try again."); }
    finally { if (current === version.current) setLoading(false); }
  }
  async function processMp3() {
    if (!video || mp3.status === "working") return;
    const current = version.current;
    setMp3({ status: "working", progress: 0 });
    try {
      const job = await convertMp3({ data: { tiktokId: video.id, bitrate: 320 } });
      if (current !== version.current) return;
      if (!job.ok || !job.jobId) throw new Error(job.error || "Unable to start MP3 conversion.");
      for (let attempt = 0; attempt < 100; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        if (current !== version.current) return;
        const result = await checkMp3({ data: { jobId: job.jobId } });
        if (current !== version.current) return;
        if (result.status === "error") throw new Error(result.error || "MP3 conversion failed.");
        if (result.status === "finished" && result.url) { setMp3({ status: "done", url: result.url, size: result.size || 0 }); return; }
        setMp3({ status: "working", progress: result.progress });
      }
      throw new Error("MP3 conversion took too long. Please try again.");
    } catch (error) {
      if (current === version.current) setMp3({ status: "error", error: error instanceof Error ? error.message : "Unable to convert MP3. Please try again." });
    }
  }
  return <div className="min-w-0 bg-background">
    <section className="hero-gradient px-4 py-10 sm:py-12 lg:py-16">
      <div className="mx-auto min-w-0 max-w-3xl text-center">
        <h1 className="break-words text-2xl font-bold leading-tight text-primary-foreground sm:text-3xl lg:text-4xl">{text.title}</h1>
        <p className="mt-3 break-words text-sm leading-6 text-primary-foreground/85">{text.intro}</p>
        <form noValidate onSubmit={event => void submit(event)} className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-card p-2 shadow-card lg:flex">
          <input ref={input} type="url" maxLength={4096} value={url} disabled={loading} aria-label={text.placeholder} placeholder={text.placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? "tiktok-error" : undefined} onChange={event => { setUrl(event.target.value); setError(""); setAccepted(false); }} onBlur={() => { if (url) setError(tiktokLinkError(url)); }} onPaste={event => { const value = event.clipboardData.getData("text/plain"); if (value.trim()) { event.preventDefault(); accept(value); } }} className="min-w-0 w-full rounded-lg bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground lg:flex-1" />
          <Button type="button" variant={url ? "destructive" : "outline"} disabled={loading} aria-label={url ? t.clear : t.paste} title={url ? t.clear : t.paste} className="h-11 w-11 shrink-0 px-0 transition active:scale-[0.96] lg:w-auto lg:px-4" onClick={() => { if (url) { version.current++; setUrl(""); setError(""); setAccepted(false); setVideo(null); setMp3({ status: "idle" }); input.current?.focus(); } else void paste(); }}>
            {url ? <X /> : <Clipboard />}<span className="hidden lg:inline">{url ? t.clear : t.paste}</span>
          </Button>
          <Button type="submit" disabled={loading} className="col-span-2 h-11 w-full rounded-lg px-6 text-sm font-semibold transition active:scale-[0.96] active:brightness-90 lg:w-auto lg:shrink-0">{loading ? t.processing : t.download}</Button>
        </form>
        {accepted && !error && <p role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-card p-3 text-left text-sm text-success lg:hidden"><CircleCheck />{t.linkAccepted}</p>}
        {error && <p id="tiktok-error" role="alert" className="mt-3 break-words rounded-lg bg-card p-3 text-left text-sm text-destructive">{error}</p>}
      </div>
    </section>
    <main className="container mx-auto px-4">
      {(loading || video) && <section ref={panel} aria-label={text.ready} className="mx-auto -mt-8 max-w-3xl rounded-xl bg-card p-5 shadow-card">
        {loading && <p role="status" className="flex items-center justify-center gap-2 py-5 text-sm text-muted-foreground"><LoaderCircle className="motion-safe:animate-spin" />{t.fetching}</p>}
        {video && <div className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] items-start gap-x-3 gap-y-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-5">
          <img src={`/api/public/tiktok-download?id=${video.id}&variant=thumbnail`} alt={t.thumbnail} className="h-14 w-14 shrink-0 rounded-lg border border-border bg-muted object-cover lg:h-auto lg:w-full" />
          <div className="min-w-0 max-lg:contents">
            <div className="col-start-2 min-w-0 lg:mb-3"><h2 className="line-clamp-2 break-words text-sm font-semibold leading-5 lg:text-base lg:leading-6">{video.title}</h2>{video.author && <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{video.author}</p>}</div>
            <div className="col-span-2 flex min-w-0 flex-col gap-2">
              {[{ variant: "video", label: text.video, size: video.size }, ...(video.watermark ? [{ variant: "watermark", label: text.watermark, size: video.watermarkSize }] : [])].map(option => <div key={option.variant} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-3 lg:block lg:border-0 lg:py-0">
                <span className="min-w-0 break-words text-sm leading-6 lg:hidden">{option.label}{sizeLabel(option.size)}</span>
                <Button asChild className="h-auto shrink-0 px-4 py-2 transition active:scale-[0.96] active:brightness-90 lg:w-full lg:whitespace-normal lg:py-3"><a href={`/api/public/tiktok-download?id=${video.id}&variant=${option.variant}`}><span className="lg:hidden">{t.download}</span><span className="hidden lg:inline">{option.label}{sizeLabel(option.size)}</span></a></Button>
              </div>)}
               {mp3.status === "done" && mp3.url ? <Button asChild variant="success" className="h-auto min-h-11 w-full whitespace-normal py-3 transition active:scale-[0.96]"><a href={`/api/public/download?type=mp3&name=tiktok-${video.id}&url=${encodeURIComponent(mp3.url)}`}><Download />{t.download} MP3 · 320 kbps{sizeLabel(mp3.size || 0)}</a></Button> : <Button variant="outline" disabled={mp3.status === "working"} onClick={() => void processMp3()} className="h-auto min-h-11 w-full whitespace-normal border-primary py-3 text-primary transition active:scale-[0.96] active:brightness-90">{mp3.status === "working" ? <LoaderCircle className="motion-safe:animate-spin" /> : <Music2 className="shrink-0 text-chart-2 [&_path]:stroke-chart-1 [&_circle]:fill-chart-2/20" />}{mp3.status === "working" ? `${t.mp3Working} · ${mp3.progress || 0}%` : mp3.status === "error" ? t.mp3Retry : `${t.download} MP3 · 320 kbps (${t.render})`}</Button>}
               {mp3.error && <p role="alert" className="break-words text-sm leading-6 text-destructive">{mp3.error}</p>}
            </div>
          </div>
        </div>}
      </section>}
      <div className="download-content mx-auto max-w-5xl">
        <section className="py-8 sm:py-10 lg:py-16"><h2 className="text-center text-2xl font-bold">{text.how}</h2><ol className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:mt-6 lg:grid-cols-4 lg:gap-4">{text.steps.map((step, index) => <li key={step} className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)] items-center gap-3 rounded-lg bg-muted p-3 sm:p-4 lg:block"><div className="flex shrink-0 flex-col items-center gap-1 lg:mb-2 lg:flex-row lg:justify-between"><span className="text-2xl">{["🎬", "🔗", "📋", "📥"][index]}</span><span className="text-xs text-muted-foreground">0{index + 1}</span></div><h3 className="min-w-0 break-words text-sm font-semibold leading-5">{step}</h3></li>)}</ol><p className="mt-5 text-center text-sm leading-6 text-muted-foreground lg:mt-6">{text.note}</p></section>
        <section className="pb-10"><h2 className="text-center text-xl font-bold">💬 {text.faq}</h2><details className="mt-5"><summary className="cursor-pointer py-3 font-semibold">{text.question}</summary><p className="pb-3 text-sm leading-6 text-muted-foreground">{text.answer}</p></details></section>
      </div>
    </main>
  </div>;
}