import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { fetchFbVideo, type FbResult } from "@/lib/fbdl.functions";
import { startRender, startMp3, renderStatus } from "@/lib/render.functions";
import { mp3Source } from "@/lib/mp3";
import { Button } from "@/components/ui/button";
import { Download, Music, LoaderCircle, Clipboard, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FB Download Hub — Facebook Videos, Reels & MP3" },
      {
        name: "description",
        content:
          "Save public Facebook videos and reels in SD, HD, available high resolution, or convert their original audio and music to MP3.",
      },
      {
        property: "og:title",
        content: "FB Download Hub — Facebook Videos, Reels & MP3",
      },
      {
        property: "og:description",
        content:
          "Download public Facebook videos and reels, or save their original sound as MP3 with audio conversion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { n: "1", t: "Open Facebook", d: "Find the video or reel you want to save." },
  { n: "2", t: "Copy the link", d: "Use the Share menu and tap Copy link." },
  { n: "3", t: "Paste it here", d: "Drop the link in the box above." },
  { n: "4", t: "Download", d: "Pick SD, HD or 2K/4K render and save it." },
];

const faqs = [
  {
    q: "Is it free?",
    a: "Yes. Every download is completely free and there is no signup.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. It works right in your browser on phone, tablet and desktop.",
  },
  {
    q: "Which videos work?",
    a: "Any public Facebook video or reel. Private or friends-only videos cannot be downloaded.",
  },
  {
    q: "Which quality can I get?",
    a: "SD and HD download instantly. When Facebook has a higher resolution, a 2K/4K option appears that is rendered for you in about a minute.",
  },
];

type RenderUi = {
  state: "idle" | "working" | "done" | "error";
  progress: number;
  url?: string;
  error?: string;
  needKey?: boolean;
};

function fmtSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

function Index() {
  const run = useServerFn(fetchFbVideo);
  const begin = useServerFn(startRender);
  const beginMp3 = useServerFn(startMp3);
  const check = useServerFn(renderStatus);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FbResult | null>(null);
  const [render, setRender] = useState<RenderUi>({ state: "idle", progress: 0 });
  const [mp3, setMp3] = useState<RenderUi>({ state: "idle", progress: 0 });
  const [apiKey, setApiKey] = useState("");
  const [keyOpen, setKeyOpen] = useState(false);
  const [pasteError, setPasteError] = useState("");
  const urlInput = useRef<HTMLInputElement>(null);
  const resultsPanel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (loading || !result?.ok) return;
    const frame = requestAnimationFrame(() => {
      const panel = resultsPanel.current;
      if (!panel) return;
      const top = window.scrollY + panel.getBoundingClientRect().top - 24;
      window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
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
      if (timer.current) clearTimeout(timer.current);
      if (mp3Timer.current) clearTimeout(mp3Timer.current);
      requestVersion.current += 1;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
    } catch {
      setPasteError("Clipboard access was denied. Please paste the link into the box manually.");
    }
    urlInput.current?.focus();
  }

  async function poll(jobId: string, tries = 0) {
    try {
      const s = await check({ data: { jobId, apiKey } });
      if (s.status === "finished" && s.url) {
        setRender({ state: "done", progress: 100, url: s.url });
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
        setMp3({ state: "done", progress: 100, url: status.url });
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
      const started = await beginMp3({ data: { source, apiKey } });
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

      <section className="hero-gradient px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
            Facebook Video Downloader
          </h1>
          <p className="mt-3 text-sm text-primary-foreground/85">
            Free and easy tool for downloading Facebook videos and reels. Just
            copy the link and paste it below.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-card p-2 shadow-card lg:flex"
          >
            <input
              type="url"
              ref={urlInput}
              required
              value={url}
              onChange={(e) => { setUrl(e.target.value); setPasteError(""); }}
              placeholder="Paste Facebook video / reel URL..."
              className="min-w-0 w-full rounded-lg bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground lg:flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                if (url) { setUrl(""); setPasteError(""); urlInput.current?.focus(); }
                else void pasteLink();
              }}
              className="h-11 shrink-0 gap-2 px-4 text-primary transition active:scale-[0.96] active:brightness-95"
            >
              {url ? <X /> : <Clipboard />}
              {url ? "Clear" : "Paste"}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="col-span-2 h-11 w-full rounded-lg px-6 text-sm font-semibold transition active:scale-[0.96] active:brightness-90 lg:w-auto lg:shrink-0"
            >
              {loading ? "Processing..." : "Download"}
            </Button>
          </form>
          {pasteError && <p role="alert" className="mt-2 text-sm text-primary-foreground">{pasteError}</p>}
          <p className="mt-3 text-xs text-primary-foreground/80">
            Ex. https://www.facebook.com/watch?v=554413541934974 or
            https://fb.watch/lMDZjV1O0t/
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4">
        {(loading || result) && (
          <section ref={resultsPanel} className="mx-auto -mt-8 max-w-3xl rounded-xl bg-card p-5 shadow-card">
            {loading && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Fetching your video...
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
                        <span className="min-w-0 text-sm lg:hidden">Quality: {l.quality}{l.size ? ` (${fmtSize(l.size)})` : ""}</span>
                      <Button asChild className="h-auto shrink-0 px-4 py-2 transition active:scale-[0.96] active:brightness-90 lg:w-full lg:py-3">
                      <a
                        href={dl(l.url, "mp4", l.quality)}
                      >
                        <span className="lg:hidden">Download</span>
                        <span className="hidden lg:inline">Download {l.quality}{l.size ? ` (${fmtSize(l.size)})` : ""}</span>
                      </a>
                      </Button>
                      </div>
                    ))}

                    {result.render && render.state === "idle" && (
                      <button
                        type="button"
                        onClick={() => void onRender()}
                        className="cursor-pointer rounded-lg border-2 border-primary px-4 py-3 text-center text-sm font-semibold text-primary transition active:scale-[0.96] hover:bg-primary hover:text-primary-foreground"
                      >
                        Download {result.render.label} ({result.render.height}p
                        {result.render.size
                          ? ` · ~${fmtSize(result.render.size)}`
                          : ""}
                        · render)
                      </button>
                    )}

                    {render.state === "working" && (
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-sm font-semibold">
                          Rendering high quality video...
                        </p>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${render.progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Combining video and audio may take 1–3 minutes. Keep this page open.
                        </p>
                      </div>
                    )}

                    {render.state === "done" && render.url && (
                      <a
                        href={dl(
                          render.url,
                          "mp4",
                          result.render?.label ?? "hq",
                        )}
                        className="w-full cursor-pointer rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition active:scale-[0.96] active:brightness-90 hover:bg-primary/90"
                      >
                        Save {result.render?.label ?? "HQ"} file
                      </a>
                    )}


                    {render.state === "error" && (
                      <div className="rounded-lg border border-destructive/40 p-3 text-center">
                        <p className="text-sm text-destructive">
                          {render.error}
                        </p>
                        {render.needKey && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            The HD/SD downloads above are still available.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => void onRender()}
                          className="mt-2 cursor-pointer text-sm font-semibold text-primary underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {mp3.state === "done" && mp3.url ? (
                      <Button asChild className="h-auto w-full whitespace-normal py-3 transition active:scale-[0.96] active:brightness-90">
                        <a href={dl(mp3.url, "mp3", "audio")}><Download />Download MP3</a>
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => void onMp3()} disabled={mp3.state === "working"} className="h-auto w-full whitespace-normal border-primary py-3 text-primary transition active:scale-[0.96] active:brightness-90">
                        {mp3.state === "working" ? <LoaderCircle className="motion-safe:animate-spin" /> : <Music />}
                        {mp3.state === "working" ? `Rendering MP3… ${mp3.progress}%` : mp3.state === "error" ? "Retry MP3" : "Download MP3 (render)"}
                      </Button>
                    )}
                    {mp3.state === "working" && <div role="progressbar" aria-label="MP3 conversion" aria-valuenow={mp3.progress} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${mp3.progress}%` }} /></div>}
                    {mp3.state === "error" && <p role="alert" className="text-sm text-destructive">{mp3.error}</p>}

                    {(keyOpen || apiKey) && (
                      <div className="rounded-lg border border-border p-3 text-left">
                        <p className="text-sm font-semibold">
                          Your CloudConvert API key
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Conversion credits depend on your CloudConvert plan. Get a key{" "}
                          <a
                            href="https://cloudconvert.com/dashboard/api/v2/keys"
                            target="_blank"
                            rel="noreferrer"
                            className="cursor-pointer font-medium text-primary underline"
                          >
                            from CloudConvert
                          </a>{" "}
                          and paste it below. Your saved key is stored in this browser and sent securely when you request a conversion.
                        </p>
                        <div className="mt-2 flex gap-2">
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Paste your API key"
                            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem("cc_api_key", apiKey.trim());
                              setRender({ state: "idle", progress: 0 });
                              setMp3({ state: "idle", progress: 0 });
                            }}
                            className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition active:scale-[0.96] active:brightness-90 hover:bg-primary/90"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    {result.thumbnail && (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-3 lg:block lg:border-0 lg:py-0">
                        <span className="min-w-0 text-sm lg:hidden">Thumbnail image</span>
                        <Button asChild variant="outline" className="h-auto shrink-0 px-4 py-2 transition active:scale-[0.96] active:brightness-95 lg:w-full lg:py-3">
                      <a
                        href={dl(result.thumbnail, "jpg", "thumb")}
                      >
                        <span className="lg:hidden">Download</span><span className="hidden lg:inline">Download Image</span>
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

        <section className="py-14">
          <div className="grid gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-border bg-card p-6"
              >
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full hero-gradient font-bold text-primary-foreground">
                  {s.n}
                </span>
                <h2 className="mt-3 text-base font-semibold">{s.t}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl pb-16">
          <h2 className="text-xl font-bold">
            Free Facebook video and reel downloader
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Paste the link of any public Facebook video or reel and save it to
            your device in seconds. No account, no app install and no limits on
            how many videos you download. Works on Android, iPhone, Windows and
            Mac.
          </p>

          <h2 id="faq" className="mt-10 text-xl font-bold">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-3">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-lg border border-border bg-card p-4"
              >
                <h3 className="text-sm font-semibold">{f.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>


    </div>
  );
}
