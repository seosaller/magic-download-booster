import { afterEach, expect, it } from "bun:test";
import { getTikwmVideo as getTikTokVideo } from "./tiktok.server";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

it("resolves a public video when Tikwm returns images: null", async () => {
  globalThis.fetch = Object.assign(async () => Response.json({
    code: 0,
    data: {
      id: "7699541575289834759",
      title: "",
      images: null,
      play: "https://v19.tiktokcdn-us.com/video.mp4",
      size: 2029858,
    },
  }), { preconnect: originalFetch.preconnect });
  const result = await getTikTokVideo("https://www.tiktok.com/@mahimalik6958/video/7699541575289834759");
  expect(result.video.id).toBe("7699541575289834759");
  expect(result.play).toBe("https://v19.tiktokcdn-us.com/video.mp4");
});

it("still rejects photo posts with a nonempty images array", async () => {
  globalThis.fetch = Object.assign(async () => Response.json({
    code: 0,
    data: {
      id: "7699541575289834760",
      images: ["https://www.tikwm.com/photo.jpg"],
      play: "https://v19.tiktokcdn-us.com/video.mp4",
    },
  }), { preconnect: originalFetch.preconnect });
  await expect(getTikTokVideo("https://www.tiktok.com/@name/video/7699541575289834760")).rejects.toThrow("Photo posts");
});