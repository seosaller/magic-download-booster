import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { fetchFbVideo, type FbResult } from "@/lib/fbdl.functions";
import { startRender, startMp3, renderStatus } from "@/lib/render.functions";
import { mp3Source } from "@/lib/mp3";
import { facebookLinkError, MAX_FACEBOOK_LINK_LENGTH } from "@/lib/facebook-link";
import { assertLocalVideoSize } from "@/lib/video-merge";
import { Button } from "@/components/ui/button";
import { HomeContent } from "@/components/home-content";
import { ReelsContent } from "@/components/reels-content";
import { FullHdDownload } from "@/components/full-hd-download";
import { fullHdFallback } from "@/lib/full-hd-fallback";
import { copy, type Language } from "@/lib/i18n";
import { LocalizedContent } from "@/components/localized-content";
import { Download, Music, LoaderCircle, Clipboard, X, CircleCheck } from "lucide-react";

type RenderUi = {
  state: "idle" | "working" | "done" | "error";
  progress: number;
  url?: string;
  size?: number | undefined;
  error?: string;
  needKey?: boolean;
};

function fmtSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

export function DownloaderPage({ reels = false, language = "vi" }: { reels?: boolean; language?: Language }) {
  const t = copy[language];
  const run = useServerFn(fetchFbVideo);
  const begin = useServerFn(startRender);
  const beginMp3 = useServerFn(startMp3);
  const check = useServerFn(renderStatus);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FbResult | null>(null);
  const [render, setRender] = useState<RenderUi>({ state: "idle", progress: 0 });
  const [mp3, setMp3] = useState<RenderUi>({ state: "idle", progress: 0 });
  const mp3Bitrate = 320;
  const [apiKey, setApiKey] = useState("");
  const [keyOpen, setKeyOpen] = useState(false);
  const [pasteError, setPasteError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [acceptedPaste, setAcceptedPaste] = useState(false);
  const urlInput = useRef<HTMLInputElement>(null);
  const resultsPanel = useRef<HTMLElement>(null);
  const localController = useRef<AbortController | null>(null);
  const localFile = useRef<string | null>(null);
  function clearLocalVideo() {
    localController.current?.abort();
    localController.current = null;
    if (localFile.current) URL.revokeObjectURL(localFile.current);
    localFile.current = null;
  }

  useEffect(() => {
    if (loading || !result?.ok) return;
    const frame = requestAnimationFrame(() => {
      const panel = resultsPanel.current;
      if (!panel) return;
      const scrollLimit = window.matchMedia("(max-width: 1023px)").matches ? 128 : 64;
      const distance = Math.min(scrollLimit, Math.max(0, panel.getBoundingClientRect().top - 24));
      window.scrollTo({ top: window.scrollY + distance, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [loading, result, render.state === "done", mp3.state === "done"]);

  useEffect(() => {
    const saved = localStorage.getItem("cc_api_key");
    if (saved) setApiKey(saved);
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mp3Timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestVersion = useRef(0);

  useEffect(() => {
    return () => {
      clearLocalVideo();
      if (timer.current) clearTimeout(timer.current);
      if (mp3Timer.current) clearTimeout(mp3Timer.current);
      requestVersion.current += 1;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = facebookLinkError(url);
    setLinkError(validationError);
    if (validationError) { urlInput.current?.focus(); return; }
    setAcceptedPaste(false);
    clearLocalVideo();
    setLoading(true);
    setResult(null);
    setRender({ state: "idle", progress: 0 });
    setMp3({ state: "idle", progress: 0 });
    requestVersion.current += 1;
    if (mp3Timer.current) clearTimeout(mp3Timer.current);
    if (timer.current) clearTimeout(timer.current);
    try {
      const res = await run({ data: { url } });
      setResult(res);
    } catch (err) {
      setResult({ ok: false, links: [], error: "Unable to complete the request. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  async function pasteLink() {
    setPasteError("");
    setAcceptedPaste(false);
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
      setLinkError(facebookLinkError(text));
      setAcceptedPaste(!facebookLinkError(text));
    } catch {
      setPasteError("Clipboard access was denied. Please paste the link into the box manually.");
    }
    urlInput.current?.focus();
  }

  async function poll(jobId: string, tries = 0) {
    try {
      const s = await check({ data: { jobId, apiKey } });
      if (s.status === "finished" && s.url) {
        setRender({ state: "done", progress: 100, url: s.url, size: s.size });
        return;
      }
      if (s.status === "error") {
        setRender({
          state: "error",
          progress: 0,
          error: s.error ?? "Video processing failed. Please try again.",
          needKey: s.code === "credits",
        });
        if (s.code === "credits") setKeyOpen(true);
        return;
      }
      setRender({ state: "working", progress: Math.max(5, s.progress) });
      if (tries > 80) {
        setRender({
          state: "error",
          progress: 0,
          error: "Video processing took too long. Please try again.",
        });
        return;
      }
      timer.current = setTimeout(() => void poll(jobId, tries + 1), 3000);
    } catch (err) {
      setRender({ state: "error", progress: 0, error: "Unable to complete the request. Please check your connection and try again." });
    }
  }

  async function onFreeRender() {
    const source = result?.render;
    if (!source || render.state === "working") return;
    clearLocalVideo();
    const controller = new AbortController();
    localController.current = controller;
    const version = requestVersion.current;
    setRender({ state: "working", progress: 5 });
    try {
      assertLocalVideoSize(source.size ?? 0);
      const { mergeBrowserVideo } = await import("@/lib/browser-video");
      const output = await mergeBrowserVideo(source.video, source.audio, controller.signal, (progress) => {
        if (requestVersion.current === version && !controller.signal.aborted) setRender({ state: "working", progress });
      });
      if (requestVersion.current !== version || controller.signal.aborted) { URL.revokeObjectURL(output.url); return; }
      localFile.current = output.url;
      setRender({ state: "done", progress: 100, url: output.url, size: output.size });
    } catch (error) {
      if (requestVersion.current === version && !controller.signal.aborted) setRender({ state: "error", progress: 0, error: error instanceof Error ? error.message : "Free video processing failed. Please try again." });
    }
  }

  async function onRender() {
    const r = result?.render;
    if (!r) return;
    setRender({ state: "working", progress: 5 });
    try {
      const started = await begin({
        data: { video: r.video, audio: r.audio, label: r.label, apiKey },
      });
      if (!started.ok || !started.jobId) {
        setRender({
          state: "error",
          progress: 0,
          error: started.error ?? "Video processing could not start. Please try again.",
          needKey: started.code === "credits" || started.code === "config",
        });
        if (started.code === "credits" || started.code === "config")
          setKeyOpen(true);
        return;
      }
      void poll(started.jobId);
    } catch (err) {
      setRender({ state: "error", progress: 0, error: "Unable to complete the request. Please check your connection and try again." });
    }
  }

  async function pollMp3(jobId: string, key: string, version: number, tries = 0) {
    try {
      const status = await check({ data: { jobId, apiKey: key } });
      if (requestVersion.current !== version) return;
      if (status.status === "finished" && status.url) {
        setMp3({ state: "done", progress: 100, url: status.url, size: status.size });
        return;
      }
      if (status.status === "error" || tries >= 120) {
        setMp3({ state: "error", progress: 0, error: status.status === "error" ? "MP3 conversion failed. The video may have no audio, the link may have expired, or the service may be unavailable. HD/SD downloads are still available." : "MP3 conversion took too long. Please try again.", needKey: status.code === "credits" });
        if (status.code === "credits") setKeyOpen(true);
        return;
      }
      setMp3({ state: "working", progress: Math.max(5, status.progress) });
      mp3Timer.current = setTimeout(() => void pollMp3(jobId, key, version, tries + 1), 3000);
    } catch {
      if (requestVersion.current === version) setMp3({ state: "error", progress: 0, error: "Unable to check MP3 conversion status. Please try again." });
    }
  }

  async function onMp3() {
    const source = result ? mp3Source(result) : undefined;
    if (!source) return;
    const version = requestVersion.current;
    setMp3({ state: "working", progress: 5 });
    try {
      const started = await beginMp3({ data: { source, apiKey, bitrate: mp3Bitrate } });
      if (requestVersion.current !== version) return;
      if (!started.ok || !started.jobId) {
        const needKey = started.code === "credits" || started.code === "config";
        setMp3({ state: "error", progress: 0, error: started.error ?? "MP3 conversion could not start. Please try again.", needKey });
        if (needKey) setKeyOpen(true);
        return;
      }
      void pollMp3(started.jobId, apiKey, version);
    } catch {
      if (requestVersion.current === version) setMp3({ state: "error", progress: 0, error: "MP3 conversion failed. Please try again." });
    }
  }

  const dl = (link: string, type: "mp4" | "jpg" | "mp3", quality: string) =>
    `/api/public/download?type=${type}&name=${encodeURIComponent(
      "fb-video-" + quality.toLowerCase().replace(/[^a-z0-9]/g, ""),
    )}&url=${encodeURIComponent(link)}`;


  return (
    <div className="min-h-screen bg-background">

      <section className="hero-gradient px-4 py-10 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-primary-foreground sm:text-3xl lg:text-4xl">
            {reels ? t.reelsTitle : t.videoTitle}
          </h1>
          <p className="mt-3 text-sm text-primary-foreground/85">
            {reels ? t.reelsIntro : t.videoIntro}
          </p>

          <form
            onSubmit={onSubmit}
            noValidate
            className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-card p-2 shadow-card lg:flex"
          >
            <input
              type="url"
              ref={urlInput}
              required
              maxLength={MAX_FACEBOOK_LINK_LENGTH}
              value={url}
              onChange={(e) => { setUrl(e.target.value); setPasteError(""); setAcceptedPaste(false); setLinkError(linkError ? facebookLinkError(e.target.value) : ""); }}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData("text").trim();
                setUrl(text);
                setPasteError("");
                setLinkError(facebookLinkError(text));
                setAcceptedPaste(!facebookLinkError(text));
              }}
              onBlur={() => { if (url) setLinkError(facebookLinkError(url)); }}
              aria-invalid={Boolean(linkError)}
              aria-describedby={linkError ? "facebook-link-error" : undefined}
              aria-label={reels ? t.reelPlaceholder : t.placeholder}
              placeholder={reels ? t.reelPlaceholder : t.placeholder}
              className="min-w-0 w-full rounded-lg bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground lg:flex-1"
            />
            <Button
              type="button"
              variant={url ? "destructive" : "outline"}
              disabled={loading}
              aria-label={url ? t.clear : t.paste}
              title={url ? t.clear : t.paste}
              onClick={() => {
                if (url) { setUrl(""); setPasteError(""); setLinkError(""); setAcceptedPaste(false); urlInput.current?.focus(); }
                else void pasteLink();
              }}
              className={`h-11 w-11 shrink-0 gap-2 px-0 transition active:scale-[0.96] active:brightness-95 lg:w-auto lg:px-4 ${url ? "" : "text-primary"}`}
            >
              {url ? <X /> : <Clipboard />}
              <span className="hidden lg:inline">{url ? t.clear : t.paste}</span>
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="col-span-2 h-11 w-full rounded-lg px-6 text-sm font-semibold transition active:scale-[0.96] active:brightness-90 lg:w-auto lg:shrink-0"
            >
              {loading ? t.processing : t.download}
            </Button>
          </form>
          <div role="status" aria-live="polite" aria-atomic="true" className="lg:hidden">
            {acceptedPaste && !linkError && <p className="mt-3 flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-left text-sm font-medium text-success"><CircleCheck aria-hidden="true" className="size-5 shrink-0" />{t.linkAccepted}</p>}
          </div>
          {linkError && <p id="facebook-link-error" role="alert" className="mt-3 rounded-lg bg-card px-3 py-2 text-left text-sm leading-6 text-destructive">{linkError}</p>}
          {pasteError && <p role="alert" className="mt-2 text-sm text-primary-foreground">{pasteError}</p>}
          <p className="mt-3 break-words text-xs leading-5 text-primary-foreground/80">
            {reels ? t.reelExample : "Ex. https://www.facebook.com/watch?v=554413541934974 or https://fb.watch/lMDZjV1O0t/"}
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4">
        {(loading || result) && (
          <section ref={resultsPanel} className="mx-auto -mt-8 max-w-3xl rounded-xl bg-card p-5 shadow-card">
            {loading && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t.fetching}
              </p>
            )}

            {result && !result.ok && (
              <p className="py-4 text-center text-sm text-destructive">
                {result.error}
              </p>
            )}

            {result?.ok && (
              <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-3 gap-y-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-5">
                {result.thumbnail && (
                  <img
                    src={result.thumbnail}
                    alt={result.title ?? "Facebook video thumbnail"}
                    className="h-14 w-14 rounded-lg border border-border object-cover lg:h-auto lg:w-full"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 max-lg:contents">
                  <h2 className="col-start-2 mb-0 line-clamp-2 text-sm font-semibold lg:mb-3 lg:text-base">
                    {result.title}
                  </h2>
                  <div className="col-span-2 flex min-w-0 flex-col gap-2">
                    {result.links.map((l) => (
                      <div key={l.quality} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-3 lg:block lg:border-0 lg:py-0">
                        <span className="min-w-0 text-sm lg:hidden">{t.quality}: {l.quality}{l.size ? ` (${fmtSize(l.size)})` : ""}</span>
                      <Button asChild className="h-auto shrink-0 px-4 py-2 transition active:scale-[0.96] active:brightness-90 lg:w-full lg:py-3">
                      <a
                        href={dl(l.url, "mp4", l.quality)}
                      >
                        <span className="lg:hidden">{t.download}</span>
                        <span className="hidden lg:inline">{t.download} {l.quality}{l.size ? ` (${fmtSize(l.size)})` : ""}</span>
                      </a>
                      </Button>
                      </div>
                    ))}

                    <FullHdDownload language={language} key={result.fullHd?.video ?? "unavailable"} source={result.fullHd} fallback={fullHdFallback(result.fullHd, result.links)} />

                    {result.render && result.render.height !== 1080 && render.state === "idle" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void onFreeRender()}
                        className="h-auto whitespace-normal border-primary px-4 py-3 text-primary transition active:scale-[0.96]"
                      >
                        <Download />
                        {t.download} {result.render.label} ({result.render.height}p
                        {result.render.size
                          ? ` · ~${fmtSize(result.render.size)}`
                          : ""}
                        )
                      </Button>
                    )}

                    {render.state === "working" && (
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-sm font-semibold">
                          {t.workingVideo} {Math.round(render.progress)}%
                        </p>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${render.progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t.processingNote}
                        </p>
                      </div>
                    )}

                    {render.state === "done" && render.url && (
                      <Button asChild variant="success" className="h-auto w-full whitespace-normal py-3 transition active:scale-[0.96]">
                      <a
                        download={render.url.startsWith("blob:") ? `fb-video-${result.render?.label ?? "hq"}.mp4` : undefined}
                        href={render.url.startsWith("blob:") ? render.url : dl(
                          render.url,
                          "mp4",
                          result.render?.label ?? "hq",
                        )}
                        className="w-full cursor-pointer rounded-lg px-4 py-3 text-center text-sm font-semibold transition active:scale-[0.96] active:brightness-90"
                      >
                        {t.save} {result.render?.label ?? "HQ"}{render.size ? ` · ${fmtSize(render.size)}` : ""}
                      </a>
                      </Button>
                    )}


                    {render.state === "error" && (
                      <div className="rounded-lg border border-destructive/40 p-3 text-center">
                        <p className="text-sm text-destructive">
                          {render.error}
                        </p>
                        {render.needKey && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {t.available}
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => void onFreeRender()}
                          className="mt-2 text-primary"
                        >
                          {t.retry}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => void onRender()} className="mt-2 whitespace-normal">{t.cloud}</Button>
                      </div>
                    )}

                    {mp3.state === "done" && mp3.url ? (
                      <Button asChild variant="success" className="h-auto w-full whitespace-normal py-3 transition active:scale-[0.96] active:brightness-90">
                        <a href={dl(mp3.url, "mp3", `audio-${mp3Bitrate}kbps`)}><Download />{t.download} MP3 · {mp3Bitrate} kbps{mp3.size ? ` · ${fmtSize(mp3.size)}` : ""}</a>
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => void onMp3()} disabled={mp3.state === "working"} className="h-auto w-full whitespace-normal border-primary py-3 text-primary transition active:scale-[0.96] active:brightness-90">
                        {mp3.state === "working" ? <LoaderCircle className="motion-safe:animate-spin" /> : <Music className="text-chart-2 [&_path]:stroke-chart-1 [&_circle]:fill-chart-2/20" />}
                        {mp3.state === "working" ? `${t.mp3Working} · ${mp3Bitrate} kbps… ${mp3.progress}%` : mp3.state === "error" ? `${t.mp3Retry} · ${mp3Bitrate} kbps` : `${t.download} MP3 · ${mp3Bitrate} kbps (${t.render})`}
                      </Button>
                    )}
                    {mp3.state === "working" && <div role="progressbar" aria-label="MP3 conversion" aria-valuenow={mp3.progress} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${mp3.progress}%` }} /></div>}
                    {mp3.state === "error" && <p role="alert" className="text-sm text-destructive">{mp3.error}</p>}

                    {(keyOpen || apiKey) && (
                      <div className="rounded-lg border border-border p-3 text-left">
                        <p className="text-sm font-semibold">
                          {t.key}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t.keyBefore}{" "}
                          <a
                            href="https://cloudconvert.com/dashboard/api/v2/keys"
                            target="_blank"
                            rel="noreferrer"
                            className="cursor-pointer font-medium text-primary underline"
                          >
                            {t.keyLink}
                          </a>{" "}
                          {t.keyAfter}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={t.keyPlaceholder}
                            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              localStorage.setItem("cc_api_key", apiKey.trim());
                              setRender({ state: "idle", progress: 0 });
                              setMp3({ state: "idle", progress: 0 });
                            }}
                            className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition active:scale-[0.96] active:brightness-90 hover:bg-primary/90"
                          >
                            {t.save}
                          </Button>
                        </div>
                      </div>
                    )}

                    {result.thumbnail && (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-3 lg:block lg:border-0 lg:py-0">
                        <span className="min-w-0 text-sm lg:hidden">{t.thumbnail}</span>
                        <Button asChild variant="outline" className="h-auto shrink-0 px-4 py-2 transition active:scale-[0.96] active:brightness-95 lg:w-full lg:py-3">
                      <a
                        href={dl(result.thumbnail, "jpg", "thumb")}
                      >
                        <span className="lg:hidden">{t.download}</span><span className="hidden lg:inline">{t.image}</span>
                      </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {language !== "en" ? <LocalizedContent language={language} reels={reels} onStart={() => {
          urlInput.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          urlInput.current?.focus({ preventScroll: true });
        }} /> : reels ? <ReelsContent /> : <HomeContent onStart={() => {
          urlInput.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
          urlInput.current?.focus({ preventScroll: true });
        }} />}
      </main>


    </div>
  );
}
