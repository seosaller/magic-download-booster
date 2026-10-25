import { z } from "zod";
import { kuaishouIdSchema, kuaishouLinkSchema, isKuaishouMediaUrl } from "./kuaishou";
import type { TikTokVideo } from "./tiktok";
const schema = z.object({ code: z.literal(200), data: z.object({ url: z.string(), cover: z.string().optional(), title: z.string().optional(), author: z.string().optional() }) });
export function normalizeKuaishou(input: unknown) {
  const data = schema.parse(input).data;
  if (!isKuaishouMediaUrl(data.url)) throw new Error("Kuaishou returned an unsupported video source.");
  const key = new URL(data.url).searchParams.get("clientCacheKey") || "";
  const id = kuaishouIdSchema.parse(key.split("_")[0]?.replace(/\.mp4$/, ""));
  const video: TikTokVideo = { id, platform: "kuaishou", title: data.title || "Kuaishou video", author: data.author || "", cover: data.cover && isKuaishouMediaUrl(data.cover) ? data.cover : "", size: 0, watermarkSize: 0, watermark: false };
  return { video, play: data.url, wmplay: undefined };
}
export async function resolveKuaishouVideo(url: string) {
  const link = kuaishouLinkSchema.parse(url);
  const response = await fetch(`https://api.suyanw.cn/api/kuaishou.php?${new URLSearchParams({ url: link })}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error("The Kuaishou download service is temporarily unavailable. Please try again.");
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new Error("This Kuaishou video could not be retrieved. Check that it is public and try its Share link.");
  return normalizeKuaishou(parsed.data);
}