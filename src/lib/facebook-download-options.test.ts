import { expect, it } from "bun:test";
import { visibleNativeSources } from "./facebook-download-options";

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