import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Clipboard, X, Download, CircleCheck, LoaderCircle, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTikTok } from "@/lib/tiktok.functions";
import { tiktokCopy, tiktokLinkError, type TikTokVideo } from "@/lib/tiktok";
import { copy, type Language } from "@/lib/i18n";

function sizeLabel(bytes: number) { return bytes > 0 ? ` · ${(bytes / 1e6).toFixed(1)} MB` : ""; }
export function TikTokDownloader({ language }: { language: Language }) {
  const t = copy[language];
  const text = tiktokCopy[language];
  const run = useServerFn(fetchTikTok);
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
    setLoading(true); setVideo(null); setAccepted(false);
    const current = ++version.current;
    try {
      const result = await run({ data: { url } });
      if (current !== version.current) return;
      if (result.ok) setVideo(result.video); else setError(result.error);
    } catch { if (current === version.current) setError("Unable to process this TikTok link. Please check your connection and try again."); }
    finally { if (current === version.current) setLoading(false); }
  }
  return <div className="min-h-screen bg-background">
    <section className="hero-gradient px-4 py-10 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <Music2 aria-hidden="true" className="mx-auto mb-3 size-8 text-primary-foreground" />
        <h1 className="text-2xl font-bold text-primary-foreground sm:text-3xl lg:text-4xl">{text.title}</h1>
        <p className="mt-3 text-sm text-primary-foreground/85">{text.intro}</p>
        <form noValidate onSubmit={event => void submit(event)} className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-card p-2 shadow-card lg:flex">
          <input ref={input} type="url" maxLength={4096} value={url} disabled={loading} aria-label={text.placeholder} placeholder={text.placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? "tiktok-error" : undefined} onChange={event => { setUrl(event.target.value); setError(""); setAccepted(false); }} onBlur={() => { if (url) setError(tiktokLinkError(url)); }} onPaste={event => { const value = event.clipboardData.getData("text/plain"); if (value.trim()) { event.preventDefault(); accept(value); } }} className="min-w-0 w-full rounded-lg bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground lg:flex-1" />
          <Button type="button" variant={url ? "destructive" : "outline"} disabled={loading} aria-label={url ? t.clear : t.paste} title={url ? t.clear : t.paste} className="h-11 w-11 shrink-0 px-0 transition active:scale-[0.96] lg:w-auto lg:px-4" onClick={() => { if (url) { setUrl(""); setError(""); setAccepted(false); setVideo(null); input.current?.focus(); } else void paste(); }}>
            {url ? <X /> : <Clipboard />}<span className="hidden lg:inline">{url ? t.clear : t.paste}</span>
          </Button>
          <Button type="submit" disabled={loading} className="col-span-2 h-11 w-full px-6 transition active:scale-[0.96] lg:w-auto">{loading && <LoaderCircle className="motion-safe:animate-spin" />}{loading ? t.processing : t.download}</Button>
        </form>
        {accepted && !error && <p role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-card p-3 text-left text-sm text-success lg:hidden"><CircleCheck />{t.linkAccepted}</p>}
        {error && <p id="tiktok-error" role="alert" className="mt-3 rounded-lg bg-card p-3 text-left text-sm text-destructive">{error}</p>}
      </div>
    </section>
    <main className="container mx-auto px-4">
      {(loading || video) && <section ref={panel} aria-label={text.ready} className="mx-auto -mt-6 max-w-3xl rounded-lg bg-card p-4 shadow-card sm:p-5">
        {loading && <p role="status" className="flex items-center justify-center gap-2 py-5 text-sm text-muted-foreground"><LoaderCircle className="motion-safe:animate-spin" />{t.fetching}</p>}
        {video && <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
          {video.cover ? <img src={video.cover} alt={t.thumbnail} className="aspect-[3/4] w-full rounded-lg object-cover" /> : <Music2 className="size-10 text-chart-2" />}
          <div className="min-w-0"><h2 className="line-clamp-2 text-sm font-semibold">{video.title}</h2>{video.author && <p className="mt-1 text-xs text-muted-foreground">{video.author}</p>}
            <div className="mt-3 grid gap-2">
              <Button asChild variant="success" className="h-auto min-h-11 w-full whitespace-normal py-3 transition active:scale-[0.96]"><a href={`/api/public/tiktok-download?id=${video.id}&variant=video`}><Download />{text.video}{sizeLabel(video.size)}</a></Button>
              {video.watermark && <Button asChild variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-3 transition active:scale-[0.96]"><a href={`/api/public/tiktok-download?id=${video.id}&variant=watermark`}><Download />{text.watermark}{sizeLabel(video.watermarkSize)}</a></Button>}
            </div>
          </div>
        </div>}
      </section>}
      <div className="download-content mx-auto max-w-5xl">
        <section className="py-8 sm:py-10 lg:py-16"><h2 className="text-center text-2xl font-bold">{text.how}</h2><ol className="guide-steps mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{text.steps.map((step, index) => <li key={step} className="min-w-0 rounded-lg bg-muted p-4"><div className="mb-2 flex items-center justify-between"><span className="text-2xl">{["🎬", "🔗", "📋", "📥"][index]}</span><span className="text-xs text-muted-foreground">0{index + 1}</span></div><h3 className="text-sm font-semibold">{step}</h3></li>)}</ol><p className="mt-6 text-center text-sm leading-6 text-muted-foreground">{text.note}</p></section>
        <section className="pb-10"><h2 className="text-center text-xl font-bold">💬 {text.faq}</h2><details className="mt-5"><summary className="cursor-pointer py-3 font-semibold">{text.question}</summary><p className="pb-3 text-sm leading-6 text-muted-foreground">{text.answer}</p></details></section>
      </div>
    </main>
  </div>;
}