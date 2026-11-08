import { createServerFn } from "@tanstack/react-start";
import { findFullHdSource, type FullHdSource } from "./full-hd";
import { facebookRequestSchema, isFacebookPageUrl } from "./facebook-link";

export type FbResult = {
  ok: boolean;
  error?: string | undefined;
  title?: string | undefined;
  thumbnail?: string | undefined;
  links: { quality: string; url: string; size?: number | undefined }[];
  fullHd?: FullHdSource | undefined;
  render?:
    | {
        label: string;
        height: number;
        video: string;
        audio: string;
        size?: number | undefined;
      }
    | undefined;
};

function unescapeJson(s: string) {
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

function xmlAttr(tag: string, name: string) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m?.[1];
}

/** Pull the best video-only + audio-only DASH streams for a high-res render. */
function parseDash(html: string): FbResult["render"] {
  const m = html.match(
    /"(?:dash_manifest|dash_manifest_xml_string)"\s*:\s*"((?:\\.|[^"\\])*)"/,
  );
  if (!m?.[1]) return undefined;
  const xml = unescapeJson(m[1]);

  const reps = xml.match(/<Representation\b[\s\S]*?<\/Representation>/g) ?? [];
  let bestVideo: { url: string; height: number } | undefined;
  let bestAudio: { url: string; rate: number } | undefined;

  for (const rep of reps) {
    const base = rep.match(/<BaseURL>([\s\S]*?)<\/BaseURL>/)?.[1];
    if (!base) continue;
    const url = base
      .replace(/&amp;/g, "&")
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .trim();
    if (!url.startsWith("http")) continue;
    const mime = xmlAttr(rep, "mimeType") ?? "";
    const bandwidth = Number(xmlAttr(rep, "bandwidth") ?? 0);
    if (mime.startsWith("video")) {
      const height = Number(xmlAttr(rep, "height") ?? 0);
      if (!bestVideo || height > bestVideo.height) bestVideo = { url, height };
    } else if (mime.startsWith("audio")) {
      if (!bestAudio || bandwidth > bestAudio.rate)
        bestAudio = { url, rate: bandwidth };
    }
  }

  if (!bestVideo || !bestAudio || bestVideo.height <= 0) return undefined;
  return build(bestVideo, bestAudio);
}

function build(
  v: { url: string; height: number },
  a: { url: string },
): FbResult["render"] {
  const h = v.height;
  const label =
    h >= 2000 ? "4K" : h >= 1300 ? "2K" : h >= 1000 ? "1080p" : `${h}p`;
  return { label, height: h, video: v.url, audio: a.url };
}

/** Newer Facebook pages ship the streams as JSON representations instead of DASH XML. */
function parseRepresentations(html: string): FbResult["render"] {
  let bestVideo: { url: string; height: number } | undefined;
  let bestAudio: { url: string; rate: number } | undefined;

  // The JSON blob is often embedded escaped inside a <script> string.
  const plain = html.replace(/\\"/g, '"').replace(/\\\//g, "/");

  for (const text of [html, plain]) {
    const segments = text.split(/"representation_id"\s*:/).slice(1);
    for (const seg of segments) {
      const chunk = seg.slice(0, 4000);
      const rawUrl = chunk.match(/"base_url"\s*:\s*"((?:\\.|[^"\\])*)"/)?.[1];
      if (!rawUrl) continue;
      const url = unescapeJson(rawUrl).replace(/&amp;/g, "&");
      if (!url.startsWith("http")) continue;
      const mime = chunk.match(/"mime_type"\s*:\s*"(video|audio)/)?.[1];
      if (mime === "video") {
        const height = Number(chunk.match(/"height"\s*:\s*(\d+)/)?.[1] ?? 0);
        if (!bestVideo || height > bestVideo.height)
          bestVideo = { url, height };
      } else if (mime === "audio") {
        const rate = Number(chunk.match(/"bandwidth"\s*:\s*(\d+)/)?.[1] ?? 0);
        if (!bestAudio || rate > bestAudio.rate) bestAudio = { url, rate };
      }
    }
    if (bestVideo && bestAudio && bestVideo.height > 0) break;
  }

  if (!bestVideo || !bestAudio || bestVideo.height <= 0) return undefined;
  return build(bestVideo, bestAudio);
}


const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function decode(raw: string) {
  let s = raw.replace(/\\\//g, "/").replace(/\\u0025/g, "%");
  s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
  try {
    s = decodeURIComponent(s.replace(/&amp;/g, "&"));
  } catch {
    s = s.replace(/&amp;/g, "&");
  }
  s = s
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return s;
}

function firstMatch(html: string, patterns: RegExp[]) {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decode(m[1]);
  }
  return undefined;
}

async function fetchHtml(url: string, mobile: boolean, redirects = 0): Promise<string> {
  if (!isFacebookPageUrl(new URL(url)) || redirects > 5) throw new Error("Unsupported Facebook redirect.");
  const res = await fetch(url, {
    headers: {
      "user-agent": mobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
        : UA,
      "accept-language": "en-US,en;q=0.9",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "upgrade-insecure-requests": "1",
    },
    redirect: "manual",
  });
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) throw new Error("Missing Facebook redirect.");
    return fetchHtml(new URL(location, url).href, mobile, redirects + 1);
  }
  return await res.text();
}

function parse(html: string): FbResult {
  const hd = firstMatch(html, [
    /"browser_native_hd_url":"([^"]+)"/,
    /"playable_url_quality_hd":"([^"]+)"/,
    /hd_src_no_ratelimit:"([^"]+)"/,
    /hd_src:"([^"]+)"/,
    /"hd_src":"([^"]+)"/,
  ]);
  const sd = firstMatch(html, [
    /"browser_native_sd_url":"([^"]+)"/,
    /"playable_url":"([^"]+)"/,
    /sd_src_no_ratelimit:"([^"]+)"/,
    /sd_src:"([^"]+)"/,
    /"sd_src":"([^"]+)"/,
  ]);
  const thumbnail = firstMatch(html, [
    /"preferred_thumbnail":\{"image":\{"uri":"([^"]+)"/,
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
    /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/,
    /"thumbnailUrl":"([^"]+)"/,
    /"thumbnailImage":\{"uri":"([^"]+)"/,
    /"image":\{"uri":"([^"]+)"/,
  ]);
  const title =
    firstMatch(html, [
      /<meta property="og:title" content="([^"]+)"/,
      /<title[^>]*>([^<]+)<\/title>/,
    ]) ?? "Facebook video";

  const links: FbResult["links"] = [];
  if (hd?.startsWith("http")) links.push({ quality: "HD", url: hd });
  if (sd?.startsWith("http") && sd !== hd)
    links.push({ quality: "SD", url: sd });

  if (!links.length)
    return {
      ok: false,
      links: [],
      error:
        "No video was found at this link. The video must be public; private or login-only videos are not supported.",
    };

  const render =
    parseDash(html) ??
    parseDash(html.replace(/\\"/g, '"').replace(/\\\//g, "/")) ??
    parseRepresentations(html);

  return { ok: true, title, thumbnail, links, render, fullHd: findFullHdSource(html) };
}

async function headSize(url: string): Promise<number | undefined> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "user-agent": UA, referer: "https://www.facebook.com/" },
      redirect: "follow",
    });
    const len = Number(res.headers.get("content-length"));
    return Number.isFinite(len) && len > 0 ? len : undefined;
  } catch {
    return undefined;
  }
}

/** Reels, share and watch links all carry a numeric video id somewhere. */
function videoId(url: string, html?: string): string | undefined {
  const fromUrl =
    url.match(/\/reel\/(\d{6,})/)?.[1] ??
    url.match(/\/videos\/(?:[^/]+\/)?(\d{6,})/)?.[1] ??
    url.match(/[?&]v=(\d{6,})/)?.[1];
  if (fromUrl) return fromUrl;
  if (!html) return undefined;
  return (
    html.match(/"video_id"\s*:\s*"(\d{6,})"/)?.[1] ??
    html.match(/<meta[^>]+property="og:url"[^>]+content="[^"]*?(\d{8,})/)?.[1] ??
    html.match(/\/reel\/(\d{6,})/)?.[1]
  );
}

/** Extra page variants that usually expose the DASH streams for reels. */
function renderVariants(id: string) {
  return [
    { url: `https://www.facebook.com/watch/?v=${id}`, mobile: false },
    { url: `https://www.facebook.com/video.php?v=${id}`, mobile: false },
    { url: `https://m.facebook.com/watch/?v=${id}`, mobile: true },
  ];
}

export const fetchFbVideo = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => facebookRequestSchema.parse(input))
  .handler(async ({ data }): Promise<FbResult> => {
    const id = videoId(data.url);
    const variants = [
      { url: data.url, mobile: false },
      { url: data.url.replace("www.facebook.com", "m.facebook.com"), mobile: true },
      { url: data.url, mobile: true },
      ...(id ? renderVariants(id) : []),
    ];
    let last: FbResult = { ok: false, links: [], error: "Video not found." };
    for (const v of variants) {
      try {
        const html = await fetchHtml(v.url, v.mobile);
        const parsed = parse(html);
        if (parsed.ok) {
          // Reels often render only the plain HD/SD streams; the watch page for
          // the same video id still carries the high-res DASH representations.
          if (!parsed.render || !parsed.fullHd) {
            const rid = id ?? videoId(v.url, html);
            const rv = rid ? renderVariants(rid)[0] : undefined;
            if (rv && rv.url !== v.url) {
              try {
                const alt = parse(await fetchHtml(rv.url, rv.mobile));
                if (alt.render) parsed.render = alt.render;
                if (alt.fullHd) parsed.fullHd = alt.fullHd;
              } catch {
                /* keep the plain HD/SD links */
              }
            }
          }
          const probes: Promise<number | undefined>[] = [
            ...parsed.links.map((l) => headSize(l.url)),
            parsed.render
              ? Promise.all([
                  headSize(parsed.render.video),
                  headSize(parsed.render.audio),
                ]).then(([v, a]) => (v && a ? v + a : (v ?? a)))
              : Promise.resolve(undefined),
          ];
          const sizes = await Promise.all(probes);
          parsed.links.forEach((l, i) => {
            l.size = sizes[i];
          });
          if (parsed.render)
            parsed.render.size = sizes[sizes.length - 1] ?? undefined;
          if (parsed.fullHd) {
            const [videoSize, audioSize] = await Promise.all([headSize(parsed.fullHd.video), headSize(parsed.fullHd.audio)]);
            parsed.fullHd.size = videoSize && audioSize ? videoSize + audioSize : undefined;
          }
          return parsed;
        }
        last = parsed;
      } catch (e) {
        last = { ok: false, links: [], error: "Unable to retrieve the video. Please check the public Facebook link and try again." };
      }
    }
    try {
      const { extractGenDownload } = await import("./gendownload.server");
      const alternative = await extractGenDownload(data.url);
      return { ok: true, title: alternative.title, thumbnail: alternative.thumbnail, links: alternative.formats.filter(format => format.ext === "mp4").map(format => ({ quality: format.label, url: format.url, size: format.size || undefined })) };
    } catch { return last; }
  });
