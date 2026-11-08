import { validSocialLink } from "./social";

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