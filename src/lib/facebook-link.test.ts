import { describe, expect, it } from "bun:test";
import { facebookLinkSchema, facebookRequestSchema, MAX_FACEBOOK_LINK_LENGTH } from "./facebook-link";

describe("Facebook link validation", () => {
  it("accepts video, Reel and share formats", () => {
    for (const url of ["https://www.facebook.com/watch?v=554413541934974", "https://m.facebook.com/reel/123456789/", "https://facebook.com/example/videos/123456789/", "https://facebook.com/video.php?v=123456789", "https://facebook.com/share/r/ABC123/", "https://facebook.com/share/v/ABC123/", "https://fb.watch/lMDZjV1O0t/", "https://fb.me/ABC123"]) {
      expect(facebookLinkSchema.safeParse(url).success).toBe(true);
    }
  });
  it("rejects malformed or empty links", () => {
    for (const url of ["", "not a link", "facebook.com/reel/123", "javascript:alert(1)", "https://facebook.com/reel/123\nignored"]) expect(facebookLinkSchema.safeParse(url).success).toBe(false);
  });
  it("rejects other sites, deceptive hosts, credentials and ports", () => {
    for (const url of ["https://youtube.com/watch?v=123", "https://facebook.com.evil.test/reel/123", "https://evil.test/?url=https://facebook.com/reel/123", "https://user@facebook.com/reel/123", "https://facebook.com:444/reel/123"]) expect(facebookLinkSchema.safeParse(url).success).toBe(false);
  });
  it("rejects profiles, photos and nonvideo paths", () => {
    for (const url of ["https://facebook.com/", "https://facebook.com/profile.php?id=123", "https://facebook.com/photos/123", "https://facebook.com/watch?v=abc", "https://facebook.com/reel/abc", "https://facebook.com/login"]) expect(facebookLinkSchema.safeParse(url).success).toBe(false);
  });
  it("enforces length and input types at the server boundary", () => {
    expect(facebookRequestSchema.safeParse({ url: 123 }).success).toBe(false);
    expect(facebookRequestSchema.safeParse(null).success).toBe(false);
    expect(facebookLinkSchema.safeParse("https://facebook.com/share/" + "a".repeat(MAX_FACEBOOK_LINK_LENGTH)).success).toBe(false);
  });
  it("trims surrounding clipboard whitespace", () => {
    expect(facebookLinkSchema.parse("  https://facebook.com/reel/123456789/  ")).toBe("https://facebook.com/reel/123456789/");
  });
});