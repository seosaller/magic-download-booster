import { expect, it } from "bun:test";
import { douyinLinkSchema, downloadPlatform, isDouyinMediaUrl } from "./douyin";
import { shortVideoLinkSchema } from "./tiktok";
import { normalizeEvil0ctalVideo } from "./evil0ctal.server";
it("accepts Douyin short and direct video links in the existing TikTok flow", () => {
  for (const url of ["https://v.douyin.com/L4NpDJ6/", "https://www.douyin.com/video/7126745726494821640", "https://www.iesdouyin.com/share/video/7126745726494821640/"]) {
    expect(douyinLinkSchema.safeParse(url).success).toBe(true);
    expect(shortVideoLinkSchema.safeParse(url).success).toBe(true);
    expect(downloadPlatform(url)).toBe("douyin");
  }
});
it("rejects unsupported posts and insecure or lookalike Douyin links", () => {
  for (const url of ["https://www.douyin.com/user/123", "https://live.douyin.com/123", "https://www.douyin.com/note/123", "http://v.douyin.com/test/", "https://v.douyin.com.evil.test/test/", "https://user@v.douyin.com/test/"]) expect(douyinLinkSchema.safeParse(url).success).toBe(false);
});
it("normalizes Douyin sources while retaining the platform and actual size", () => {
  const result = normalizeEvil0ctalVideo({ kind: "video", platform: "douyin", content_id: "7126745726494821640", media: { video: { url: "https://v5-dy-ov-experiment.zjcdn.com/video.mp4", size_bytes: 1454940 }, covers: [{ url: "https://p3-pc-sign.douyinpic.com/cover.jpeg" }] } });
  expect(result.video.platform).toBe("douyin");
  expect(result.video.size).toBe(1454940);
  expect(result.play).toBe("https://v5-dy-ov-experiment.zjcdn.com/video.mp4");
});
it("restricts Douyin media to approved secure CDNs", () => {
  expect(isDouyinMediaUrl("https://v3-dy-o.zjcdn.com/video.mp4")).toBe(true);
  expect(isDouyinMediaUrl("https://p3-pc-sign.douyinpic.com/cover.jpeg")).toBe(true);
  expect(isDouyinMediaUrl("https://zjcdn.com.evil.test/video.mp4")).toBe(false);
  expect(isDouyinMediaUrl("https://www.douyin.com/user/123")).toBe(false);
});