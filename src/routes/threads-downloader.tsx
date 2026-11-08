import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/threads-downloader")({ head: () => socialHead("vi", "threads"), component: () => <SocialDownloader language="vi" platform="threads" /> });
