import { createFileRoute } from "@tanstack/react-router";
import { DownloaderPage } from "@/components/downloader-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FB Download Hub — Facebook Videos, Reels & MP3" },
      {
        name: "description",
        content:
          "Save public Facebook videos and reels in SD, HD, available high resolution, or convert their original audio and music to MP3.",
      },
      {
        property: "og:title",
        content: "FB Download Hub — Facebook Videos, Reels & MP3",
      },
      {
        property: "og:description",
        content:
          "Download public Facebook videos and reels, or save their original sound as MP3 with audio conversion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <DownloaderPage />,
});

