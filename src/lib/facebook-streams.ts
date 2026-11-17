import { isFacebookMediaUrl } from "./mp3";

export type NativeSource = { label: string; height: number; width?: number | undefined; video: string; audio: string; size?: number | undefined };
export function nativeQuality(width: number, height: number): string {
  const edge = width > 0 ? Math.min(width, height) : 0;
  return edge >= 2160 ? "4K" : edge >= 1440 ? "2K" : `${edge || height}p`;
}

function decode(value: string) {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))).replace(/\\\//g, "/").replace(/\\"/g, '"').replace(/&amp;/g, "&");
}

/** Read complete representations; never borrow dimensions from the next JSON item. */
export function facebookStreams(html: string): NativeSource[] {
  const videos = new Map<string, { url: string; width: number; height: number; rate: number }>();
  let audio: { url: string; rate: number } | undefined;
  const add = (mime: string, width: number, height: number, url: string, rate: number) => {
    if (!isFacebookMediaUrl(url)) return;
    if (mime.startsWith("video") && height > 0) videos.set(url, { url, width, height, rate });
    if (mime.startsWith("audio") && (!audio || rate > audio.rate)) audio = { url, rate };
  };
  let manifestFound = false;
  for (const text of [html, decode(html)]) {
    for (const match of text.matchAll(/"(?:dash_manifest|dash_manifest_xml_string)"\s*:\s*"((?:\\.|[^"\\])*)"/g)) {
      const xml = decode(match[1] ?? "");
      for (const adaptation of xml.match(/<AdaptationSet\b[\s\S]*?<\/AdaptationSet>/g) ?? [xml]) {
        const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? "";
        const inherited = adaptation.split(">")[0] ?? "";
        for (const rep of adaptation.match(/<Representation\b[\s\S]*?<\/Representation>/g) ?? []) {
          const tag = rep.split(">")[0] ?? "";
          add(attr(tag, "mimeType") || attr(inherited, "mimeType"), Number(attr(tag, "width")), Number(attr(tag, "height")), decode(rep.match(/<BaseURL>([\s\S]*?)<\/BaseURL>/)?.[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim(), Number(attr(tag, "bandwidth")));
        }
      }
      // Later manifests belong to suggested posts, not this video's soundtrack.
      if (videos.size && audio) { manifestFound = true; break; }
    }
    if (manifestFound) break;
  }
  if (!manifestFound) for (const text of [html, decode(html)]) {
    for (const segment of text.split(/"representation_id"\s*:/).slice(1)) {
      const chunk = segment.split(/"representation_id"\s*:/)[0] ?? "";
      // Each representation is a flat object. Stop at its closing brace.
      const bounded = chunk.slice(0, chunk.indexOf("}") >= 0 ? chunk.indexOf("}") : 4000);
      add(bounded.match(/"mime_type"\s*:\s*"(video|audio)/)?.[1] ?? "", Number(bounded.match(/"width"\s*:\s*(\d+)/)?.[1] ?? 0), Number(bounded.match(/"height"\s*:\s*(\d+)/)?.[1] ?? 0), decode(bounded.match(/"base_url"\s*:\s*"((?:\\.|[^"\\])*)"/)?.[1] ?? ""), Number(bounded.match(/"bandwidth"\s*:\s*(\d+)/)?.[1] ?? 0));
      if (videos.size && audio) break;
    }
    if (videos.size && audio) break;
  }
  const soundtrack = audio;
  if (!soundtrack) return [];
  const best = new Map<string, { url: string; width: number; height: number; rate: number }>();
  for (const video of videos.values()) {
    const key = `${video.width}x${video.height}`;
    if (video.rate > (best.get(key)?.rate ?? -1)) best.set(key, video);
  }
  return [...best.values()].sort((a, b) => b.width * b.height - a.width * a.height).map(v => ({ label: nativeQuality(v.width, v.height), width: v.width, height: v.height, video: v.url, audio: soundtrack.url }));
}