import { z } from "zod";
import { isShortVideoMediaUrl, shortVideoLinkSchema, type TikTokVideo } from "./tiktok";
import { downloadPlatform, douyinLinkSchema } from "./douyin";

const mediaSchema = z.object({ url: z.string(), size_bytes: z.number().nonnegative().nullish(), watermark: z.boolean().nullish() });
const videoSchema = z.object({
  kind: z.literal("video"), platform: z.enum(["tiktok", "douyin"]), content_id: z.string().regex(/^\d{10,25}$/),
  title: z.string().nullish(), description: z.string().nullish(), is_private: z.boolean().optional(), is_deleted: z.boolean().optional(),
  author: z.object({ nickname: z.string().nullish() }).nullish(),
  media: z.object({ video: mediaSchema, covers: z.array(z.object({ url: z.string() })).nullish(), streams: z.array(mediaSchema).nullish() }),
});
const envelopeSchema = z.object({ success: z.boolean(), data: z.unknown(), error: z.object({ code: z.string(), message: z.string() }).nullish() });
const taskSchema = z.object({ task_id: z.string().uuid(), state: z.string(), data: z.unknown().optional(), error: z.object({ code: z.string(), message: z.string() }).nullish() });

export function normalizeEvil0ctalVideo(input: unknown) {
  const data = videoSchema.parse(input);
  if (data.is_private || data.is_deleted || !isShortVideoMediaUrl(data.media.video.url, data.platform)) throw new Error("This post is not a supported public video.");
  const watermark = data.media.streams?.find(stream => stream.watermark === true && isShortVideoMediaUrl(stream.url, data.platform));
  const video: TikTokVideo = {
    id: data.content_id, platform: data.platform, title: data.title || data.description || "Video", author: data.author?.nickname || "",
    cover: data.media.covers?.find(cover => isShortVideoMediaUrl(cover.url, data.platform))?.url || "",
    size: data.media.video.size_bytes || 0, watermarkSize: watermark?.size_bytes || 0, watermark: Boolean(watermark),
  };
  return { video, play: data.media.video.url, wmplay: watermark?.url };
}

export async function resolveEvil0ctalVideo(url: string, credentials: { appKey: string; connectionKey: string }) {
  const checked = shortVideoLinkSchema.parse(url);
  const validated = downloadPlatform(checked) === "douyin" ? douyinLinkSchema.parse(checked) : checked;
  const platform = downloadPlatform(validated);
  const base = "https://connector-gateway.lovable.dev/udc_evil0ctal_douyin_tiktok_api";
  async function request(path: string) {
    const response = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${credentials.appKey}`, "X-Connection-Api-Key": credentials.connectionKey },
      signal: AbortSignal.timeout(25000),
    });
    const body: unknown = await response.json();
    const parsed = envelopeSchema.safeParse(body);
    if (!response.ok || !parsed.success || !parsed.data.success) {
      const error = parsed.success ? parsed.data.error : undefined;
      console.error("Evil0ctal video request failed", response.status, error?.code, error?.message);
      throw new Error(`TikTok provider request failed [${response.status}]: ${error?.message || "Unexpected provider response."}`);
    }
    return parsed.data.data;
  }
  let data = await request(`/api/v1/${platform}/video?${new URLSearchParams({ url: validated, wait: "15" })}`);
  for (let attempt = 0; attempt < 10; attempt++) {
    const task = taskSchema.safeParse(data);
    if (!task.success) return normalizeEvil0ctalVideo(data);
    if (task.data.state === "failed") throw new Error(task.data.error?.message || "TikTok video lookup failed.");
    if (task.data.state === "done" || task.data.state === "finished" || task.data.state === "succeeded") return normalizeEvil0ctalVideo(task.data.data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    data = await request(`/api/v1/tasks/${task.data.task_id}`);
  }
  throw new Error("TikTok took too long to respond. Please try again.");
}