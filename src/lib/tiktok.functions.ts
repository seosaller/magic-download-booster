import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { shortVideoLinkSchema } from "./tiktok";

export const fetchTikTok = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ url: shortVideoLinkSchema }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { getTikTokVideo } = await import("./tiktok.server");
      return { ok: true as const, video: (await getTikTokVideo(data.url)).video };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error && error.name !== "TimeoutError" ? error.message : "TikTok took too long to respond. Please try again." };
    }
  });