import { isTikTokMediaUrl, type TikTokVideo } from "./tiktok";
import { z } from "zod";

const responseSchema = z.object({ code: z.number(), data: z.object({ id: z.string(), title: z.string().optional(), cover: z.string().optional(), play: z.string().optional(), wmplay: z.string().optional(), size: z.number().optional(), wm_size: z.number().optional(), images: z.array(z.string()).nullish(), author: z.object({ nickname: z.string().optional() }).optional() }).optional() });
type ResolvedVideo = { video: TikTokVideo; play: string; wmplay: string | undefined };
const resolvedVideos = new Map<string, { expires: number; result: ResolvedVideo }>();
export async function getTikTokVideo(url: string) {
  const id = /\/video\/(\d+)/.exec(url)?.[1];
  const cached = resolvedVideos.get(id || url);
  if (cached && cached.expires > Date.now()) return cached.result;
  const response = await fetch("https://www.tikwm.com/api/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ url }), signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(response.status === 429 ? "TikTok downloads are busy. Please wait a moment and try again." : "The TikTok download service is temporarily unavailable. Please try again.");
  const parsed = responseSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.code !== 0 || !parsed.data.data) throw new Error("This video could not be retrieved. Check that it is public and still available on TikTok.");
  const data = parsed.data.data;
  if (data.images?.length || !data.play || !isTikTokMediaUrl(data.play)) throw new Error("This post is not a supported public TikTok video. Photo posts and LIVE streams cannot be downloaded.");
  const video: TikTokVideo = { id: data.id, title: data.title || "TikTok video", author: data.author?.nickname || "", cover: data.cover && isTikTokMediaUrl(data.cover) ? data.cover : "", size: data.size || 0, watermarkSize: data.wm_size || 0, watermark: Boolean(data.wmplay && isTikTokMediaUrl(data.wmplay)) };
  const result = { video, play: data.play, wmplay: data.wmplay && isTikTokMediaUrl(data.wmplay) ? data.wmplay : undefined };
  if (resolvedVideos.size >= 100) { const oldest = resolvedVideos.keys().next().value; if (oldest) resolvedVideos.delete(oldest); }
  resolvedVideos.set(data.id, { expires: Date.now() + 240_000, result });
  return result;
}
export async function pullTikTokMedia(target: string, range: string | null) {
  let url = target;
  for (let redirects = 0; redirects < 5; redirects++) {
    if (!isTikTokMediaUrl(url)) return undefined;
    const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0", Referer: "https://www.tiktok.com/", ...(range ? { Range: range } : {}) }, signal: AbortSignal.timeout(25000) });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return undefined;
      url = new URL(location, url).href;
      continue;
    }
    return response;
  }
  return undefined;
}