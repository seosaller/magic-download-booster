import { createServerFn } from "@tanstack/react-start";
import { isFacebookMediaUrl, mp3Job, parseMp3Bitrate } from "./mp3";

export type RenderStart = {
  ok: boolean;
  jobId?: string;
  error?: string;
  code?: "credits" | "config" | "other";
};
export type RenderStatus = {
  status: "waiting" | "processing" | "finished" | "error";
  progress: number;
  url?: string | undefined;
  size?: number | undefined;
  error?: string | undefined;
  code?: "credits" | "other" | undefined;
};

const API = "https://api.cloudconvert.com/v2";

export const startMp3 = createServerFn({ method: "POST" })
  .inputValidator((input: { source?: string; tiktokId?: string; platform?: "tiktok" | "douyin" | "kuaishou"; apiKey?: string; bitrate?: number }) => {
    const source = String(input?.source ?? "");
    const tiktokId = input?.tiktokId;
    const platform = input?.platform || "tiktok";
    if (tiktokId ? !(platform === "kuaishou" ? /^[a-zA-Z0-9]{10,32}$/ : /^\d{10,25}$/).test(tiktokId) : !isFacebookMediaUrl(source)) throw new Error("Invalid audio source.");
    if (platform !== "tiktok" && platform !== "douyin" && platform !== "kuaishou") throw new Error("Invalid download platform.");
    return { source, tiktokId, platform, apiKey: String(input?.apiKey ?? "").trim().slice(0, 600), bitrate: parseMp3Bitrate(input?.bitrate) };
  })
  .handler(async ({ data }): Promise<RenderStart> => {
    const key = data.apiKey || process.env["CLOUDCONVERT_API_KEY"];
    if (!key) return { ok: false, code: "config", error: "Add your CloudConvert API key to convert to MP3. HD/SD downloads are still available." };
    try {
      // Convert the complete playable video; music-only fields can omit speech.
      const source = data.tiktokId
        ? (await (await import("./tiktok.server")).getTikTokVideo(data.platform === "kuaishou" ? `https://www.kuaishou.com/short-video/${data.tiktokId}` : data.platform === "douyin" ? `https://www.douyin.com/video/${data.tiktokId}` : `https://www.tiktok.com/@video/video/${data.tiktokId}`)).play
        : data.source;
      const body = data.tiktokId
        ? { ...mp3Job(source, data.bitrate), tasks: { ...mp3Job(source, data.bitrate).tasks, "in-audio": { operation: "import/upload", filename: "source.mp4" } } }
        : mp3Job(source, data.bitrate);
      const response = await fetch(`${API}/jobs`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await response.json() as { data?: { id?: string; tasks?: { name: string; result?: { form?: { url?: string; parameters?: Record<string, string> } } }[] }; code?: string; message?: string };
      if (!response.ok || !json.data?.id) {
        const credits = json.code === "CREDITS_EXCEEDED" || /credit/i.test(json.message ?? "");
        const config = response.status === 401 || response.status === 403;
        return { ok: false, code: credits ? "credits" : config ? "config" : "other", error: credits ? "MP3 conversion credits have run out. Add your CloudConvert API key or try again when credits renew. HD/SD downloads are still available." : config ? "Your CloudConvert API key is invalid or does not allow conversions. Please check your key." : "MP3 conversion could not start. Please try again later. HD/SD downloads are still available." };
      }
      if (data.tiktokId) {
        // Fetch with TikTok's required headers, then upload the actual video.
        // CloudConvert cannot reliably import TikTok's signed CDN URLs itself.
        const form = json.data.tasks?.find(task => task.name === "in-audio")?.result?.form;
        if (!form?.url || !form.parameters || !/^https:\/\//.test(form.url)) return { ok: false, code: "other", error: "MP3 upload could not start. Please try again." };
        const { pullTikTokMedia } = await import("./tiktok.server");
        let media = await pullTikTokMedia(source, null, data.platform);
        if (!media?.ok && data.platform === "tiktok") media = await pullTikTokMedia(`https://www.tikwm.com/video/media/play/${data.tiktokId}.mp4`, null);
        if (!media?.ok || !media.body) return { ok: false, code: "other", error: "The original audio could not be retrieved. Please process the link again." };
        const limit = 64 * 1024 * 1024;
        if (Number(media.headers.get("content-length")) > limit) { await media.body.cancel(); return { ok: false, code: "other", error: "This video is too large for MP3 conversion. Video downloads remain available." }; }
        const reader = media.body.getReader();
        const chunks: Uint8Array<ArrayBuffer>[] = [];
        let bytes = 0;
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > limit) { await reader.cancel(); return { ok: false, code: "other", error: "This video is too large for MP3 conversion. Video downloads remain available." }; }
          chunks.push(new Uint8Array(chunk.value));
        }
        const upload = new FormData();
        for (const [name, value] of Object.entries(form.parameters)) upload.append(name, value);
        upload.append("file", new Blob(chunks, { type: "video/mp4" }), "source.mp4");
        const uploaded = await fetch(form.url, { method: "POST", body: upload, signal: AbortSignal.timeout(60000) });
        if (!uploaded.ok) return { ok: false, code: "other", error: "MP3 upload failed. Please try again." };
      }
      return { ok: true, jobId: json.data.id };
    } catch {
      return { ok: false, code: "other", error: "Unable to connect to the MP3 conversion service. Please try again." };
    }
  });

function isAllowed(u: string) {
  return isFacebookMediaUrl(u);
}

export const startRender = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      video: string;
      audio: string;
      label: string;
      apiKey?: string;
    }) => {
      const video = String(input?.video ?? "");
      const audio = String(input?.audio ?? "");
      const label = String(input?.label ?? "hq").slice(0, 20);
      const apiKey = String(input?.apiKey ?? "").trim().slice(0, 600);
      if (!isAllowed(video) || !isAllowed(audio))
        throw new Error("Invalid source streams.");
      return { video, audio, label, apiKey };
    },
  )
  .handler(async ({ data }): Promise<RenderStart> => {
    const key = data.apiKey || process.env["CLOUDCONVERT_API_KEY"];
    if (!key)
      return {
        ok: false,
        code: "config",
        error:
          "High-quality video processing is not configured. Add your CloudConvert API key.",
      };

    const body = {
      tasks: {
        "in-video": {
          operation: "import/url",
          url: data.video,
          filename: "video.mp4",
        },
        "in-audio": {
          operation: "import/url",
          url: data.audio,
          filename: "audio.m4a",
        },
        merge: {
          operation: "command",
          input: ["in-video", "in-audio"],
          engine: "ffmpeg",
          command: "ffmpeg",
          arguments:
            "-i /input/in-video/video.mp4 -i /input/in-audio/audio.m4a -c copy -movflags +faststart /output/fb-video.mp4",
          capture_output: false,
        },
        export: { operation: "export/url", input: ["merge"], inline: false },
      },
      tag: `fb-${data.label}`,
    };

    const res = await fetch(`${API}/jobs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      data?: { id?: string };
      message?: string;
      code?: string;
    };
    if (!res.ok || !json?.data?.id) {
      const credits =
        json?.code === "CREDITS_EXCEEDED" ||
        /credit/i.test(json?.message ?? "");
      return {
        ok: false,
        code: credits ? "credits" : "other",
        error: credits
          ? "Video conversion credits have run out. Add your CloudConvert API key or try again when credits renew."
          : "The video conversion service could not accept the request. Please try again later.",
      };
    }
    return { ok: true, jobId: json.data.id };
  });

export const renderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { jobId: string; apiKey?: string }) => {
    const jobId = String(input?.jobId ?? "");
    const apiKey = String(input?.apiKey ?? "").trim().slice(0, 600);
    if (!/^[\w-]{10,64}$/.test(jobId)) throw new Error("Invalid job id.");
    return { jobId, apiKey };
  })
  .handler(async ({ data }): Promise<RenderStatus> => {
    const key = data.apiKey || process.env["CLOUDCONVERT_API_KEY"];
    if (!key)
      return { status: "error", progress: 0, error: "Render not configured." };

    const res = await fetch(`${API}/jobs/${data.jobId}?include=tasks`, {
      headers: { authorization: `Bearer ${key}` },
    });
    const json = (await res.json()) as {
      data?: {
        status?: string;
        tasks?: {
          name: string;
          operation: string;
          status: string;
          percent?: number;
          message?: string;
          result?: { files?: { url?: string; size?: number; filename?: string }[] };
        }[];
      };
    };
    const job = json?.data;
    if (!job) return { status: "error", progress: 0, error: "Job not found." };

    const tasks = job.tasks ?? [];
    const done = tasks.filter((t) => t.status === "finished").length;
    const progress = Math.min(
      98,
      Math.round((done / Math.max(1, tasks.length)) * 100),
    );

    if (job.status === "error") {
      const failed = tasks.find((t) => t.status === "error");
      const msg = failed?.message ?? "";
      const credits = /credit/i.test(msg);
      return {
        status: "error",
        progress,
        code: credits ? "credits" : "other",
        error: credits
          ? "Video conversion credits have run out. Add your CloudConvert API key or use the HD/SD downloads."
          : "Video processing failed. This video may not support combining its audio and video streams.",
      };
    }

    if (job.status === "finished") {
      const exp = tasks.find((t) => t.operation === "export/url");
      const url = exp?.result?.files?.[0]?.url;
      if (!url)
        return { status: "error", progress: 100, error: "Output file missing." };
      const file = exp?.result?.files?.[0];
      const outputFile = tasks.find((t) => t.operation === "convert" || t.operation === "command")?.result?.files?.find((f) => !file?.filename || f.filename === file.filename);
      const bytes = file?.size ?? outputFile?.size;
      const size = typeof bytes === "number" && Number.isFinite(bytes) && bytes > 0 ? bytes : undefined;
      return { status: "finished", progress: 100, url, size };
    }

    return {
      status: job.status === "waiting" ? "waiting" : "processing",
      progress,
    };
  });
