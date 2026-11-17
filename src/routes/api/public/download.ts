import { createFileRoute } from "@tanstack/react-router";
import { isDownloadMediaUrl, pullFacebookMedia } from "@/lib/facebook-media.server";
import { downloadFailure, isMp3Header } from "@/lib/download-response";

export const Route = createFileRoute("/api/public/download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const target = u.searchParams.get("url");
        const name = (u.searchParams.get("name") || "video").replace(
          /[^a-z0-9_\-.]/gi,
          "_",
        );
        const requestedType = u.searchParams.get("type");
        const type = requestedType === "jpg" ? "jpg" : requestedType === "mp3" ? "mp3" : "mp4";
        if (!target) return downloadFailure(request, "Missing media address.", 400);
        const sourceUrl = target;

        let host = "";
        try {
          host = new URL(target).hostname;
        } catch {
          return downloadFailure(request, "Invalid media address.", 400);
        }
        if (
          !isDownloadMediaUrl(target)
        )
          return downloadFailure(request, "Unsupported media address.", 403);

        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
        const range = type === "mp3" ? null : request.headers.get("range");

        async function pull(withRange: boolean) {
          const h: Record<string, string> = {
            "user-agent": ua,
            referer: "https://www.facebook.com/",
          };
          if (withRange && range) h["range"] = range;
          try {
            return await pullFacebookMedia(sourceUrl, withRange ? range : null);
          } catch {
            return undefined;
          }
        }

        let upstream = await pull(true);
        if (!upstream || (!upstream.ok && upstream.status !== 206))
          upstream = await pull(false);

        const ct = upstream?.headers.get("content-type") ?? "";
        const bad =
          !upstream ||
          (!upstream.ok && upstream.status !== 206) ||
          /text\/|application\/json/i.test(ct);

        // Keep failures same-origin and visible rather than redirecting to a blocked CDN.
        if (bad || !upstream || !upstream.body) {
          await upstream?.body?.cancel();
          return downloadFailure(request, "The download source is unavailable or expired. Process the Facebook link again; if it still fails, try another available quality.");
        }

        // Never turn MP4/M4A bytes into an apparent MP3 by changing headers.
        let body: ReadableStream<Uint8Array> = upstream.body;
        if (type === "mp3") {
          const reader = body.getReader();
          const first = await reader.read();
          if (first.done || !isMp3Header(first.value)) {
            await reader.cancel();
            return downloadFailure(request, "The conversion service did not return an MP3 file. Convert the audio again.");
          }
          body = new ReadableStream<Uint8Array>({
            start(controller) { controller.enqueue(first.value); },
            async pull(controller) { try { const next = await reader.read(); if (next.done) controller.close(); else controller.enqueue(next.value); } catch (error) { controller.error(error); } },
            cancel(reason) { return reader.cancel(reason); },
          });
        }

        const headers = new Headers();
        headers.set(
          "content-type",
          type === "mp3" ? "audio/mpeg" : ct && !/text\//i.test(ct)
            ? ct
            : type === "jpg"
              ? "image/jpeg"
              : "video/mp4",
        );
        headers.set(
          "content-disposition",
          `attachment; filename="${name}.${type}"`,
        );
        const len = upstream.headers.get("content-length");
        if (len) headers.set("content-length", len);
        const cr = upstream.headers.get("content-range");
        if (cr) headers.set("content-range", cr);
        headers.set("accept-ranges", "bytes");
        headers.set("cache-control", "no-store");
        headers.set("x-content-type-options", "nosniff");
        return new Response(body, {
          status: upstream.status === 206 ? 206 : 200,
          headers,
        });
      },
    },
  },
});
