import { isFacebookMediaUrl } from "./mp3";

export function isDownloadMediaUrl(value: string) {
  if (isFacebookMediaUrl(value)) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password && !u.port && /(^|\.)cloudconvert\.com$/i.test(u.hostname);
  } catch { return false; }
}

export async function pullFacebookMedia(target: string, range: string | null = null) {
  let url = target;
  for (let hop = 0; hop < 6; hop++) {
    if (!isDownloadMediaUrl(url)) throw new Error("Unsupported media address.");
    const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0", Referer: "https://www.facebook.com/", ...(range ? { Range: range } : {}) }, signal: AbortSignal.timeout(60000) });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("Missing media redirect.");
      url = new URL(location, url).href;
      continue;
    }
    return response;
  }
  throw new Error("Too many media redirects.");
}

export const MAX_AUDIO_INPUT_BYTES = 64 * 1024 * 1024;
export async function boundedAudioInput(response: Response) {
  if (!response.ok || !response.body || /text\/|application\/json/i.test(response.headers.get("content-type") ?? "")) throw new Error("The original audio is unavailable or expired. Process the Facebook link again.");
  if (Number(response.headers.get("content-length")) > MAX_AUDIO_INPUT_BYTES) { await response.body.cancel(); throw new Error("This source exceeds the 64 MB MP3 conversion limit. Video downloads remain available."); }
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_AUDIO_INPUT_BYTES) throw new Error("This source exceeds the 64 MB MP3 conversion limit. Video downloads remain available.");
      chunks.push(new Uint8Array(value));
    }
  } catch (error) { await reader.cancel(); throw error; }
  if (!size) throw new Error("The original audio is empty.");
  return new Blob(chunks, { type: response.headers.get("content-type") || "application/octet-stream" });
}