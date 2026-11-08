import { expect, it } from "bun:test";
import { validSocialLink } from "./social";

it("accepts Douyin video, share and modal links", () => {
  expect(validSocialLink("https://www.douyin.com/jingxuan?modal_id=7668653276732198194", "douyin")).toBe(true);
  expect(validSocialLink("https://v.douyin.com/abc123/", "douyin")).toBe(true);
  expect(validSocialLink("https://www.douyin.com/video/7668653276732198194", "douyin")).toBe(true);
});
it("accepts Twitter and X video post links", () => {
  expect(validSocialLink("https://x.com/user/status/1234567890123456789", "twitter")).toBe(true);
  expect(validSocialLink("https://twitter.com/user/status/1234567890123456789/video/1", "twitter")).toBe(true);
});
it("accepts Threads posts on both official domains", () => {
  expect(validSocialLink("https://www.threads.net/@user/post/ABC-123", "threads")).toBe(true);
  expect(validSocialLink("https://www.threads.com/@user/post/ABC-123", "threads")).toBe(true);
});
it("accepts the supplied Threads share link on official domains", () => {
  expect(validSocialLink("https://www.threads.com/share/GiR_Jpr1K", "threads")).toBe(true);
  expect(validSocialLink("https://www.threads.net/share/GiR_Jpr1K/", "threads")).toBe(true);
  expect(validSocialLink("https://www.threads.com.evil.example/share/GiR_Jpr1K", "threads")).toBe(false);
  expect(validSocialLink("https://www.threads.com/share/", "threads")).toBe(false);
});
it("rejects other platforms, credentials, insecure links and profiles", () => {
  expect(validSocialLink("https://x.com.evil.example/user/status/1234", "twitter")).toBe(false);
  expect(validSocialLink("https://user:pass@x.com/user/status/1234", "twitter")).toBe(false);
  expect(validSocialLink("http://x.com/user/status/1234", "twitter")).toBe(false);
  expect(validSocialLink("https://www.threads.net/@user", "threads")).toBe(false);
  expect(validSocialLink("https://v.kuaishou.com/KSpsbe22", "douyin")).toBe(false);
});