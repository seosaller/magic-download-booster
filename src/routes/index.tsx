import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { fetchFbVideo, type FbResult } from "@/lib/fbdl.functions";
import { startRender, renderStatus } from "@/lib/render.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Facebook Video Downloader - Save FB Videos & Reels in HD" },
      {
        name: "description",
        content:
          "Free Facebook video downloader. Paste any public Facebook video or reel link and download it in HD or SD, no signup and no software needed.",
      },
      {
        property: "og:title",
        content: "Facebook Video Downloader - Save FB Videos & Reels in HD",
      },
      {
        property: "og:description",
        content:
          "Paste a Facebook video or reel URL and download it instantly in HD or SD. Free, fast and works on any device.",
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
};

type DlUi = {
  received: number;
  total?: number | undefined;
  speed: number;
  done: boolean;
  error?: string;
};

function fmtSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

function fmtEta(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds < 60) return `~${Math.ceil(seconds)}s left`;
  return `~${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s left`;
}

function Index() {
  const run = useServerFn(fetchFbVideo);
  const begin = useServerFn(startRender);
  const check = useServerFn(renderStatus);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FbResult | null>(null);
  const [render, setRender] = useState<RenderUi>({ state: "idle", progress: 0 });
  const [dls, setDls] = useState<Record<string, DlUi>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setDls({});
    setRender({ state: "idle", progress: 0 });
    if (timer.current) clearTimeout(timer.current);
    try {
      const res = await run({ data: { url } });
      setResult(res);
    } catch (err) {
      setResult({ ok: false, links: [], error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function poll(jobId: string, tries = 0) {
    try {
      const s = await check({ data: { jobId } });
      if (s.status === "finished" && s.url) {
        setRender({ state: "done", progress: 100, url: s.url });
        return;
      }
      if (s.status === "error") {
        setRender({
          state: "error",
          progress: 0,
          error: s.error ?? "Render fail ho gaya.",
        });
        return;
      }
      setRender({ state: "working", progress: Math.max(5, s.progress) });
      if (tries > 80) {
        setRender({
          state: "error",
          progress: 0,
          error: "Render mein bahut waqt lag gaya. Dobara koshish karein.",
        });
        return;
      }
      timer.current = setTimeout(() => void poll(jobId, tries + 1), 3000);
    } catch (err) {
      setRender({ state: "error", progress: 0, error: (err as Error).message });
    }
  }

  async function onRender() {
    const r = result?.render;
    if (!r) return;
    setRender({ state: "working", progress: 5 });
    try {
      const started = await begin({
        data: { video: r.video, audio: r.audio, label: r.label },
      });
      if (!started.ok || !started.jobId) {
        setRender({
          state: "error",
          progress: 0,
          error: started.error ?? "Render shuru nahi ho saka.",
        });
        return;
      }
      void poll(started.jobId);
    } catch (err) {
      setRender({ state: "error", progress: 0, error: (err as Error).message });
    }
  }

  const dl = (link: string, type: "mp4" | "jpg", quality: string) =>
    `/api/public/download?type=${type}&name=${encodeURIComponent(
      "fb-video-" + quality.toLowerCase().replace(/[^a-z0-9]/g, ""),
    )}&url=${encodeURIComponent(link)}`;

  async function downloadWithProgress(
    key: string,
    link: string,
    filename: string,
  ) {
    if (dls[key] && !dls[key].error && !dls[key].done) return;
    setDls((s) => ({ ...s, [key]: { received: 0, speed: 0, done: false } }));
    try {
      const res = await fetch(dl(link, "mp4", key));
      if (!res.ok || !res.body) throw new Error("Download shuru nahi ho saka.");
      const total = Number(res.headers.get("content-length")) || undefined;
      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;
      let speed = 0;
      let lastTick = Date.now();
      let lastBytes = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value as BlobPart);
        received += value.length;
        const now = Date.now();
        if (now - lastTick >= 300) {
          speed = ((received - lastBytes) / (now - lastTick)) * 1000;
          lastTick = now;
          lastBytes = received;
          setDls((s) => ({
            ...s,
            [key]: { received, total, speed, done: false },
          }));
        }
      }
      const blob = new Blob(chunks, {
        type: res.headers.get("content-type") ?? "video/mp4",
      });
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(objUrl), 15000);
      setDls((s) => ({
        ...s,
        [key]: { received, total: total ?? received, speed, done: true },
      }));
    } catch (err) {
      setDls((s) => ({
        ...s,
        [key]: {
          received: 0,
          speed: 0,
          done: false,
          error: (err as Error).message,
        },
      }));
    }
  }

  function dlBar(key: string) {
    const d = dls[key];
    if (!d || d.done) return null;
    const pct = d.total
      ? Math.min(99, Math.round((d.received / d.total) * 100))
      : 0;
    return (
      <div className="rounded-lg border border-border p-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full bg-primary transition-all ${d.total ? "" : "animate-pulse w-full"}`}
            style={d.total ? { width: `${pct}%` } : undefined}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {fmtSize(d.received)}
          {d.total ? ` / ${fmtSize(d.total)}` : ""} ·{" "}
          {d.speed > 0 ? `${fmtSize(d.speed)}/s` : "starting..."}
          {d.total && d.speed > 0
            ? ` · ${fmtEta((d.total - d.received) / d.speed)}`
            : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-t-4 border-primary bg-card shadow-sm">
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <a href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="grid h-9 w-9 place-items-center rounded-lg hero-gradient text-primary-foreground">
              FB
            </span>
            <span>Download Hub</span>
          </a>
          <a
            href="#faq"
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Help
          </a>
        </nav>
      </header>

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
            className="mt-6 flex gap-2 rounded-xl bg-card p-2 shadow-card"
          >
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Facebook video / reel URL..."
              className="w-full rounded-lg bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Download"}
            </button>
          </form>
          <p className="mt-3 text-xs text-primary-foreground/80">
            Ex. https://www.facebook.com/watch?v=554413541934974 or
            https://fb.watch/lMDZjV1O0t/
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4">
        {(loading || result) && (
          <section className="mx-auto -mt-8 max-w-3xl rounded-xl bg-card p-5 shadow-card">
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
              <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
                {result.thumbnail && (
                  <img
                    src={result.thumbnail}
                    alt={result.title ?? "Facebook video thumbnail"}
                    className="w-full rounded-lg border border-border object-cover"
                    loading="lazy"
                  />
                )}
                <div>
                  <h2 className="mb-3 line-clamp-2 text-base font-semibold">
                    {result.title}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {result.links.map((l) => (
                      <a
                        key={l.quality}
                        href={dl(l.url, "mp4", l.quality)}
                        download
                        className="w-full cursor-pointer rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Download {l.quality}
                        {l.size ? ` (${fmtSize(l.size)})` : ""}
                      </a>
                    ))}

                    {result.render && render.state === "idle" && (
                      <button
                        type="button"
                        onClick={() => void onRender()}
                        className="cursor-pointer rounded-lg border-2 border-primary px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
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
                          Video aur audio ko jodne mein 1-3 minute lag sakte
                          hain. Page khula rakhein.
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
                        download
                        className="w-full cursor-pointer rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Save {result.render?.label ?? "HQ"} file
                      </a>
                    )}


                    {render.state === "error" && (
                      <div className="rounded-lg border border-destructive/40 p-3 text-center">
                        <p className="text-sm text-destructive">
                          {render.error}
                        </p>
                        <button
                          type="button"
                          onClick={() => void onRender()}
                          className="mt-2 cursor-pointer text-sm font-semibold text-primary underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {result.thumbnail && (
                      <a
                        href={dl(result.thumbnail, "jpg", "thumb")}
                        className="cursor-pointer rounded-lg border border-border px-4 py-3 text-center text-sm font-semibold transition-colors hover:bg-accent"
                      >
                        Download Image
                      </a>
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

      <footer className="bg-foreground px-4 py-8 text-center text-sm text-background">
        <p>© {new Date().getFullYear()} FB Download Hub</p>
        <p className="mt-2 text-background/70">
          Download only content you own or have permission to save.
        </p>
      </footer>
    </div>
  );
}
