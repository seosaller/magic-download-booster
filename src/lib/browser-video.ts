import coreURL from "../../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js?url";
import wasmAsset from "../../public/wasm/ffmpeg-core.wasm.asset.json";
import classWorkerURL from "./video-worker?worker&url";
import { assertLocalVideoSize, videoMergeArgs } from "./video-merge";

export async function mergeBrowserVideo(video: string, audio: string, signal: AbortSignal, progress: (value: number) => void, expectedHeight?: number): Promise<{ url: string; size: number }> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpeg();
  const controller = new AbortController();
  const stop = () => { controller.abort(); ffmpeg.terminate(); };
  signal.addEventListener("abort", stop, { once: true });
  const timeout = setTimeout(stop, 180_000);
  let total = 0;
  async function readMedia(url: string) {
    const response = await fetch(`/api/public/download?type=mp4&url=${encodeURIComponent(url)}`, { signal: controller.signal });
    if (!response.ok || !response.body || /text\/|application\/json/i.test(response.headers.get("content-type") ?? "")) throw new Error("The video source is unavailable. Paste the Facebook link again or use HD/SD.");
    assertLocalVideoSize(total + Number(response.headers.get("content-length") ?? 0));
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        total += value.byteLength;
        assertLocalVideoSize(total);
        chunks.push(value);
      }
    } catch (error) { await reader.cancel(); throw error; }
    const data = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
    return data;
  }
  try {
    if (signal.aborted) throw new Error("Video processing cancelled.");
    progress(5);
    await ffmpeg.load({ coreURL, wasmURL: wasmAsset.url, classWorkerURL });
    progress(20);
    await ffmpeg.writeFile("video.mp4", await readMedia(video));
    progress(45);
    await ffmpeg.writeFile("audio.m4a", await readMedia(audio));
    progress(65);
    ffmpeg.on("progress", ({ progress: value }) => progress(Math.min(95, 65 + Math.max(0, value) * 30)));
    const code = await ffmpeg.exec(videoMergeArgs(), 120_000);
    if (code !== 0) throw new Error("Free video processing failed. Try CloudConvert or download HD/SD instead.");
    const output = await ffmpeg.readFile("output.mp4");
    if (typeof output === "string" || !output.byteLength) throw new Error("The processed video is empty. Please try again.");
    const blob = new Blob([new Uint8Array(output)], { type: "video/mp4" });
    if (expectedHeight) {
      await ffmpeg.ffprobe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=height", "-of", "default=noprint_wrappers=1:nokey=1", "output.mp4", "-o", "height.txt"], 15_000);
      const metadata = await ffmpeg.readFile("height.txt", "utf8");
      const height = Number(typeof metadata === "string" ? metadata.trim() : "");
      // This WASM core returns -1 even when ffprobe writes valid metadata.
      if (!Number.isInteger(height) || height <= 0) throw new Error("Unable to verify the processed video resolution.");
      if (height !== expectedHeight) throw new Error(`The source is ${height}p, not ${expectedHeight}p. Please use the available HD/SD download instead.`);
    }
    progress(100);
    return { url: URL.createObjectURL(blob), size: blob.size };
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Free video processing stopped or took too long. Try CloudConvert or download HD/SD instead.");
    if (error instanceof Error && /too large|source is unavailable|processing failed|processed video is empty|not \d+p|verify the processed video resolution/.test(error.message)) throw error;
    throw new Error("Free processing is unavailable in this browser or the source could not be loaded. Try CloudConvert or download HD/SD instead.");
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", stop);
    ffmpeg.terminate();
  }
}