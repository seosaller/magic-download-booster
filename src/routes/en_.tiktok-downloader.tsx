import { createFileRoute } from "@tanstack/react-router";
import { TikTokDownloader } from "@/components/tiktok-downloader";
import { tiktokHead } from "@/lib/tiktok-head";
export const Route = createFileRoute("/en/tiktok-downloader")({ head: () => tiktokHead("en"), component: () => <TikTokDownloader language="en" /> });