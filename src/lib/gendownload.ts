import { z } from "zod";

export function isGenDownloadMediaUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    if (["gendownload.com", "dl.gendownload.com", "www.gendownload.com"].includes(url.hostname)) return url.pathname === "/api/stream" && Boolean(url.searchParams.get("t")) && /^\d+$/.test(url.searchParams.get("i") || "");
    return /(^|\.)(douyinvod\.com|douyinpic\.com|douyincdn\.com|byteimg\.com|ibytedtos\.com|pstatp\.com|twimg\.com|cdninstagram\.com|instagram\.com|fbcdn\.net|fbsbx\.com|tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com|tikwm\.com)$/.test(url.hostname);
  } catch { return false; }
}
const genFormatSchema = z.object({ label: z.string(), type: z.string(), ext: z.string(), filesize: z.number().nonnegative().nullish(), url: z.string() });
export const genResponseSchema = z.object({ title: z.string().nullish(), thumbnail: z.string().nullish(), author: z.string().nullish(), formats: z.array(genFormatSchema) });
export type GenVideo = { title: string; thumbnail: string; author: string; formats: { label: string; ext: string; size: number; url: string }[] };
export function normalizeGenVideo(body: unknown): GenVideo {
  const result = genResponseSchema.parse(body);
  const formats = result.formats.filter(format => format.type === "video" && ["mp4", "webm", "mov"].includes(format.ext.toLowerCase()) && isGenDownloadMediaUrl(format.url)).map(format => ({ label: format.label, ext: format.ext.toLowerCase(), size: format.filesize || 0, url: format.url }));
  if (!formats.length) throw new Error("No downloadable video was found. The post must be public and contain a video.");
  return { title: result.title || "Video", author: result.author || "", thumbnail: result.thumbnail && isGenDownloadMediaUrl(result.thumbnail) ? result.thumbnail : "", formats };
}