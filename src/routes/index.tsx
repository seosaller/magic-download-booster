import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { fetchFbVideo, type FbResult } from "@/lib/fbdl.functions";
import { Mp3Download } from "@/components/mp3-download";
import { VideoDownload } from '@/components/video-download';
import { FileDownload } from '@/components/file-download';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FB Download Hub - HD, 2K, 4K & MP3" },
      {
        name: "description",
        content:
            "Download public Facebook videos and reels in SD, HD, native 2K or 4K when available, and MP3 audio. No signup needed.",
      },
      {
        property: "og:title",
         content: "FB Download Hub - HD, 2K, 4K & MP3",
      },
      {
        property: "og:description",
        content:
            "Save public Facebook videos in SD, HD, available native 2K or 4K, and MP3 audio.",
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
  { n: "4", t: "Download", d: "Pick SD or HD and save it to your device." },
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
    a: "SD, HD, and native 2K or 4K when Facebook provides them, plus MP3 audio.",
  },
];

function fmtSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

function Index() {
  const run = useServerFn(fetchFbVideo);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FbResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await run({ data: { url } });
      setResult(res);
    } catch (err) {
      setResult({ ok: false, links: [], error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  const dl = (link: string, type: "mp4" | "jpg", quality: string) =>
    `/api/public/download?type=${type}&name=${encodeURIComponent(
      "fb-video-" + quality.toLowerCase().replace(/[^a-z0-9]/g, ""),
    )}&url=${encodeURIComponent(link)}`;

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
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition active:scale-[0.96] active:brightness-90 hover:bg-primary/90"
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
              className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.96] active:brightness-90 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {loading && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
                />
              )}
              {loading ? "Processing..." : "Download"}
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
                    {result.links.map((l) => l.audioUrl ? (
                      <VideoDownload key={l.quality} quality={l.quality} video={dl(l.url, 'mp4', l.quality)} audio={dl(l.audioUrl, 'mp4', 'audio-source')} />
                    ) : (
                      <FileDownload key={l.quality} source={dl(l.url, 'mp4', l.quality)} filename={`fb-video-${l.quality.toLowerCase()}.mp4`} kind="mp4" label={`Download ${l.quality}${l.size ? ` (${fmtSize(l.size)})` : ''}`} />
                    ))}

                    {result.links[0] && (
                      <Mp3Download
                        key={result.links[0].url}
                         source={(result.audioSources?.length ? result.audioSources : [ (result.links.find((l) => l.quality === 'SD') ?? result.links[0]).url ]).map(source => dl(source, 'mp4', 'audio-source')).join('|')}
                      />
                    )}

                    {result.thumbnail && (
                      <FileDownload source={dl(result.thumbnail, 'jpg', 'thumb')} filename="fb-video-thumb.jpg" kind="jpg" label="Download Image" />
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
