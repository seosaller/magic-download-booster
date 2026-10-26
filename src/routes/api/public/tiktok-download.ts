import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/tiktok-download")({
  server: { handlers: { GET: async ({ request }) => {
    const query = new URL(request.url).searchParams;
    const id = query.get("id");
    const variant = query.get("variant");
    if (!id || !/^\d{10,25}$/.test(id) || !["video", "watermark", "thumbnail"].includes(variant || "")) return new Response("Invalid video download request.", { status: 400 });
    try {
      const { getTikTokVideo, pullTikTokMedia } = await import("@/lib/tiktok.server");
      const thumbnail = variant === "thumbnail";
      // ID-derived Tikwm media links work even when re-resolving is rate-limited or blocked.
      const direct = thumbnail ? `https://www.tikwm.com/video/cover/${id}.webp` : `https://www.tikwm.com/video/media/${variant === "watermark" ? "wmplay" : "play"}/${id}.mp4`;
      const source = await getTikTokVideo(`https://www.tiktok.com/@video/video/${id}`).catch(() => undefined);
      const target = (thumbnail ? source?.video.cover : variant === "watermark" ? source?.wmplay : source?.play) || direct;
      let upstream = await pullTikTokMedia(target, thumbnail ? null : request.headers.get("range")).catch(() => undefined);
      if (!upstream?.ok && target !== direct) upstream = await pullTikTokMedia(direct, thumbnail ? null : request.headers.get("range"));
      const contentType = upstream?.headers.get("content-type") || "";
      if (!upstream?.ok || !upstream.body || !(thumbnail ? /^image\/(jpeg|png|webp|avif)(;|$)/i.test(contentType) : /video\/|application\/octet-stream/i.test(contentType))) return new Response("The media is temporarily unavailable. Please process the link again.", { status: 502 });
      const headers = new Headers({ "Content-Type": thumbnail ? contentType : "video/mp4", "Content-Disposition": thumbnail ? "inline" : `attachment; filename="tiktok-${id}${variant === "watermark" ? "-watermark" : ""}.mp4"`, "Cache-Control": thumbnail ? "public, max-age=300" : "no-store", "X-Content-Type-Options": "nosniff" });
      for (const name of ["content-length", "content-range", "accept-ranges"]) { const value = upstream.headers.get(name); if (value) headers.set(name, value); }
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch { return new Response("Unable to retrieve the TikTok video. Please try again shortly.", { status: 502 }); }
  } } },
});
