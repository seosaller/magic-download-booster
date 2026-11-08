import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/pt_/threads-downloader")({ head: () => socialHead("pt", "threads"), component: () => <SocialDownloader language="pt" platform="threads" /> });
