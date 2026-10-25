import { z } from "zod";

export const MAX_FACEBOOK_LINK_LENGTH = 4096;
const malformed = "Paste a complete Facebook video or Reel link, starting with https://.";
const unsupported = "This link is not supported. Copy a public Facebook video or Reel link using Share → Copy link (facebook.com/watch, facebook.com/reel, facebook.com/share or fb.watch).";

export function isFacebookPageUrl(url: URL): boolean {
  return (url.protocol === "https:" || url.protocol === "http:") &&
    !url.username && !url.password && !url.port &&
    ["facebook.com", "www.facebook.com", "m.facebook.com", "mbasic.facebook.com", "web.facebook.com", "fb.watch", "www.fb.watch", "fb.me", "www.fb.me"].includes(url.hostname);
}

export const facebookLinkSchema = z.string({ required_error: malformed, invalid_type_error: malformed })
  .trim().min(1, "Paste a Facebook video or Reel link first.")
  .max(MAX_FACEBOOK_LINK_LENGTH, "This link is too long. Copy the video’s link again from Facebook’s Share menu.")
  .superRefine((value, ctx) => {
    let url: URL;
    try { url = new URL(value); } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: malformed });
      return;
    }
    if (/\s|[\\\u0000-\u001f\u007f]/.test(value) || !/^https?:\/\//i.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: malformed });
      return;
    }
    if (!isFacebookPageUrl(url)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Only Facebook links are supported. Open the video or Reel on Facebook and use Share → Copy link." });
      return;
    }
    const path = url.pathname;
    const numericId = /^\d+$/.test(url.searchParams.get("v") ?? "");
    const shortLink = /^(?:www\.)?(?:fb\.watch|fb\.me)$/.test(url.hostname) && /^\/[A-Za-z0-9_-]+\/?$/.test(path);
    const supported = shortLink ||
      (/^\/(?:watch\/?|video\.php)$/.test(path) && numericId) ||
      /^\/reel\/\d+\/?$/.test(path) ||
      /^\/(?:[^/]+\/)?videos\/(?:[^/]+\/)?\d+\/?$/.test(path) ||
      /^\/watch\/\d+\/?$/.test(path) ||
      /^\/share\/(?:[vr]\/)?[A-Za-z0-9_-]+\/?$/.test(path);
    if (!supported) ctx.addIssue({ code: z.ZodIssueCode.custom, message: unsupported });
  });

export const facebookRequestSchema = z.object({ url: facebookLinkSchema });

export function facebookLinkError(value: string): string {
  const result = facebookLinkSchema.safeParse(value);
  return result.success ? "" : result.error.issues[0]?.message ?? malformed;
}