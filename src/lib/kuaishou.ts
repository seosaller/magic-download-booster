import { z } from "zod";
export const kuaishouIdSchema = z.string().regex(/^[a-zA-Z0-9]{10,32}$/);
export const kuaishouLinkSchema = z.string().trim().max(4096).superRefine((value, context) => {
  let url: URL;
  try { url = new URL(value); } catch { context.addIssue({ code: "custom", message: "Please paste a complete Kuaishou video link starting with https://." }); return; }
  const host = ["www.kuaishou.com", "kuaishou.com", "v.kuaishou.com"].includes(url.hostname);
  const path = url.hostname === "v.kuaishou.com" ? /^\/[a-zA-Z0-9]+\/?$/.test(url.pathname) : /^\/(?:f|short-video)\/[a-zA-Z0-9]+\/?$/.test(url.pathname);
  if (!host || !path || url.protocol !== "https:" || url.username || url.password || url.port || /\s/.test(value)) context.addIssue({ code: "custom", message: "Use a secure public Kuaishou video or Share link, not a profile or LIVE link." });
});
export function isKuaishouMediaUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.port && /(^|\.)(kwimgs\.com|yximgs\.com)$/.test(url.hostname); } catch { return false; }
}