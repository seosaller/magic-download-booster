import type { FullHdSource } from "./full-hd";

export type VideoLink = { quality: string; url: string; size?: number | undefined };

export function fullHdFallback(source: FullHdSource | undefined, links: VideoLink[]): VideoLink | undefined {
  // Lower-resolution HD is never a valid replacement for native 1080p.
  void source;
  void links;
  return undefined;
}