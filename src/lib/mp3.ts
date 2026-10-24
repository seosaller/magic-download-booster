import type { FbResult } from "./fbdl.functions";

export function mp3Source(result: FbResult): string | undefined {
  return result.render?.audio ?? result.links.find((link) => link.quality === "SD")?.url ?? result.links[0]?.url;
}

export function isFacebookMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)(fbcdn\.net|facebook\.com|fbsbx\.com)$/i.test(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const mp3Qualities = [
  { bitrate: 128, label: "Standard" },
  { bitrate: 192, label: "High" },
  { bitrate: 320, label: "Best" },
] as const;
export type Mp3Bitrate = (typeof mp3Qualities)[number]["bitrate"];
export function parseMp3Bitrate(value: unknown): Mp3Bitrate {
  if (value === undefined) return 320;
  if (value === 128 || value === 192 || value === 320) return value;
  throw new Error("Choose a supported MP3 bitrate: 128, 192 or 320 kbps.");
}

export function mp3Job(source: string, bitrate: Mp3Bitrate = 320) {
  return {
    tasks: {
      "in-audio": { operation: "import/url", url: source, filename: "source.mp4" },
      "convert-audio": {
        operation: "convert", input: "in-audio", output_format: "mp3",
        filename: "fb-audio.mp3",
        audio_bitrate: bitrate,
      },
      export: { operation: "export/url", input: "convert-audio", inline: false },
    },
    tag: "fb-mp3",
  };
}