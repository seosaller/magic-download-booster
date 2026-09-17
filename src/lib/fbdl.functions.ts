import { createServerFn } from "@tanstack/react-start";

export type FbResult = {
  ok: boolean;
  error?: string | undefined;
  title?: string | undefined;
  thumbnail?: string | undefined;
  links: { quality: string; url: string }[];
  render?:
    | { label: string; height: number; video: string; audio: string }
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
  const h = bestVideo.height;
  const label =
    h >= 2000 ? "4K" : h >= 1300 ? "2K" : h >= 1000 ? "1080p" : `${h}p`;
  return { label, height: h, video: bestVideo.url, audio: bestAudio.url };
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

async function fetchHtml(url: string, mobile: boolean) {
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
    redirect: "follow",
  });
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
        "Is link se video nahi mili. Video public honi chahiye (private ya login-only videos support nahi).",
    };

  return { ok: true, title, thumbnail, links, render: parseDash(html) };
}

export const fetchFbVideo = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    const url = String(input?.url ?? "").trim();
    if (!/^https?:\/\/([\w-]+\.)*(facebook\.com|fb\.watch|fb\.me)\//i.test(url))
      throw new Error("Please paste a valid Facebook video URL.");
    return { url };
  })
  .handler(async ({ data }): Promise<FbResult> => {
    const variants = [
      { url: data.url, mobile: false },
      { url: data.url.replace("www.facebook.com", "m.facebook.com"), mobile: true },
      { url: data.url, mobile: true },
    ];
    let last: FbResult = { ok: false, links: [], error: "Video not found." };
    for (const v of variants) {
      try {
        const html = await fetchHtml(v.url, v.mobile);
        const parsed = parse(html);
        if (parsed.ok) return parsed;
        last = parsed;
      } catch (e) {
        last = { ok: false, links: [], error: (e as Error).message };
      }
    }
    return last;
  });
