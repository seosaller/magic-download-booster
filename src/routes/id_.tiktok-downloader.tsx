import { createFileRoute } from "@tanstack/react-router";
import { TikTokDownloader } from "@/components/tiktok-downloader";
import { tiktokHead } from "@/lib/tiktok-head";
export const Route = createFileRoute("/id_/tiktok-downloader")({ head: () => tiktokHead("id"), component: () => <TikTokDownloader language="id" /> });