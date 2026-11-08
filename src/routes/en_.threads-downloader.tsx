import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/en_/threads-downloader")({ head: () => socialHead("en", "threads"), component: () => <SocialDownloader language="en" platform="threads" /> });
