import { afterEach, expect, it } from "bun:test";
import { getTikwmVideo as getTikTokVideo } from "./tiktok.server";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

it("waits and retries when Tikwm returns its 1 request/second limit", async () => {
  let calls = 0;
  globalThis.fetch = Object.assign(async () => {
    calls++;
    if (calls === 1) return Response.json({ code: -1, msg: "Free Api Limit: 1 request/second." });
    return Response.json({ code: 0, data: { id: "7696938240703483157", title: "ok", images: null, play: "https://v19.tiktokcdn-us.com/video.mp4" } });
  }, { preconnect: originalFetch.preconnect });
  const result = await getTikTokVideo("https://www.tiktok.com/@aliyar.6516/video/7696938240703483157?is_from_webapp=1&sender_device=pc");
  expect(calls).toBe(2);
  expect(result.video.id).toBe("7696938240703483157");
});
