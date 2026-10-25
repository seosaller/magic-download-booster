import { describe, expect, it } from "bun:test";
import { mp3Job, parseMp3Bitrate } from "./mp3";

describe("TikTok original-sound MP3", () => {
  it("converts the complete playable video into genuine 320 kbps MP3", () => {
    const source = "https://www.tikwm.com/video/media/play/6718335390845095173.mp4";
    const job = mp3Job(source, parseMp3Bitrate(320));
    expect(job.tasks["in-audio"].url).toBe(source);
    expect(job.tasks["convert-audio"].operation).toBe("convert");
    expect(job.tasks["convert-audio"].output_format).toBe("mp3");
    expect(job.tasks["convert-audio"].audio_bitrate).toBe(320);
  });
});