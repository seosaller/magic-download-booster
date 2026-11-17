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
const isTwoKOrHigher = (width: number | undefined, height: number) => Math.min(width || height, height) >= 1440;

export type FullHdReplacement<T> = { kind: "native"; source: NativeSource } | { kind: "link"; link: T };

/** When the source has no genuine 2K/4K, offer its real 1080p (Full HD) file instead. */
export function fullHdReplacement<T extends { quality: string }>(sources: NativeSource[], links: T[]): FullHdReplacement<T> | undefined {
  if (sources.some(source => isTwoKOrHigher(source.width, source.height)) || links.some(link => /^(2K|4K|1440p|2160p)/i.test(link.quality))) return undefined;
  const native = sources.find(source => Math.min(source.width || source.height, source.height) === 1080);
  if (native) return { kind: "native", source: native };
  const link = links.find(item => isFullHdQuality(item.quality));
  return link ? { kind: "link", link } : undefined;
}
