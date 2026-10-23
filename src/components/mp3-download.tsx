import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Mp3Module = {
  createMp3: (source: string, onStatus: (status: string) => void) => Promise<Blob>;
  saveMp3: (blob: Blob) => void;
};

export function Mp3Download({ source }: { source: string }) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  async function download() {
    setStatus('Preparing...');
    setError('');
    try {
      const moduleUrl = '/mp3/download.js';
      const audio = await import(/* @vite-ignore */ moduleUrl) as Mp3Module;
      const blob = await audio.createMp3(source, setStatus);
      audio.saveMp3(blob);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'MP3 conversion failed. Please try again.');
    } finally {
      setStatus('');
    }
  }
  return <div className="flex flex-col gap-2">
    <Button type="button" disabled={Boolean(status)} onClick={download} className="h-auto w-full py-3 font-semibold transition active:scale-[0.96] active:brightness-90">
      {status ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Download />}
      {status || 'Download MP3 Audio'}
    </Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}