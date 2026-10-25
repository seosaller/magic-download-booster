import { isTikTokMediaUrl, isShortVideoMediaUrl, shortVideoLinkSchema, type TikTokVideo } from "./tiktok";
import { downloadPlatform, type DownloadPlatform } from "./douyin";
import { z } from "zod";
import { resolveEvil0ctalVideo } from "./evil0ctal.server";
import { resolveKuaishouVideo } from "./kuaishou.server";

const responseSchema = z.object({ code: z.number(), data: z.object({ id: z.string(), title: z.string().optional(), cover: z.string().optional(), play: z.string().optional(), wmplay: z.string().optional(), size: z.number().optional(), wm_size: z.number().optional(), images: z.array(z.string()).nullish(), author: z.object({ nickname: z.string().optional() }).optional() }).optional() });
type ResolvedVideo = { video: TikTokVideo; play: string; wmplay: string | undefined };
const resolvedVideos = new Map<string, { expires: number; result: ResolvedVideo }>();
export async function getTikTokVideo(url: string) {
  url = shortVideoLinkSchema.parse(url);
  const platform = downloadPlatform(url);
  const id = /\/(?:video|short-video)\/([a-zA-Z0-9]+)/.exec(url)?.[1];
  const cached = resolvedVideos.get(platform !== "tiktok" ? `${platform}:${id || url}` : id || url);
  if (cached && cached.expires > Date.now()) return cached.result;
  if (platform === "kuaishou") {
    const result = await resolveKuaishouVideo(url);
    if (resolvedVideos.size >= 100) { const oldest = resolvedVideos.keys().next().value; if (oldest) resolvedVideos.delete(oldest); }
    resolvedVideos.set(`kuaishou:${result.video.id}`, { expires: Date.now() + 240_000, result });
    return result;
  }
  const appKey = process.env['LOVABLE_API_KEY'];
  const connectionKey = process.env['UDC_EVIL0CTAL_DOUYIN_TIKTOK_API_API_KEY'];
  if (appKey && connectionKey) {
    try {
      const result = await resolveEvil0ctalVideo(url, { appKey, connectionKey });
      if (resolvedVideos.size >= 100) { const oldest = resolvedVideos.keys().next().value; if (oldest) resolvedVideos.delete(oldest); }
      const entry = { expires: Date.now() + 240_000, result };
      resolvedVideos.set(platform === "douyin" ? `douyin:${result.video.id}` : result.video.id, entry);
      return result;
    } catch (error) { if (platform === "douyin") throw error; console.warn("Evil0ctal lookup unavailable; trying Tikwm", error instanceof Error ? error.message : "Lookup failed"); }
  }
  if (platform === "douyin") throw new Error("Douyin downloads are temporarily unavailable. Please try again later.");
  return getTikwmVideo(url);
}
export async function getTikwmVideo(url: string) {
  const id = /\/video\/(\d+)/.exec(url)?.[1];
  const cached = resolvedVideos.get(id || url);
  if (cached && cached.expires > Date.now()) return cached.result;
  let parsed: z.SafeParseReturnType<unknown, z.infer<typeof responseSchema>> | undefined;
  let limited = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 1200 * attempt));
    const response = await fetch("https://www.tikwm.com/api/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ url }), signal: AbortSignal.timeout(25000) });
    limited = response.status === 429;
    if (limited) continue;
    if (!response.ok) throw new Error("The TikTok download service is temporarily unavailable. Please try again.");
    const body: unknown = await response.json();
    parsed = responseSchema.safeParse(body);
    limited = typeof body === "object" && body !== null && /limit/i.test(String((body as { msg?: unknown }).msg ?? ""));
    if (!limited) break;
  }
  if (!parsed || limited) throw new Error("TikTok downloads are busy. Please wait a moment and try again.");
  if (!parsed.success || parsed.data.code !== 0 || !parsed.data.data) throw new Error("This video could not be retrieved. Check that it is public and still available on TikTok.");
  const data = parsed.data.data;
  if (data.images?.length || !data.play || !isTikTokMediaUrl(data.play)) throw new Error("This post is not a supported public TikTok video. Photo posts and LIVE streams cannot be downloaded.");
  const video: TikTokVideo = { id: data.id, title: data.title || "TikTok video", author: data.author?.nickname || "", cover: data.cover && isTikTokMediaUrl(data.cover) ? data.cover : "", size: data.size || 0, watermarkSize: data.wm_size || 0, watermark: Boolean(data.wmplay && isTikTokMediaUrl(data.wmplay)) };
  const result = { video, play: data.play, wmplay: data.wmplay && isTikTokMediaUrl(data.wmplay) ? data.wmplay : undefined };
  if (resolvedVideos.size >= 100) { const oldest = resolvedVideos.keys().next().value; if (oldest) resolvedVideos.delete(oldest); }
  resolvedVideos.set(data.id, { expires: Date.now() + 240_000, result });
  return result;
}
export async function pullTikTokMedia(target: string, range: string | null, platform: DownloadPlatform = "tiktok") {
  let url = target;
  for (let redirects = 0; redirects < 5; redirects++) {
    if (!isShortVideoMediaUrl(url, platform)) return undefined;
    const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0", Referer: platform === "kuaishou" ? "https://www.kuaishou.com/" : platform === "douyin" ? "https://www.douyin.com/" : "https://www.tiktok.com/", ...(range ? { Range: range } : {}) }, signal: AbortSignal.timeout(25000) });
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