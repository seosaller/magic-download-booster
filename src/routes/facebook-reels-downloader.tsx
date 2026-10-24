import { createFileRoute } from "@tanstack/react-router";
import { DownloaderPage } from "@/components/downloader-page";
import { infoHead } from "@/components/info-page";

export const Route = createFileRoute("/facebook-reels-downloader")({
  head: () => infoHead("Facebook Reels Downloader", "Download public Facebook Reels in available SD, HD and high resolution, or convert their original speech and music to MP3."),
  component: () => <DownloaderPage reels />,
});