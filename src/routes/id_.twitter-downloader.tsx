import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/id_/twitter-downloader")({ head: () => socialHead("id", "twitter"), component: () => <SocialDownloader language="id" platform="twitter" /> });
