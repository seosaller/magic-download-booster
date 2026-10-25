import { createFileRoute } from "@tanstack/react-router";
import { TikTokDownloader } from "@/components/tiktok-downloader";
import { tiktokHead } from "@/lib/tiktok-head";
export const Route = createFileRoute("/pt_/tiktok-downloader")({ head: () => tiktokHead("pt"), component: () => <TikTokDownloader language="pt" /> });