import { createFileRoute } from "@tanstack/react-router";
import { SocialDownloader } from "@/components/social-downloader";
import { socialHead } from "@/lib/social";
export const Route = createFileRoute("/id_/threads-downloader")({ head: () => socialHead("id", "threads"), component: () => <SocialDownloader language="id" platform="threads" /> });
