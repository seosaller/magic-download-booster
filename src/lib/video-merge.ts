// Stream copying preserves the native video resolution and original soundtrack.
export const MAX_LOCAL_VIDEO_BYTES = 256 * 1024 * 1024;
export function assertLocalVideoSize(bytes: number) {
  if (bytes > MAX_LOCAL_VIDEO_BYTES) throw new Error("This file is too large for free browser processing. Use CloudConvert or download HD/SD instead.");
}
export function videoMergeArgs() {
  return ["-i", "video.mp4", "-i", "audio.m4a", "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-movflags", "+faststart", "output.mp4"];
}