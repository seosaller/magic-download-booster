import { validSocialLink } from "./social";
import { parseThreadsVideos } from "./threads";

export async function resolveThreadsPost(value: string) {
  let url = value;
  for (let attempt = 0; attempt < 6; attempt++) {
    if (!validSocialLink(url, "threads")) throw new Error("Unsupported Threads redirect.");
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/@")) {
      parsed.search = "";
      return parsed.href;
    }
    const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) });
    await response.body?.cancel();
    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) throw new Error("This Threads share link could not be opened. Please copy the public post link and try again.");
    url = new URL(location, url).href;
  }
  throw new Error("Too many Threads share redirects. Please use the original post link.");
}

export async function extractThreadsVideos(url: string) {
  const shortcode = /\/post\/([\w-]+)/.exec(url)?.[1];
  if (!shortcode || !validSocialLink(url, "threads")) throw new Error("Invalid Threads post link.");
  const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }, signal: AbortSignal.timeout(20000) });
  if (!response.ok || !response.body) { await response.body?.cancel(); return []; }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 2_000_000) throw new Error("Threads post data is too large. Please try again.");
      html += decoder.decode(chunk.value, { stream: true });
    }
    html += decoder.decode();
  } finally { await reader.cancel(); }
  return parseThreadsVideos(html, shortcode);
}