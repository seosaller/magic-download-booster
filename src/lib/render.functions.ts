import { createServerFn } from "@tanstack/react-start";

export type RenderStart = { ok: boolean; jobId?: string; error?: string };
export type RenderStatus = {
  status: "waiting" | "processing" | "finished" | "error";
  progress: number;
  url?: string | undefined;
  error?: string | undefined;
};

const API = "https://api.cloudconvert.com/v2";

function isAllowed(u: string) {
  try {
    const h = new URL(u).hostname;
    return (
      h.endsWith("fbcdn.net") ||
      h.endsWith("facebook.com") ||
      h.endsWith("fbsbx.com")
    );
  } catch {
    return false;
  }
}

export const startRender = createServerFn({ method: "POST" })
  .inputValidator((input: { video: string; audio: string; label: string }) => {
    const video = String(input?.video ?? "");
    const audio = String(input?.audio ?? "");
    const label = String(input?.label ?? "hq").slice(0, 20);
    if (!isAllowed(video) || !isAllowed(audio))
      throw new Error("Invalid source streams.");
    return { video, audio, label };
  })
  .handler(async ({ data }): Promise<RenderStart> => {
    const key = process.env["CLOUDCONVERT_API_KEY"];
    if (!key)
      return {
        ok: false,
        error:
          "High quality render abhi set nahi hai. Site owner ko CloudConvert key add karni hogi.",
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
            "-i video.mp4 -i audio.m4a -c copy -movflags +faststart output/fb-video.mp4",
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
    };
    if (!res.ok || !json?.data?.id)
      return {
        ok: false,
        error:
          json?.message ??
          "Render service ne request accept nahi ki. Thodi der baad koshish karein.",
      };
    return { ok: true, jobId: json.data.id };
  });

export const renderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { jobId: string }) => {
    const jobId = String(input?.jobId ?? "");
    if (!/^[\w-]{10,64}$/.test(jobId)) throw new Error("Invalid job id.");
    return { jobId };
  })
  .handler(async ({ data }): Promise<RenderStatus> => {
    const key = process.env["CLOUDCONVERT_API_KEY"];
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
      return {
        status: "error",
        progress,
        error:
          failed?.message ??
          "Render fail ho gaya. Ho sakta hai ye video merge support na karti ho.",
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
