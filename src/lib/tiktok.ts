import { z } from "zod";
import { douyinLinkSchema, downloadPlatform, isDouyinMediaUrl, type DownloadPlatform } from "./douyin";

export const tiktokLinkSchema = z.string().trim().max(4096).superRefine((value, context) => {
  let url: URL;
  try { url = new URL(value); } catch { context.addIssue({ code: "custom", message: "Please paste a complete TikTok video link starting with https://." }); return; }
  if (url.protocol !== "https:" || url.username || url.password || url.port || /\s/.test(value) || !["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"].includes(url.hostname)) {
    context.addIssue({ code: "custom", message: "Only secure TikTok video links are supported. Copy the link from TikTok's Share menu." }); return;
  }
  const short = ["vm.tiktok.com", "vt.tiktok.com"].includes(url.hostname) && /^\/[a-zA-Z0-9]+\/?$/.test(url.pathname);
  if (!short && !/^\/@[^/]+\/video\/\d+\/?$/.test(url.pathname) && !/^\/t\/[a-zA-Z0-9]+\/?$/.test(url.pathname)) context.addIssue({ code: "custom", message: "This TikTok link is not a video. Please use a public video link, not a profile, LIVE or photo post." });
});
export function tiktokLinkError(value: string) {
  const parsed = shortVideoLinkSchema.safeParse(value);
  return parsed.success ? "" : parsed.error.issues[0]?.message ?? "Please check your TikTok video link.";
}
export const shortVideoLinkSchema = z.string().trim().max(4096).superRefine((value, context) => {
  const parsed = (downloadPlatform(value) === "douyin" || value.includes("iesdouyin.com") ? douyinLinkSchema : tiktokLinkSchema).safeParse(value);
  if (!parsed.success) for (const issue of parsed.error.issues) context.addIssue({ code: "custom", message: issue.message });
});
export function isShortVideoMediaUrl(value: string, platform: DownloadPlatform = "tiktok") { return platform === "douyin" ? isDouyinMediaUrl(value) : isTikTokMediaUrl(value); }
export const tiktokPaths = { vi: "/tiktok-downloader", en: "/en/tiktok-downloader", pt: "/pt/tiktok-downloader", id: "/id/tiktok-downloader" } as const;
export const tiktokCopy = {
  en: { title: "TikTok Video Downloader", intro: "Save public TikTok videos with their original sound in the available quality.", placeholder: "Paste TikTok video link…", video: "Download Video", watermark: "Download with watermark", how: "Download TikTok videos", steps: ["Open a public TikTok video", "Copy its link from Share", "Paste the link above", "Choose your video download"], note: "Public video links are processed by the connected Evil0ctal API, with Tikwm available as a backup. Private, deleted, LIVE and photo posts are not supported. Only save content you own or have permission to download.", ready: "Your video is ready", faq: "TikTok download questions", question: "Is every video available in HD?", answer: "Quality depends on the original video and the available source. We do not upscale videos or label them 1080p or 4K without verification." },
  vi: { title: "Trình tải video TikTok", intro: "Lưu video TikTok công khai cùng âm thanh gốc với chất lượng có sẵn.", placeholder: "Dán liên kết video TikTok…", video: "Tải video", watermark: "Tải video có watermark", how: "Cách tải video TikTok", steps: ["Mở video TikTok công khai", "Sao chép liên kết từ Chia sẻ", "Dán liên kết ở trên", "Chọn video để tải xuống"], note: "Liên kết video công khai được xử lý qua API Evil0ctal đã kết nối, với Tikwm làm dịch vụ dự phòng. Không hỗ trợ video riêng tư, đã xóa, LIVE và bài đăng ảnh. Chỉ tải nội dung bạn sở hữu hoặc được phép lưu.", ready: "Video đã sẵn sàng", faq: "Câu hỏi về tải TikTok", question: "Mọi video đều có chất lượng HD không?", answer: "Chất lượng phụ thuộc vào video gốc và nguồn có sẵn. Chúng tôi không nâng độ phân giải hoặc gắn nhãn 1080p hay 4K khi chưa xác minh." },
  pt: { title: "Baixar vídeos do TikTok", intro: "Salve vídeos públicos do TikTok com o áudio original na qualidade disponível.", placeholder: "Cole o link do vídeo do TikTok…", video: "Baixar vídeo", watermark: "Baixar com marca d’água", how: "Como baixar vídeos do TikTok", steps: ["Abra um vídeo público do TikTok", "Copie o link em Compartilhar", "Cole o link acima", "Escolha o vídeo para baixar"], note: "Links públicos são processados pela API Evil0ctal conectada, com Tikwm como alternativa. Vídeos privados, excluídos, LIVE e publicações de fotos não são suportados. Baixe apenas conteúdo seu ou autorizado.", ready: "Seu vídeo está pronto", faq: "Perguntas sobre downloads do TikTok", question: "Todos os vídeos estão disponíveis em HD?", answer: "A qualidade depende do vídeo original e da fonte disponível. Não aumentamos a resolução nem rotulamos vídeos como 1080p ou 4K sem verificação." },
  id: { title: "Pengunduh Video TikTok", intro: "Simpan video TikTok publik dengan suara asli dalam kualitas yang tersedia.", placeholder: "Tempel tautan video TikTok…", video: "Unduh video", watermark: "Unduh dengan watermark", how: "Cara mengunduh video TikTok", steps: ["Buka video TikTok publik", "Salin tautan dari Bagikan", "Tempel tautan di atas", "Pilih unduhan video"], note: "Tautan video publik diproses melalui API Evil0ctal yang terhubung, dengan Tikwm sebagai cadangan. Video privat, dihapus, LIVE dan postingan foto tidak didukung. Unduh hanya konten milik Anda atau yang diizinkan.", ready: "Video Anda siap", faq: "Pertanyaan unduhan TikTok", question: "Apakah semua video tersedia dalam HD?", answer: "Kualitas bergantung pada video asli dan sumber yang tersedia. Kami tidak meningkatkan resolusi atau memberi label 1080p atau 4K tanpa verifikasi." },
};
export function isTikTokMediaUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.port && (/(^|\.)(tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com|tikwm\.com)$/.test(url.hostname) || /^v\d+-[a-z0-9-]+\.(?:us\.)?tiktok\.com$/.test(url.hostname)); } catch { return false; }
}
export type TikTokVideo = { id: string; platform?: DownloadPlatform; title: string; author: string; cover: string; size: number; watermarkSize: number; watermark: boolean };// Browser-side lookup: Tikwm allows CORS, so each visitor uses their own rate limit instead of the shared server IP.
export async function resolveTikTokInBrowser(url: string): Promise<TikTokVideo | null> {
  try {
    if (downloadPlatform(url) === "douyin" || url.includes("iesdouyin.com")) return null;
    const response = await fetch("https://www.tikwm.com/api/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ url }), signal: AbortSignal.timeout(20000) });
    if (!response.ok) return null;
    const body = await response.json() as { code?: number; data?: { id?: unknown; title?: unknown; cover?: unknown; play?: unknown; wmplay?: unknown; size?: unknown; wm_size?: unknown; images?: unknown; author?: { nickname?: unknown } } };
    const data = body.data;
    if (body.code !== 0 || !data || typeof data.id !== "string" || !/^\d{10,25}$/.test(data.id)) return null;
    if (Array.isArray(data.images) && data.images.length) return null;
    if (typeof data.play !== "string" || !isTikTokMediaUrl(data.play)) return null;
    const text = (value: unknown) => typeof value === "string" ? value : "";
    const num = (value: unknown) => typeof value === "number" ? value : 0;
    return { id: data.id, title: text(data.title) || "TikTok video", author: text(data.author?.nickname), cover: isTikTokMediaUrl(text(data.cover)) ? text(data.cover) : "", size: num(data.size), watermarkSize: num(data.wm_size), watermark: isTikTokMediaUrl(text(data.wmplay)) };
  } catch { return null; }
}
