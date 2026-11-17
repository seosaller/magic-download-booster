import { afterEach, expect, test } from "bun:test";
import { boundedAudioInput, isDownloadMediaUrl, MAX_AUDIO_INPUT_BYTES, pullFacebookMedia } from "./facebook-media.server";
import { downloadFailure, isMp3Header } from "./download-response";
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
test("allows CloudConvert export hosts but rejects credentials, ports and non-HTTPS", () => {
  expect(isDownloadMediaUrl("https://eu-central.storage.cloudconvert.com/output.mp3")).toBe(true);
  for (const url of ["http://video.fbcdn.net/x", "https://user:pass@video.fbcdn.net/x", "https://video.fbcdn.net:444/x", "https://cloudconvert.com.evil.org/x"]) expect(isDownloadMediaUrl(url)).toBe(false);
});
test("rejects unsafe media redirects before fetching the destination", async () => {
  let calls = 0;
  globalThis.fetch = Object.assign(async () => { calls++; return new Response(null, { status: 302, headers: { location: "https://127.0.0.1/private" } }); }, { preconnect: originalFetch.preconnect });
  await expect(pullFacebookMedia("https://video.fbcdn.net/x")).rejects.toThrow("Unsupported media address");
  expect(calls).toBe(1);
});
test("MP3 sniffing rejects MP4 and M4A instead of renaming them", () => {
  expect(isMp3Header(new Uint8Array([0x49, 0x44, 0x33]))).toBe(true);
  expect(isMp3Header(new Uint8Array([0xff, 0xfb, 0x90]))).toBe(true);
  expect(isMp3Header(new Uint8Array([0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70]))).toBe(false);
  expect(isMp3Header(new Uint8Array([0xff, 0xf1]))).toBe(false);
});
test("audio conversion rejects expired HTML, empty bytes and oversized input", async () => {
  expect(MAX_AUDIO_INPUT_BYTES).toBe(67108864);
  await expect(boundedAudioInput(new Response("expired", { status: 403 }))).rejects.toThrow("expired");
  await expect(boundedAudioInput(new Response("login", { headers: { "content-type": "text/html" } }))).rejects.toThrow("unavailable");
  await expect(boundedAudioInput(new Response("x", { headers: { "content-length": String(MAX_AUDIO_INPUT_BYTES + 1) } }))).rejects.toThrow("64 MB");
});
test("failed iframe downloads relay visible errors without redirecting to a CDN", async () => {
  const response = downloadFailure(new Request("https://app.test/api/public/download", { headers: { "sec-fetch-dest": "iframe" } }), "Expired source");
  expect(response.status).toBe(502);
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).toContain('"type":"download-error"');
});