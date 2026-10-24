/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { isFacebookMediaUrl, mp3Job, mp3Source, parseMp3Bitrate } from "./mp3";

describe("MP3 downloads", () => {
  test("defaults to actual 320 kbps MP3 encoding", () => {
    expect(parseMp3Bitrate(undefined)).toBe(320);
    expect(mp3Job("https://video.fbcdn.net/audio").tasks["convert-audio"].audio_bitrate).toBe(320);
  });
  test("supports only 320 kbps and rejects other qualities", () => {
    expect(parseMp3Bitrate(320)).toBe(320);
    expect(mp3Job("https://video.fbcdn.net/audio", 320).tasks["convert-audio"].audio_bitrate).toBe(320);
    for (const bitrate of [128, 192, 999]) expect(() => parseMp3Bitrate(bitrate)).toThrow();
  });
  test("keeps the original audio stream including speech and music", () => {
    expect(mp3Source({ ok: true, links: [{ quality: "SD", url: "video" }], render: { label: "2K", height: 1440, video: "hq", audio: "original-audio" } })).toBe("original-audio");
  });
  test("uses the playable video when separate audio is unavailable", () => {
    expect(mp3Source({ ok: true, links: [{ quality: "HD", url: "hd" }, { quality: "SD", url: "sd-with-sound" }] })).toBe("sd-with-sound");
    expect(mp3Source({ ok: true, links: [{ quality: "HD", url: "hd-with-sound" }] })).toBe("hd-with-sound");
  });
  test("converts to actual MP3 instead of renaming MP4", () => {
    const job = mp3Job("https://video.fbcdn.net/audio");
    expect(job.tasks["convert-audio"].operation).toBe("convert");
    expect(job.tasks["convert-audio"].output_format).toBe("mp3");
    expect(job.tasks.export.input).toBe("convert-audio");
    expect(job.tasks.export.inline).toBe(false);
  });
  test("only accepts secure Facebook media hosts", () => {
    expect(isFacebookMediaUrl("https://video.fbcdn.net/audio")).toBe(true);
    for (const url of ["https://evilfbcdn.net/a", "http://video.fbcdn.net/a", "https://facebook.com.evil.org/a", "https://user:pass@video.fbcdn.net/a"]) expect(isFacebookMediaUrl(url)).toBe(false);
  });
});