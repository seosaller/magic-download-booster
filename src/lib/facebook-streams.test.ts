import { expect, test } from "bun:test";
import { facebookStreams, nativeQuality } from "./facebook-streams";
test("portrait 1216×1824 is not advertised as 2K", () => {
  expect(nativeQuality(1216, 1824)).toBe("1216p");
  expect(nativeQuality(0, 1824)).toBe("1824p");
});
test("genuine landscape and portrait 2K require a 1440 short edge", () => {
  expect(nativeQuality(2560, 1440)).toBe("2K");
  expect(nativeQuality(1440, 2560)).toBe("2K");
  expect(nativeQuality(1439, 2560)).not.toBe("2K");
});
test("keeps both native 2K and 4K using inherited DASH MIME and original audio", () => {
  const xml = '<MPD><AdaptationSet mimeType="video/mp4"><Representation width="2560" height="1440" bandwidth="100"><BaseURL>https://video.fbcdn.net/2k</BaseURL></Representation><Representation width="3840" height="2160" bandwidth="200"><BaseURL>https://video.fbcdn.net/4k</BaseURL></Representation></AdaptationSet><AdaptationSet mimeType="audio/mp4"><Representation bandwidth="128000"><BaseURL>https://video.fbcdn.net/speech-music</BaseURL></Representation></AdaptationSet></MPD>';
  const sources = facebookStreams(JSON.stringify({ dash_manifest: xml }));
  expect(sources.map(s => s.label)).toEqual(["4K", "2K"]);
  expect(sources.every(s => s.audio === "https://video.fbcdn.net/speech-music")).toBe(true);
});
test("JSON representations never borrow dimensions from neighboring items", () => {
  const sources = facebookStreams(JSON.stringify([{ representation_id: "v", base_url: "https://video.fbcdn.net/v", mime_type: "video/mp4" }, { representation_id: "a", base_url: "https://video.fbcdn.net/a", mime_type: "audio/mp4", height: 1440 }]));
  expect(sources).toEqual([]);
});
test("never mixes a requested video's streams with recommendation manifests", () => {
  const manifest = (video: string, audio: string, rate: number) => JSON.stringify({ dash_manifest: `<MPD><AdaptationSet mimeType="video/mp4"><Representation width="2560" height="1440"><BaseURL>https://video.fbcdn.net/${video}</BaseURL></Representation></AdaptationSet><AdaptationSet mimeType="audio/mp4"><Representation bandwidth="${rate}"><BaseURL>https://video.fbcdn.net/${audio}</BaseURL></Representation></AdaptationSet></MPD>` });
  const sources = facebookStreams(manifest("requested", "complete-audio", 64000) + manifest("recommendation", "wrong-short-audio", 128000));
  expect(sources).toHaveLength(1);
  expect(sources[0]?.audio).toBe("https://video.fbcdn.net/complete-audio");
  expect(sources[0]?.video).toBe("https://video.fbcdn.net/requested");
});