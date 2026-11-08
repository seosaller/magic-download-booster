import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/douyin-downloader")({ head: () => socialHead("vi", "douyin"), component: () => <SocialDownloader language="vi" platform="douyin" /> });
