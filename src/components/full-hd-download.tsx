import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FullHdSource } from "@/lib/full-hd";
import type { VideoLink } from "@/lib/full-hd-fallback";

export function FullHdDownload({ source, fallback }: { source?: FullHdSource | undefined; fallback?: VideoLink | undefined }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState<{ url: string; size: number } | null>(null);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const file = useRef<string | null>(null);
  useEffect(() => () => {
    controller.current?.abort();
    if (file.current) URL.revokeObjectURL(file.current);
  }, []);
  async function process() {
    if (!source || state === "working") return;
    const current = new AbortController();
    controller.current = current;
    setState("working");
    setError("");
    try {
      const { mergeBrowserVideo } = await import("@/lib/browser-video");
      const result = await mergeBrowserVideo(source.video, source.audio, current.signal, setProgress);
      if (current.signal.aborted) { URL.revokeObjectURL(result.url); return; }
      file.current = result.url;
      setOutput(result);
      setState("done");
    } catch (e) {
      if (current.signal.aborted) return;
      setError(e instanceof Error ? e.message : "1080p processing failed. Please try again.");
      setState("error");
    }
  }
  const size = output?.size ?? source?.size;
  const sizeLabel = size ? ` · ${state === "done" ? "" : "~"}${(size / 1e6).toFixed(1)} MB` : "";
  if (!source && fallback) return <Button asChild variant="success" className="h-auto w-full whitespace-normal py-3 transition active:scale-[0.96] active:brightness-90"><a title="Downloads the available HD source when native 1080p is unavailable" href={`/api/public/download?type=mp4&name=fb-video-hd&url=${encodeURIComponent(fallback.url)}`}><Download />Download 1080P{fallback.size ? ` · ${(fallback.size / 1e6).toFixed(1)} MB` : ""}</a></Button>;
  return <>
    {output && state === "done" ? <Button asChild variant="success" className="h-auto w-full whitespace-normal py-3 transition active:scale-[0.96] active:brightness-90"><a href={output.url} download="fb-video-1080p.mp4"><Download />Download 1080P{sizeLabel}</a></Button> : <Button type="button" variant="outline" disabled={!source || state === "working"} onClick={() => void process()} className="h-auto w-full whitespace-normal border-primary py-3 text-primary transition active:scale-[0.96] active:brightness-90">
      {state === "working" ? <LoaderCircle className="motion-safe:animate-spin" /> : <Download />}
      {state === "working" ? `Processing 1080p… ${Math.round(progress)}%` : !source ? "1080p · Not available" : `Download 1080P${sizeLabel}`}
    </Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </>;
}