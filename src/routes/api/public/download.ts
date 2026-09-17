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
        const type = u.searchParams.get("type") === "jpg" ? "jpg" : "mp4";
        if (!target) return new Response("Missing url", { status: 400 });

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

        const upstream = await fetch(target, {
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            referer: "https://www.facebook.com/",
            range: request.headers.get("range") ?? "bytes=0-",
          },
        });
        if (!upstream.ok && upstream.status !== 206)
          return new Response("Upstream error", { status: 502 });

        const headers = new Headers();
        headers.set(
          "content-type",
          type === "jpg" ? "image/jpeg" : "video/mp4",
        );
        headers.set(
          "content-disposition",
          `attachment; filename="${name}.${type}"`,
        );
        const len = upstream.headers.get("content-length");
        if (len) headers.set("content-length", len);
        return new Response(upstream.body, { status: 200, headers });
      },
    },
  },
});
