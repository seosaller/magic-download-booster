import { expect, it } from "bun:test";
import { shortVideoLinkSchema, isShortVideoMediaUrl } from "./tiktok";
import { downloadPlatform } from "./douyin";
import { normalizeKuaishou } from "./kuaishou.server";
it("accepts the user's Kuaishou share link in the existing downloader", () => {
  expect(shortVideoLinkSchema.parse("https://v.kuaishou.com/KSpsbe22")).toBe("https://v.kuaishou.com/KSpsbe22");
  expect(downloadPlatform("https://v.kuaishou.com/KSpsbe22")).toBe("kuaishou");
});
it("accepts canonical Kuaishou video IDs and rejects profiles and spoofed hosts", () => {
  expect(shortVideoLinkSchema.safeParse("https://www.kuaishou.com/short-video/3xgyv3aztvnf3km").success).toBe(true);
  for (const url of ["https://v.kuaishou.com.evil.test/KSpsbe22", "http://v.kuaishou.com/KSpsbe22", "https://www.kuaishou.com/profile/123", "https://user@v.kuaishou.com/KSpsbe22"]) expect(shortVideoLinkSchema.safeParse(url).success).toBe(false);
});
it("keeps Kuaishou media separate from TikTok and arbitrary URLs", () => {
  expect(isShortVideoMediaUrl("https://txmov2.a.kwimgs.com/video.mp4", "kuaishou")).toBe(true);
  expect(isShortVideoMediaUrl("https://p4.a.yximgs.com/cover.jpg", "kuaishou")).toBe(true);
  expect(isShortVideoMediaUrl("https://kwimgs.com.evil.test/video.mp4", "kuaishou")).toBe(false);
  expect(isShortVideoMediaUrl("https://www.tikwm.com/video.mp4", "kuaishou")).toBe(false);
});
it("preserves the supplied video's ID and playable audio/video source", () => {
  const play = "https://txmov2.a.kwimgs.com/video.mp4?clientCacheKey=3xgyv3aztvnf3km_b.mp4";
  const result = normalizeKuaishou({ code: 200, data: { url: play } });
  expect(result.video.id).toBe("3xgyv3aztvnf3km");
  expect(result.video.platform).toBe("kuaishou");
  expect(result.play).toBe(play);
  expect(() => normalizeKuaishou({ code: 200, data: { url: "https://evil.test/video.mp4" } })).toThrow();
});