import { afterEach, expect, it } from "bun:test";
import { normalizeEvil0ctalVideo, resolveEvil0ctalVideo } from "./evil0ctal.server";
import { isTikTokMediaUrl } from "./tiktok";

const fixture = { kind: "video", platform: "tiktok", content_id: "7696938240703483157", title: "Public video", author: { nickname: "Author" }, media: { video: { url: "https://v16-webapp-prime.us.tiktok.com/video/example.mp4", size_bytes: 1606281, watermark: false }, covers: [{ url: "https://p16.tiktokcdn-us.com/cover.jpg" }], streams: [] } };
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

it("normalizes the connected API video and preserves its complete playable source", () => {
  const result = normalizeEvil0ctalVideo(fixture);
  expect(result.play).toBe(fixture.media.video.url);
  expect(result.video.size).toBe(1606281);
  expect(result.video.cover).toBe(fixture.media.covers[0]?.url);
  expect(result.video.watermark).toBe(false);
});
it("accepts the verified TikTok playback host without accepting arbitrary TikTok pages or lookalike hosts", () => {
  expect(isTikTokMediaUrl(fixture.media.video.url)).toBe(true);
  expect(isTikTokMediaUrl("https://www.tiktok.com/@name/video/123")).toBe(false);
  expect(isTikTokMediaUrl("https://v16-webapp-prime.us.tiktok.com.evil.test/video.mp4")).toBe(false);
});
it("polls asynchronous tasks through the connector instead of bypassing it", async () => {
  const paths: string[] = [];
  globalThis.fetch = Object.assign(async (input: RequestInfo | URL) => {
    paths.push(String(input));
    return Response.json({ success: true, data: paths.length === 1 ? { task_id: "724a9932-0395-4e01-8f9e-5a2b446d9e03", state: "running" } : { task_id: "724a9932-0395-4e01-8f9e-5a2b446d9e03", state: "succeeded", data: fixture }, error: null });
  }, { preconnect: originalFetch.preconnect });
  const result = await resolveEvil0ctalVideo("https://www.tiktok.com/@aliyar.6516/video/7696938240703483157", { appKey: "test-only", connectionKey: "test-only" });
  expect(paths).toHaveLength(2);
  expect(paths[0]).toContain("connector-gateway.lovable.dev/udc_evil0ctal_douyin_tiktok_api/api/v1/tiktok/video?");
  expect(paths[1]).toEndWith("/api/v1/tasks/724a9932-0395-4e01-8f9e-5a2b446d9e03");
  expect(result.video.id).toBe("7696938240703483157");
});