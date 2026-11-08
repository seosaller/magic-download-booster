import { createServerFn } from "@tanstack/react-start";
import { socialRequestSchema } from "./social";

export const fetchSocialVideo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => socialRequestSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { extractGenDownload } = await import("./gendownload.server");
      let url = data.url;
      if (data.platform === "threads") {
        const { resolveThreadsPost, extractThreadsVideos } = await import("./threads.server");
        url = await resolveThreadsPost(url);
        try {
          const videos = await extractThreadsVideos(url);
          if (videos.length) return { ok: true as const, videos, warning: "" };
        } catch (error) { console.error("Threads public extraction unavailable", error); }
      }
      return { ok: true as const, videos: [await extractGenDownload(url)], warning: data.platform === "threads" ? "The provider returned this video, but the complete post video list could not be verified. Try again if any videos are missing." : "" };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Unable to retrieve the video. Please try again." };
    }
  });