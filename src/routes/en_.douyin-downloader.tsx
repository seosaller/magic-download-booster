import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/en_/douyin-downloader")({ head: () => socialHead("en", "douyin"), component: () => <SocialDownloader language="en" platform="douyin" /> });
