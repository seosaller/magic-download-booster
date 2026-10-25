import { tiktokCopy } from "./tiktok";
import type { Language } from "./i18n";
export function tiktokHead(language: Language) {
  const text = tiktokCopy[language];
  const title = `${text.title} — Download Hub`;
  return { meta: [{ title }, { name: "description", content: text.intro }, { property: "og:title", content: title }, { property: "og:description", content: text.intro }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}