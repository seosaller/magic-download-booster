import type { NativeSource } from "./facebook-streams";

export function isFullHdQuality(quality: string): boolean {
  return /1080\s*p?\b|full[\s-]*hd|\bfhd\b/i.test(quality);
}

export function visibleDownloadLinks<T extends { quality: string }>(links: T[]): T[] {
  return links.filter(link => !isFullHdQuality(link.quality));
}

export function visibleNativeSources(sources: NativeSource[]): NativeSource[] {
  return sources.filter(source => !isFullHdQuality(source.label) && source.height !== 1080 && Math.min(source.width ?? 0, source.height) > 1080);
}