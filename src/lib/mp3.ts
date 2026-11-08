import type { FbResult } from "./fbdl.functions";
import { isGenDownloadMediaUrl } from "./gendownload";

export function mp3Source(result: FbResult): string | undefined {
  return result.render?.audio ?? result.links.find((link) => link.quality === "SD")?.url ?? result.links[0]?.url;
}

export function isFacebookMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" && /(^|\.)(fbcdn\.net|facebook\.com|fbsbx\.com)$/i.test(url.hostname) && !url.username && !url.password) || isGenDownloadMediaUrl(value);
  } catch {
    return false;
  }
}

export type Mp3Bitrate = 320;
export function parseMp3Bitrate(value: unknown): Mp3Bitrate {
  if (value === undefined || value === 320) return 320;
  throw new Error("MP3 downloads support only 320 kbps.");
}

export function mp3Job(source: string, bitrate: Mp3Bitrate = 320) {
  return {
    tasks: {
      "in-audio": { operation: "import/url", url: source, filename: "source.mp4" },
      "convert-audio": {
        operation: "convert", input: "in-audio", output_format: "mp3",
        filename: "fb-audio.mp3",
        engine: "ffmpeg",
        audio_codec: "mp3",
        audio_bitrate: bitrate,
      },
      export: { operation: "export/url", input: "convert-audio", inline: false },
    },
    tag: "fb-mp3",
  };
}