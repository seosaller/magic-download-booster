import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/twitter-downloader")({ head: () => socialHead("vi", "twitter"), component: () => <SocialDownloader language="vi" platform="twitter" /> });
