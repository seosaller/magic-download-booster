import { createFileRoute } from "@tanstack/react-router";

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
        if (!target) return new Response("Missing url", { status: 400 });
        const sourceUrl = target;

        let host = "";
        try {
          host = new URL(target).hostname;
        } catch {
          return new Response("Bad url", { status: 400 });
        }
        if (
          !/(^|\.)(fbcdn\.net|facebook\.com|fbsbx\.com|cloudconvert\.com)$/i.test(
            host,
          )
        )
          return new Response("Host not allowed", { status: 403 });

        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
        const range = request.headers.get("range");

        async function pull(withRange: boolean) {
          const h: Record<string, string> = {
            "user-agent": ua,
            referer: "https://www.facebook.com/",
          };
          if (withRange && range) h["range"] = range;
          try {
            return await fetch(sourceUrl, { headers: h, redirect: "follow" });
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

        // Facebook sometimes blocks server-side fetches; in that case send the
        // browser straight to the original file instead of a text error page.
        if (bad || !upstream) return Response.redirect(target, 302);

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
        return new Response(upstream.body, {
          status: upstream.status === 206 ? 206 : 200,
          headers,
        });
      },
    },
  },
});
