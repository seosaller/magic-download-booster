import type { NativeSource } from "./facebook-streams";

export function visibleNativeSources(sources: NativeSource[]): NativeSource[] {
  return sources.filter(source => source.height !== 1080 && Math.min(source.width ?? 0, source.height) > 1080);
}