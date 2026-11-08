import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/pt_/twitter-downloader")({ head: () => socialHead("pt", "twitter"), component: () => <SocialDownloader language="pt" platform="twitter" /> });
