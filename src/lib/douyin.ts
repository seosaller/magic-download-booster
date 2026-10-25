import { z } from "zod";
export type DownloadPlatform = "tiktok" | "douyin";
export function downloadPlatform(url: string): DownloadPlatform {
  try { return /(^|\.)douyin\.com$/.test(new URL(url).hostname) ? "douyin" : "tiktok"; } catch { return "tiktok"; }
}
export const douyinLinkSchema = z.string().trim().max(4096).superRefine((value, context) => {
  let url: URL;
  try { url = new URL(value); } catch { context.addIssue({ code: "custom", message: "Please paste a complete Douyin video link starting with https://." }); return; }
  if (url.protocol !== "https:" || url.username || url.password || url.port || /\s/.test(value) || !["douyin.com", "www.douyin.com", "v.douyin.com", "m.douyin.com", "www.iesdouyin.com"].includes(url.hostname)) {
    context.addIssue({ code: "custom", message: "Only secure Douyin video links are supported. Copy the link from Douyin's Share menu." }); return;
  }
  const short = url.hostname === "v.douyin.com" && /^\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname);
  const video = /^\/video\/\d+\/?$/.test(url.pathname) || (url.hostname === "www.iesdouyin.com" && /^\/share\/video\/\d+\/?$/.test(url.pathname));
  if (!short && !video) context.addIssue({ code: "custom", message: "Please use a public Douyin video link, not a profile, LIVE or photo post." });
});
export function isDouyinMediaUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.port && /(^|\.)(douyinvod\.com|douyinpic\.com|douyinstatic\.com|byteimg\.com|ibytedtos\.com)$/i.test(url.hostname); } catch { return false; }
}