import { expect, it } from "bun:test";
import { visibleDownloadLinks, visibleNativeSources } from "./facebook-download-options";

it("removes landscape and portrait 1080p while preserving higher native qualities", () => {
  const sources = [
    { label: "1080p", width: 1920, height: 1080, video: "landscape", audio: "audio" },
    { label: "1080p", width: 1080, height: 1620, video: "portrait", audio: "audio" },
    { label: "1216p", width: 1216, height: 1824, video: "higher", audio: "audio" },
    { label: "2K", width: 2560, height: 1440, video: "2k", audio: "audio" },
    { label: "4K", width: 2160, height: 3840, video: "4k", audio: "audio" },
  ];
  expect(visibleNativeSources(sources).map(source => source.video)).toEqual(["higher", "2k", "4k"]);
});

it("hides direct 1080p choices without removing 2K, HD, or SD", () => {
  const links = ["HD", "SD", "1080p", "1080P (1080×1920)", "Full HD", "2K"].map(quality => ({ quality, url: quality }));
  expect(visibleDownloadLinks(links).map(link => link.quality)).toEqual(["HD", "SD", "2K"]);
});

it("hides native choices explicitly labeled 1080p and retains portrait 2K", () => {
  const sources = [
    { label: "1080p", width: 1920, height: 1440, video: "1080", audio: "audio" },
    { label: "2K", width: 1440, height: 2560, video: "2k", audio: "audio" },
  ];
  expect(visibleNativeSources(sources).map(source => source.video)).toEqual(["2k"]);
});
it("offers native Full HD 1080p only when no 2K exists", async () => {
  const { fullHdReplacement } = await import("./facebook-download-options");
  const fhd = { label: "1080p", width: 1080, height: 1920, video: "fhd", audio: "a" };
  expect(fullHdReplacement([fhd], [])?.kind).toBe("native");
  expect(fullHdReplacement([fhd, { label: "2K", width: 1440, height: 2560, video: "2k", audio: "a" }], [])).toBeUndefined();
  expect(fullHdReplacement([], [{ quality: "1080p" }])).toEqual({ kind: "link", link: { quality: "1080p" } });
  expect(fullHdReplacement([{ label: "720p", width: 720, height: 1280, video: "hd", audio: "a" }], [{ quality: "HD" }])).toBeUndefined();
});
