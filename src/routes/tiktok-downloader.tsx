import { createFileRoute } from "@tanstack/react-router";
import { TikTokDownloader } from "@/components/tiktok-downloader";
import { tiktokHead } from "@/lib/tiktok-head";
export const Route = createFileRoute("/tiktok-downloader")({ head: () => tiktokHead("vi"), component: () => <TikTokDownloader language="vi" /> });