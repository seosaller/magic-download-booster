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

export function mp3Job(source: string) {
  return {
    tasks: {
      "in-audio": { operation: "import/url", url: source, filename: "source.mp4" },
      "convert-audio": {
        operation: "convert", input: "in-audio", output_format: "mp3",
        filename: "fb-audio.mp3",
      },
      export: { operation: "export/url", input: "convert-audio", inline: false },
    },
    tag: "fb-mp3",
  };
}