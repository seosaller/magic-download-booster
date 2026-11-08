import { expect, it } from "bun:test";
import { isGenDownloadMediaUrl, normalizeGenVideo } from "./gendownload";

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