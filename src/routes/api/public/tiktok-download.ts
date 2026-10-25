import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/tiktok-download")({
  server: { handlers: { GET: async ({ request }) => {
    const query = new URL(request.url).searchParams;
    const id = query.get("id");
    const variant = query.get("variant");
    if (!id || !/^\d{10,25}$/.test(id) || !["video", "watermark"].includes(variant || "")) return new Response("Invalid TikTok download request.", { status: 400 });
    try {
      const { getTikTokVideo, pullTikTokMedia } = await import("@/lib/tiktok.server");
      const source = await getTikTokVideo(`https://www.tiktok.com/@video/video/${id}`);
      const target = variant === "watermark" ? source.wmplay : source.play;
      if (!target) return new Response("This download is unavailable. Please process the link again.", { status: 404 });
      const upstream = await pullTikTokMedia(target, request.headers.get("range"));
      if (!upstream?.ok || !upstream.body || !/video\/|application\/octet-stream/i.test(upstream.headers.get("content-type") || "")) return new Response("The video is temporarily unavailable. Please process the link again.", { status: 502 });
      const headers = new Headers({ "Content-Type": "video/mp4", "Content-Disposition": `attachment; filename="tiktok-${id}${variant === "watermark" ? "-watermark" : ""}.mp4"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      for (const name of ["content-length", "content-range", "accept-ranges"]) { const value = upstream.headers.get(name); if (value) headers.set(name, value); }
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch { return new Response("Unable to retrieve the TikTok video. Please try again shortly.", { status: 502 }); }
  } } },
});