import { createServerFn } from "@tanstack/react-start";
import { socialRequestSchema } from "./social";

export const fetchSocialVideo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => socialRequestSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { extractGenDownload } = await import("./gendownload.server");
      const url = data.platform === "threads" ? await (await import("./threads.server")).resolveThreadsPost(data.url) : data.url;
      return { ok: true as const, video: await extractGenDownload(url) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Unable to retrieve the video. Please try again." };
    }
  });