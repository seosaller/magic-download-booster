import { createFileRoute } from "@tanstack/react-router";
import { isGenDownloadMediaUrl } from "@/lib/gendownload";
import { downloadFailure } from "@/lib/download-response";

export const Route = createFileRoute("/api/public/social-download")({
  server: { handlers: { GET: async ({ request }) => {
    const query = new URL(request.url).searchParams;
    const url = query.get("url") || "";
    const thumbnail = query.get("type") === "thumbnail";
    if (!isGenDownloadMediaUrl(url)) return downloadFailure(request, "Invalid media download request.", 400);
    try {
      const { pullGenMedia } = await import("@/lib/gendownload.server");
      const response = await pullGenMedia(url, thumbnail ? null : request.headers.get("range"));
      const type = response.headers.get("content-type") || "";
      if (!response.ok || !response.body || !(thumbnail ? /^image\/(jpeg|png|webp|avif)/i.test(type) : /video\/|application\/octet-stream/i.test(type))) { await response.body?.cancel(); return downloadFailure(request, "The media is unavailable or expired. Please process the link again."); }
      const name = (query.get("name") || "video").replace(/[^a-z0-9_-]/gi, "_").slice(0, 100);
      const ext = /webm/i.test(type) ? "webm" : /quicktime/i.test(type) ? "mov" : "mp4";
      const headers = new Headers({ "Content-Type": type, "Content-Disposition": thumbnail ? "inline" : `attachment; filename="${name}.${ext}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      for (const key of ["content-length", "content-range", "accept-ranges"]) { const value = response.headers.get(key); if (value) headers.set(key, value); }
      return new Response(response.body, { status: response.status, headers });
    } catch { return downloadFailure(request, "Unable to download this video. Please process the link again."); }
  } } },
});