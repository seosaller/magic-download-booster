import { normalizeGenVideo, isGenDownloadMediaUrl } from "./gendownload";

export async function extractGenDownload(url: string) {
  const response = await fetch("https://gendownload.com/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }), signal: AbortSignal.timeout(60000) });
  if (!response.ok) {
    const body = await response.text();
    console.error(`GenDownload failed [${response.status}]: ${body}`);
    throw new Error(`GenDownload could not process this link [${response.status}]: ${body.slice(0, 300)}`);
  }
  const body: unknown = await response.json();
  if (typeof body === "object" && body && "error" in body) throw new Error(`GenDownload: ${String(body.error).slice(0, 300)}`);
  return normalizeGenVideo(body);
}

export async function pullGenMedia(target: string, range: string | null, referer = "https://gendownload.com/") {
  let url = target;
  for (let attempt = 0; attempt < 6; attempt++) {
    if (!isGenDownloadMediaUrl(url)) throw new Error("Unsupported media address.");
    const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0", Referer: referer, ...(range ? { Range: range } : {}) }, signal: AbortSignal.timeout(60000) });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Missing media redirect.");
      await response.body?.cancel();
      url = new URL(location, url).href;
      continue;
    }
    return response;
  }
  throw new Error("Too many media redirects.");
}