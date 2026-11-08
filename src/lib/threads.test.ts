import { afterEach, expect, it } from "bun:test";
import { resolveThreadsPost } from "./threads.server";
import { parseThreadsVideos } from "./threads";
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

it("resolves the supplied Threads share link to its canonical post before extraction", async () => {
  globalThis.fetch = Object.assign(async () => new Response(null, { status: 302, headers: { location: "https://www.threads.com/@pakdiaries01/post/DfccWTYDHyd?xmt=test" } }), { preconnect: originalFetch.preconnect });
  expect(await resolveThreadsPost("https://www.threads.com/share/GiR_Jpr1K")).toBe("https://www.threads.com/@pakdiaries01/post/DfccWTYDHyd");
});
it("blocks off-platform redirects before fetching them", async () => {
  let calls = 0;
  globalThis.fetch = Object.assign(async () => { calls++; return new Response(null, { status: 302, headers: { location: "https://127.0.0.1/private" } }); }, { preconnect: originalFetch.preconnect });
  await expect(resolveThreadsPost("https://www.threads.com/share/GiR_Jpr1K")).rejects.toThrow("Unsupported Threads redirect");
  expect(calls).toBe(1);
});
it("extracts every video from one post and does not mistake qualities or replies for extra videos", () => {
  const post = { code: "DfccWTYDHyd", caption: { text: "Post" }, carousel_media: [
    { pk: "1", video_versions: [{ url: "https://scontent.cdninstagram.com/one-low.mp4", width: 360, height: 640 }, { url: "https://scontent.cdninstagram.com/one.mp4", width: 720, height: 1280 }] },
    { pk: "photo", video_versions: null },
    { pk: "2", video_versions: [{ url: "https://scontent.cdninstagram.com/two.mp4", width: 720, height: 1280 }] },
    { pk: "3", video_versions: [{ url: "https://scontent.cdninstagram.com/three.mp4", width: 720, height: 1280 }] },
  ], replies: [{ code: "reply", video_versions: [{ url: "https://scontent.cdninstagram.com/reply.mp4" }] }] };
  const videos = parseThreadsVideos(`<script type="application/json">${JSON.stringify({ data: { media: post } })}</script>`, "DfccWTYDHyd");
  expect(videos).toHaveLength(3);
  expect(videos.map(video => video.formats[0]?.url)).toEqual(["https://scontent.cdninstagram.com/one.mp4", "https://scontent.cdninstagram.com/two.mp4", "https://scontent.cdninstagram.com/three.mp4"]);
});
it("rejects unsafe media addresses in a Threads carousel", () => {
  const html = `<script>${JSON.stringify({ code: "test", carousel_media: [{ video_versions: [{ url: "https://127.0.0.1/video.mp4" }] }, { video_versions: [{ url: "https://cdninstagram.com.evil.example/video.mp4" }] }] })}</script>`;
  expect(parseThreadsVideos(html, "test")).toEqual([]);
});