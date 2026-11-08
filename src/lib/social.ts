import { z } from "zod";
import type { Language } from "./i18n";

export const socialPlatforms = ["douyin", "twitter", "threads"] as const;
export type SocialPlatform = typeof socialPlatforms[number];
export const socialNames = { douyin: "Douyin", twitter: "Twitter / X", threads: "Threads" } as const;
export const socialPaths = {
  vi: { douyin: "/douyin-downloader", twitter: "/twitter-downloader", threads: "/threads-downloader" },
  en: { douyin: "/en/douyin-downloader", twitter: "/en/twitter-downloader", threads: "/en/threads-downloader" },
  pt: { douyin: "/pt/douyin-downloader", twitter: "/pt/twitter-downloader", threads: "/pt/threads-downloader" },
  id: { douyin: "/id/douyin-downloader", twitter: "/id/twitter-downloader", threads: "/id/threads-downloader" },
} as const;

export function socialPlatformFromPath(path: string) {
  return socialPlatforms.find(platform => path.endsWith(`/${platform}-downloader`));
}
export function validSocialLink(value: string, platform: SocialPlatform) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || /\s/.test(value)) return false;
    if (platform === "douyin") return (url.hostname === "v.douyin.com" && /^\/[\w-]+\/?$/.test(url.pathname)) || (["douyin.com", "www.douyin.com"].includes(url.hostname) && (/^\/video\/\d+\/?$/.test(url.pathname) || (["/jingxuan", "/discover", "/recommend", "/"].includes(url.pathname) && /^\d{10,25}$/.test(url.searchParams.get("modal_id") || ""))));
    if (platform === "twitter") return ["twitter.com", "www.twitter.com", "mobile.twitter.com", "x.com", "www.x.com"].includes(url.hostname) && /^\/(?:[\w]+\/status|i\/web\/status)\/\d+(?:\/video\/\d+)?\/?$/.test(url.pathname);
    return ["threads.net", "www.threads.net", "threads.com", "www.threads.com"].includes(url.hostname) && /^\/@[^/]+\/post\/[\w-]+\/?$/.test(url.pathname);
  } catch { return false; }
}
export const socialRequestSchema = z.object({ platform: z.enum(socialPlatforms), url: z.string().trim().max(4096) }).superRefine((data, context) => {
  if (!validSocialLink(data.url, data.platform)) context.addIssue({ code: "custom", path: ["url"], message: `Please paste a complete public ${socialNames[data.platform]} video link starting with https://, not a profile or LIVE link.` });
});
export function socialLinkError(url: string, platform: SocialPlatform) {
  const parsed = socialRequestSchema.safeParse({ url, platform });
  return parsed.success ? "" : parsed.error.issues[0]?.message || "Please check your video link.";
}
export function socialCopy(language: Language, platform: SocialPlatform) {
  const name = socialNames[platform];
  return {
    en: { title: `${name} Video Downloader`, intro: `Save public ${name} videos with their original sound in the available quality.`, placeholder: `Paste ${name} video link…`, video: "Download video", ready: "Your video is ready", note: "Only save public content you own or have permission to download. Private, deleted, photo-only and LIVE posts are not supported." },
    vi: { title: `Trình tải video ${name}`, intro: `Lưu video ${name} công khai cùng âm thanh gốc với chất lượng có sẵn.`, placeholder: `Dán liên kết video ${name}…`, video: "Tải video", ready: "Video đã sẵn sàng", note: "Chỉ tải nội dung công khai bạn sở hữu hoặc được phép lưu. Không hỗ trợ bài đăng riêng tư, đã xóa, chỉ có ảnh và LIVE." },
    pt: { title: `Baixar vídeos do ${name}`, intro: `Salve vídeos públicos do ${name} com o áudio original na qualidade disponível.`, placeholder: `Cole o link do vídeo do ${name}…`, video: "Baixar vídeo", ready: "Seu vídeo está pronto", note: "Baixe apenas conteúdo público seu ou autorizado. Publicações privadas, excluídas, somente fotos e LIVE não são suportadas." },
    id: { title: `Pengunduh Video ${name}`, intro: `Simpan video ${name} publik dengan suara asli dalam kualitas yang tersedia.`, placeholder: `Tempel tautan video ${name}…`, video: "Unduh video", ready: "Video Anda siap", note: "Unduh hanya konten publik milik Anda atau yang diizinkan. Postingan privat, dihapus, hanya foto dan LIVE tidak didukung." },
  }[language];
}
export function socialHead(language: Language, platform: SocialPlatform) {
  const text = socialCopy(language, platform);
  const title = `${text.title} — Download Hub`;
  return { meta: [{ title }, { name: "description", content: text.intro }, { property: "og:title", content: title }, { property: "og:description", content: text.intro }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}