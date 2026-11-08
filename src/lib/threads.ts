import { z } from "zod";
import { isGenDownloadMediaUrl, type GenVideo } from "./gendownload";

const versions = z.array(z.object({ url: z.string(), width: z.number().optional(), height: z.number().optional() })).nullish();
const mediaSchema = z.object({ pk: z.string().optional(), code: z.string().optional(), video_versions: versions, image_versions2: z.object({ candidates: versions }).nullish() });
const postSchema = mediaSchema.extend({ carousel_media: z.array(mediaSchema).nullish(), caption: z.object({ text: z.string().nullish() }).nullish(), user: z.object({ username: z.string().nullish() }).nullish() });

export function parseThreadsVideos(html: string, shortcode: string): GenVideo[] {
  let post: z.infer<typeof postSchema> | undefined;
  let visited = 0;
  function visit(value: unknown, depth = 0) {
    if (post || depth > 60 || ++visited > 100000 || !value || typeof value !== "object") return;
    if (!Array.isArray(value) && "code" in value && value.code === shortcode) {
      const parsed = postSchema.safeParse(value);
      if (parsed.success) { post = parsed.data; return; }
    }
    for (const child of Object.values(value)) visit(child, depth + 1);
  }
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    if (!match[1]?.includes("video_versions")) continue;
    try { visit(JSON.parse(match[1])); } catch { /* Skip unrelated scripts. */ }
    if (post) break;
  }
  if (!post) return [];
  const found = post as z.infer<typeof postSchema>;
  const items = found.carousel_media?.length ? found.carousel_media : [found];
  const seen = new Set<string>();
  return items.flatMap(item => {
    const candidates = (item.video_versions || []).filter(version => isGenDownloadMediaUrl(version.url)).sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));
    const best = candidates[0];
    if (!best || seen.has(item.pk || best.url)) return [];
    seen.add(item.pk || best.url);
    const thumbnail = item.image_versions2?.candidates?.find(image => isGenDownloadMediaUrl(image.url))?.url || "";
    return [{ title: found.caption?.text || "Threads video", author: found.user?.username || "", thumbnail, formats: [{ label: best.height ? `${best.height}p` : "Video", ext: "mp4", size: 0, url: best.url }] }];
  });
}