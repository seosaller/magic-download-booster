import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Clipboard, X, Download, CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchSocialVideo } from "@/lib/social.functions";
import { socialCopy, socialLinkError, type SocialPlatform } from "@/lib/social";
import type { GenVideo } from "@/lib/gendownload";
import { copy, type Language } from "@/lib/i18n";

export function SocialDownloader({ language, platform }: { language: Language; platform: SocialPlatform }) {
  const t = copy[language];
  const text = socialCopy(language, platform);
  const run = useServerFn(fetchSocialVideo);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState<GenVideo | null>(null);
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
    const message = socialLinkError(next, platform);
    setUrl(next); setError(message); setAccepted(!message); input.current?.focus();
  }
  async function paste() {
    try {
      const value = await navigator.clipboard.readText();
      if (!value.trim()) { setError("Your clipboard is empty. Copy a video link first, or paste it manually."); return; }
      accept(value);
    } catch { setError("Clipboard access was denied. Please paste the video link into the box manually."); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    const message = socialLinkError(url, platform);
    setError(message);
    if (message) { input.current?.focus(); return; }
    setLoading(true); setVideo(null); setAccepted(false);
    const current = ++version.current;
    try {
      const result = await run({ data: { url, platform } });
      if (current !== version.current) return;
      if (result.ok) setVideo(result.video); else setError(result.error);
    } catch { if (current === version.current) setError("Unable to process this video link. Please check your connection and try again."); }
    finally { if (current === version.current) setLoading(false); }
  }
  return <div className="min-w-0 bg-background">
    <section className="hero-gradient px-4 py-10 sm:py-12 lg:py-16">
      <div className="mx-auto min-w-0 max-w-3xl text-center">
        <h1 className="break-words text-2xl font-bold leading-tight text-primary-foreground sm:text-3xl lg:text-4xl">{text.title}</h1>
        <p className="mt-3 break-words text-sm leading-6 text-primary-foreground/85">{text.intro}</p>
        <form noValidate onSubmit={event => void submit(event)} className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-card p-2 shadow-card lg:flex">
          <input ref={input} type="url" maxLength={4096} value={url} disabled={loading} aria-label={text.placeholder} placeholder={text.placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? "social-error" : undefined} onChange={event => { setUrl(event.target.value); setError(""); setAccepted(false); }} onBlur={() => { if (url) setError(socialLinkError(url, platform)); }} onPaste={event => { const value = event.clipboardData.getData("text/plain"); if (value.trim()) { event.preventDefault(); accept(value); } }} className="min-w-0 w-full rounded-lg bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground lg:flex-1" />
          <Button type="button" variant={url ? "destructive" : "outline"} disabled={loading} aria-label={url ? t.clear : t.paste} title={url ? t.clear : t.paste} className="h-11 w-11 shrink-0 px-0 transition active:scale-[0.96] lg:w-auto lg:px-4" onClick={() => { if (url) { version.current++; setUrl(""); setError(""); setAccepted(false); setVideo(null); input.current?.focus(); } else void paste(); }}>{url ? <X /> : <Clipboard />}<span className="hidden lg:inline">{url ? t.clear : t.paste}</span></Button>
          <Button type="submit" disabled={loading} className="col-span-2 h-11 w-full rounded-lg px-6 text-sm font-semibold transition active:scale-[0.96] active:brightness-90 lg:w-auto lg:shrink-0">{loading ? t.processing : t.download}</Button>
        </form>
        {accepted && !error && <p role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-card p-3 text-left text-sm text-success lg:hidden"><CircleCheck />{t.linkAccepted}</p>}
        {error && <p id="social-error" role="alert" className="mt-3 break-words rounded-lg bg-card p-3 text-left text-sm text-destructive">{error}</p>}
      </div>
    </section>
    <main className="container mx-auto px-4">
      {(loading || video) && <section ref={panel} aria-label={text.ready} className="mx-auto -mt-8 max-w-3xl rounded-xl bg-card p-5 shadow-card">
        {loading && <p role="status" className="flex items-center justify-center gap-2 py-5 text-sm text-muted-foreground"><LoaderCircle className="motion-safe:animate-spin" />{t.fetching}</p>}
        {video && <div className={`grid min-w-0 items-start gap-x-3 gap-y-4 ${video.thumbnail ? "grid-cols-[56px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]" : "grid-cols-1"} lg:gap-5`}>
          {video.thumbnail && <img src={`/api/public/social-download?type=thumbnail&url=${encodeURIComponent(video.thumbnail)}`} alt={t.thumbnail} className="h-14 w-14 shrink-0 rounded-lg border border-border bg-muted object-cover lg:h-auto lg:w-full" />}
          <div className="min-w-0 max-lg:contents">
            <div className="min-w-0 lg:mb-3"><h2 className="line-clamp-2 break-words text-sm font-semibold leading-5 lg:text-base lg:leading-6">{video.title}</h2>{video.author && <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{video.author}</p>}</div>
            <div className="col-span-full flex min-w-0 flex-col gap-2">{video.formats.map((format, index) => <Button asChild key={index} className="h-auto min-h-11 w-full whitespace-normal px-4 py-3 transition active:scale-[0.96] active:brightness-90"><a href={`/api/public/social-download?name=${platform}-video&url=${encodeURIComponent(format.url)}`}><Download />{text.video} · {format.label}{format.size > 0 ? ` · ${(format.size / 1e6).toFixed(1)} MB` : ""}</a></Button>)}</div>
          </div>
        </div>}
      </section>}
      <section className="download-content mx-auto max-w-3xl py-8 sm:py-10 lg:py-16"><p className="text-center text-sm leading-6 text-muted-foreground">{text.note}</p></section>
    </main>
  </div>;
}