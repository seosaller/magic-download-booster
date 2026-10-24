import { XMLParser } from 'fast-xml-parser';

export type NativeVideo = { quality: string; url: string; audioUrl: string; width: number; height: number };
type Stream = { url: string; width: number; height: number; bandwidth: number };
const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', processEntities: true });

export function mediaUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  try {
    const url = new URL(value.replace(/&amp;/g, '&'));
    if (url.protocol === 'https:' && /(^|\.)(fbcdn\.net|facebook\.com|fbsbx\.com)$/i.test(url.hostname)) return url.href;
  } catch { /* Invalid media URL. */ }
  return undefined;
}

export function nativeFormats(html: string): { links: NativeVideo[]; audio: string | undefined } {
  const videos: Stream[] = [];
  const audios: Stream[] = [];
  const seen = new Set<string>();
  function manifest(text: string) {
    if (!text.includes('<MPD') || seen.has(text)) return;
    seen.add(text);
    try {
      const tree = xml.parse(text);
      function walk(node: unknown, mime = '') {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(item => walk(item, mime)); return; }
        const row = node as Record<string, unknown>;
        const kind = String(row['mimeType'] ?? row['contentType'] ?? mime);
        const base = row['BaseURL'];
        const url = mediaUrl(typeof base === 'object' && base ? (base as Record<string, unknown>)['#text'] : base);
        const width = Number(row['width']) || 0, height = Number(row['height']) || 0;
        if (url) {
          const stream = { url, width, height, bandwidth: Number(row['bandwidth']) || 0 };
          if (width > 0 && height > 0) videos.push(stream);
          else if (/audio/i.test(kind)) audios.push(stream);
        }
        Object.values(row).forEach(child => walk(child, kind));
      }
      walk(tree);
    } catch { /* Ignore malformed manifests; retain the ordinary HD/SD links. */ }
  }
  function walkJson(node: unknown, depth = 0) {
    if (depth > 35 || !node) return;
    if (typeof node === 'string') {
      manifest(node);
      if ((node.startsWith('{') || node.startsWith('[')) && node.includes('dash')) {
        try { walkJson(JSON.parse(node), depth + 1); } catch { /* Not embedded JSON. */ }
      }
    } else if (typeof node === 'object') {
      Object.values(node).forEach(child => walkJson(child, depth + 1));
    }
  }
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walkJson(JSON.parse(match[1] ?? '')); } catch { /* Script is executable JS. */ }
  }
  // JSON string decoding preserves signed URLs; never URL-decode a media URL.
  for (const match of html.matchAll(/"(?:dash_manifest|dash_manifest_xml|playlist)"\s*:\s*("(?:\\.|[^"\\])*")/g)) {
    try { manifest(JSON.parse(match[1] ?? '')); } catch { /* Invalid JSON string. */ }
  }
  for (const match of html.matchAll(/<MPD\b[\s\S]*?<\/MPD>/g)) manifest(match[0]);
  const audio = audios.sort((a, b) => b.bandwidth - a.bandwidth)[0]?.url;
  const links: NativeVideo[] = [];
  if (audio) {
    for (const [quality, minimum, maximum] of [['2K', 1440, 2160], ['4K', 2160, Infinity]] as const) {
      const stream = videos.filter(v => Math.min(v.width, v.height) >= minimum && Math.min(v.width, v.height) < maximum)
        .sort((a, b) => b.bandwidth - a.bandwidth)[0];
      if (stream) links.push({ quality, url: stream.url, audioUrl: audio, width: stream.width, height: stream.height });
    }
  }
  return { links, audio };
}