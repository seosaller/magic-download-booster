import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    fbVideo?: {
      createVideo: (video: string, audio: string, status: (value: string) => void) => Promise<Blob>;
      saveVideo: (blob: Blob, quality: string) => void;
    };
  }
}

export function VideoDownload({ video, audio, quality }: { video: string; audio: string; quality: string }) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  async function download() {
    setStatus('Preparing...'); setError('');
    try {
      if (!window.fbVideo) await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'module'; script.src = '/mp3/video-bridge.js';
        script.onload = () => { script.remove(); resolve(); };
        script.onerror = () => { script.remove(); reject(new Error('Video engine could not load. Please try again.')); };
        document.head.appendChild(script);
      });
      const engine = window.fbVideo;
      if (!engine) throw new Error('Video engine could not load. Please try again.');
      engine.saveVideo(await engine.createVideo(video, audio, setStatus), quality);
    } catch (err) { setError(err instanceof Error ? err.message : 'Video download failed. Please try again.'); }
    finally { setStatus(''); }
  }
  return <div className="flex flex-col gap-2">
    <Button type="button" disabled={Boolean(status)} onClick={download} className="h-auto w-full py-3 font-semibold transition active:scale-[0.96] active:brightness-90">
      {status ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Download />}
      {status || `Download ${quality}`}
    </Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}