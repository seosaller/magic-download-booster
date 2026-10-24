/// <reference types="bun" />
import { expect, test } from "bun:test";
import { assertLocalVideoSize, MAX_LOCAL_VIDEO_BYTES, videoMergeArgs } from "./video-merge";

test("free merging preserves native 2K/4K video without upscaling or re-encoding", () => {
  const args = videoMergeArgs();
  expect(args.slice(args.indexOf("-c"), args.indexOf("-c") + 2)).toEqual(["-c", "copy"]);
  expect(args).not.toContain("-vf");
});
test("free merging includes the original audio alongside the video", () => {
  expect(videoMergeArgs().filter((_, i, args) => args[i - 1] === "-map")).toEqual(["0:v:0", "1:a:0"]);
});
test("browser processing rejects oversized media", () => {
  expect(MAX_LOCAL_VIDEO_BYTES).toBe(268435456);
  expect(() => assertLocalVideoSize(MAX_LOCAL_VIDEO_BYTES)).not.toThrow();
  expect(() => assertLocalVideoSize(MAX_LOCAL_VIDEO_BYTES + 1)).toThrow();
});