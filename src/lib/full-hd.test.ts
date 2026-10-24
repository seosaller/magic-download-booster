import { describe, expect, it } from "bun:test";
import { findFullHdSource } from "./full-hd";

const jsonSource = (height: number, url: string, mime = "video/mp4") => JSON.stringify({ representation_id: url, mime_type: mime, height, base_url: `https://video.fbcdn.net/${url}`, bandwidth: 1000 });

describe("third 1080p download source", () => {
  it("keeps native 1080p available even when 2K and 4K also exist", () => {
    const source = findFullHdSource([jsonSource(720, "hd"), jsonSource(1080, "full-hd"), jsonSource(1440, "2k"), jsonSource(2160, "4k"), jsonSource(0, "sound", "audio/mp4")].join("\n"));
    expect(source?.height).toBe(1080);
    expect(source?.video).toBe("https://video.fbcdn.net/full-hd");
    expect(source?.audio).toBe("https://video.fbcdn.net/sound");
  });
  it("never relabels 720p or 4K as 1080p", () => {
    expect(findFullHdSource([jsonSource(720, "hd"), jsonSource(2160, "4k"), jsonSource(0, "sound", "audio/mp4")].join("\n"))).toBeUndefined();
  });
  it("uses native DASH 1080p with its original audio", () => {
    const xml = '<MPD><AdaptationSet mimeType="video/mp4"><Representation height="1080" bandwidth="100"><BaseURL>https://video.fbcdn.net/full-hd?x=1&amp;y=2</BaseURL></Representation><Representation height="2160"><BaseURL>https://video.fbcdn.net/4k</BaseURL></Representation></AdaptationSet><AdaptationSet mimeType="audio/mp4"><Representation bandwidth="128"><BaseURL>https://video.fbcdn.net/audio</BaseURL></Representation></AdaptationSet></MPD>';
    expect(findFullHdSource(JSON.stringify({ dash_manifest: xml }))).toEqual({ label: "1080p", height: 1080, video: "https://video.fbcdn.net/full-hd?x=1&y=2", audio: "https://video.fbcdn.net/audio" });
  });
  it("requires original audio rather than offering a silent merged file", () => {
    expect(findFullHdSource(jsonSource(1080, "full-hd"))).toBeUndefined();
  });
});