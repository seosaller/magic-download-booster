export type FullHdSource = { label: string; height: number; video: string; audio: string; size?: number | undefined };

function decode(value: string) {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))).replace(/\\\//g, "/").replace(/\\"/g, '"').replace(/&amp;/g, "&");
}

/** Select an actual 1080p stream, independently of the highest resolution. */
export function findFullHdSource(html: string): FullHdSource | undefined {
  let video: { url: string; rate: number } | undefined;
  let audio: { url: string; rate: number } | undefined;
  const add = (mime: string, height: number, url: string, rate: number) => {
    if (!/^https:\/\//i.test(url)) return;
    if (mime.startsWith("video") && height === 1080 && (!video || rate > video.rate)) video = { url, rate };
    if (mime.startsWith("audio") && (!audio || rate > audio.rate)) audio = { url, rate };
  };
  for (const text of [html, decode(html)]) {
    for (const match of text.matchAll(/"(?:dash_manifest|dash_manifest_xml_string)"\s*:\s*"((?:\\.|[^"\\])*)"/g)) {
      const xml = decode(match[1] ?? "");
      for (const adaptation of xml.match(/<AdaptationSet\b[\s\S]*?<\/AdaptationSet>/g) ?? [xml]) {
        const inheritedMime = adaptation.match(/<AdaptationSet[^>]*mimeType="([^"]*)"/)?.[1] ?? "";
        for (const rep of adaptation.match(/<Representation\b[\s\S]*?<\/Representation>/g) ?? []) {
          const attr = (name: string) => rep.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";
          const url = decode(rep.match(/<BaseURL>([\s\S]*?)<\/BaseURL>/)?.[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          add(attr("mimeType") || inheritedMime, Number(attr("height")), url, Number(attr("bandwidth")));
        }
      }
    }
    for (const segment of text.split(/"representation_id"\s*:/).slice(1)) {
      const chunk = segment.slice(0, 4000);
      const url = decode(chunk.match(/"base_url"\s*:\s*"((?:\\.|[^"\\])*)"/)?.[1] ?? "");
      add(chunk.match(/"mime_type"\s*:\s*"(video|audio)/)?.[1] ?? "", Number(chunk.match(/"height"\s*:\s*(\d+)/)?.[1] ?? 0), url, Number(chunk.match(/"bandwidth"\s*:\s*(\d+)/)?.[1] ?? 0));
    }
  }
  if (!video || !audio) return undefined;
  return { label: "1080p", height: 1080, video: video.url, audio: audio.url };
}