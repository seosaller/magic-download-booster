import { createServerFn } from "@tanstack/react-start";
import { isFacebookMediaUrl, mp3Job } from "./mp3";

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
  error?: string | undefined;
  code?: "credits" | "other" | undefined;
};

const API = "https://api.cloudconvert.com/v2";

export const startMp3 = createServerFn({ method: "POST" })
  .inputValidator((input: { source: string; apiKey?: string }) => {
    const source = String(input?.source ?? "");
    if (!isFacebookMediaUrl(source)) throw new Error("Invalid audio source.");
    return { source, apiKey: String(input?.apiKey ?? "").trim().slice(0, 600) };
  })
  .handler(async ({ data }): Promise<RenderStart> => {
    const key = data.apiKey || process.env["CLOUDCONVERT_API_KEY"];
    if (!key) return { ok: false, code: "config", error: "MP3 conversion ke liye CloudConvert key add karein. HD/SD downloads available hain." };
    try {
      const response = await fetch(`${API}/jobs`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify(mp3Job(data.source)),
      });
      const json = await response.json() as { data?: { id?: string }; code?: string; message?: string };
      if (!response.ok || !json.data?.id) {
        const credits = json.code === "CREDITS_EXCEEDED" || /credit/i.test(json.message ?? "");
        const config = response.status === 401 || response.status === 403;
        return { ok: false, code: credits ? "credits" : config ? "config" : "other", error: credits ? "MP3 conversion credits khatam hain. Apni CloudConvert key add karein ya credits renew hone par retry karein. HD/SD ab bhi available hain." : config ? "CloudConvert key valid nahi hai ya conversion ki permission nahi hai. Apni key check karein." : "MP3 conversion shuru nahi hui. Thodi der baad retry karein; HD/SD available hain." };
      }
      return { ok: true, jobId: json.data.id };
    } catch {
      return { ok: false, code: "other", error: "MP3 service se connection nahi hua. Dobara koshish karein." };
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
          "High quality render abhi set nahi hai. Apni free CloudConvert API key add karein.",
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
          ? "Render ke free credits khatam ho gaye hain. Apni free CloudConvert API key add karein (roz 25 free render) ya kal dobara koshish karein."
          : (json?.message ??
            "Render service ne request accept nahi ki. Thodi der baad koshish karein."),
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
          result?: { files?: { url?: string }[] };
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
          ? "Render ke free credits khatam ho gaye hain. Apni free CloudConvert API key add karein ya HD/SD download karein."
          : (msg ||
            "Render fail ho gaya. Ho sakta hai ye video merge support na karti ho."),
      };
    }

    if (job.status === "finished") {
      const exp = tasks.find((t) => t.operation === "export/url");
      const url = exp?.result?.files?.[0]?.url;
      if (!url)
        return { status: "error", progress: 100, error: "Output file missing." };
      return { status: "finished", progress: 100, url };
    }

    return {
      status: job.status === "waiting" ? "waiting" : "processing",
      progress,
    };
  });
