import { createFileRoute } from "@tanstack/react-router";
import { DownloaderPage } from "@/components/downloader-page";
import { infoHead } from "@/components/info-page";

export const Route = createFileRoute("/facebook-reels-downloader")({
  head: () => infoHead("Facebook Reels Downloader", "Download public Facebook Reels online in available HD or SD quality, or convert Reel audio to 320 kbps MP3. Works in mobile and desktop browsers."),
  component: () => <DownloaderPage reels />,
});