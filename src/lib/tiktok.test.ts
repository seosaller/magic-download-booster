import { describe, expect, it } from "bun:test";
import { isTikTokMediaUrl, tiktokLinkSchema } from "./tiktok";
describe("TikTok links", () => {
  it("supports public videos and Share short links", () => {
    for (const url of ["https://www.tiktok.com/@scout2015/video/6718335390845095173", "https://vm.tiktok.com/ZM123abc/", "https://vt.tiktok.com/ZM123abc/", "https://www.tiktok.com/t/ZM123abc/"]) expect(tiktokLinkSchema.safeParse(url).success).toBe(true);
  });
  it("rejects profiles, LIVE and photo posts", () => {
    for (const url of ["https://www.tiktok.com/@name", "https://www.tiktok.com/@name/live", "https://www.tiktok.com/@name/photo/123"]) expect(tiktokLinkSchema.safeParse(url).success).toBe(false);
  });
  it("rejects other hosts, insecure URLs, credentials and ports", () => {
    for (const url of ["https://tiktok.com.evil.test/@name/video/123", "http://www.tiktok.com/@name/video/123", "https://user@www.tiktok.com/@name/video/123", "https://www.tiktok.com:444/@name/video/123", "not a link"]) expect(tiktokLinkSchema.safeParse(url).success).toBe(false);
  });
  it("restricts media requests to secure approved CDNs", () => {
    expect(isTikTokMediaUrl("https://v19.tiktokcdn-us.com/file.mp4")).toBe(true);
    expect(isTikTokMediaUrl("https://www.tikwm.com/video/file.mp4")).toBe(true);
    expect(isTikTokMediaUrl("https://tiktokcdn-us.com.evil.test/file.mp4")).toBe(false);
    expect(isTikTokMediaUrl("http://127.0.0.1/file.mp4")).toBe(false);
  });
});