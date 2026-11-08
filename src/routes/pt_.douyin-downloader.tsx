import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/pt_/douyin-downloader")({ head: () => socialHead("pt", "douyin"), component: () => <SocialDownloader language="pt" platform="douyin" /> });
