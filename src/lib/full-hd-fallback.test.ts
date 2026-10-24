import { expect, it } from "bun:test";
import { fullHdFallback } from "./full-hd-fallback";

it("uses the existing HD file when native 1080p is missing", () => {
  expect(fullHdFallback(undefined, [{ quality: "SD", url: "sd" }, { quality: "HD", url: "original-hd", size: 12500000 }])).toEqual({ quality: "HD", url: "original-hd", size: 12500000 });
});
it("keeps native 1080p instead of replacing it with HD", () => {
  expect(fullHdFallback({ label: "1080p", height: 1080, video: "native-video", audio: "original-audio" }, [{ quality: "HD", url: "hd" }])).toBeUndefined();
});
it("does not claim an HD fallback when only SD exists", () => {
  expect(fullHdFallback(undefined, [{ quality: "SD", url: "sd" }])).toBeUndefined();
});