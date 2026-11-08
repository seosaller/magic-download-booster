import { afterEach, expect, it } from "bun:test";
import { isGenDownloadMediaUrl, normalizeGenVideo } from "./gendownload";
import { getTikTokVideo } from "./tiktok.server";
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

it("keeps original playable video instead of music-only audio", () => {
  const video = normalizeGenVideo({ title: "Clip", formats: [{ type: "video", label: "720p", ext: "mp4", filesize: 2029858, url: "https://gendownload.com/api/stream?t=abc&i=0" }, { type: "audio", label: "Audio", ext: "m4a", url: "https://gendownload.com/api/stream?t=abc&i=1" }] });
  expect(video.formats).toHaveLength(1);
  expect(video.formats[0]?.size).toBe(2029858);
  expect(video.formats[0]?.label).toBe("720p");
});
it("rejects arbitrary outbound addresses and fake GenDownload domains", () => {
  expect(isGenDownloadMediaUrl("https://127.0.0.1/video.mp4")).toBe(false);
  expect(isGenDownloadMediaUrl("https://gendownload.com.evil.example/api/stream?t=x&i=0")).toBe(false);
  expect(isGenDownloadMediaUrl("https://gendownload.com/api/extract")).toBe(false);
  expect(isGenDownloadMediaUrl("https://dl.gendownload.com/api/stream?t=x&i=0")).toBe(true);
});
it("uses GenDownload as the alternative when Tikwm cannot resolve", async () => {
  let calls = 0;
  globalThis.fetch = Object.assign(async (input: string | URL | Request) => {
    calls++;
    if (String(input).includes("tikwm.com")) return new Response("Unavailable", { status: 503 });
    return Response.json({ title: "Alternative", formats: [{ type: "video", ext: "mp4", label: "720p", filesize: 2004627, url: "https://dl.gendownload.com/api/stream?t=test&i=0" }] });
  }, { preconnect: originalFetch.preconnect });
  const result = await getTikTokVideo("https://www.tiktok.com/@user/video/7000000000000000999");
  expect(result.video.size).toBe(2004627);
  expect(result.play).toBe("https://dl.gendownload.com/api/stream?t=test&i=0");
  expect(calls).toBe(2);
});