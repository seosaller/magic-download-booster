import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/id_/douyin-downloader")({ head: () => socialHead("id", "douyin"), component: () => <SocialDownloader language="id" platform="douyin" /> });
