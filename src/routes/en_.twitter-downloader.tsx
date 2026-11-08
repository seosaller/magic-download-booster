import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/en_/twitter-downloader")({ head: () => socialHead("en", "twitter"), component: () => <SocialDownloader language="en" platform="twitter" /> });
