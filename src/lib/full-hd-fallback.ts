import type { FullHdSource } from "./full-hd";

export type VideoLink = { quality: string; url: string; size?: number | undefined };

export function fullHdFallback(source: FullHdSource | undefined, links: VideoLink[]): VideoLink | undefined {
  return source ? undefined : links.find((link) => link.quality === "HD");
}