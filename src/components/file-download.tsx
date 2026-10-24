import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkedMedia } from '@/lib/media-download';

export function FileDownload({ source, filename, kind, label }: { source: string; filename: string; kind: 'mp4' | 'jpg'; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState<Blob | null>(null);
  function save(blob: Blob) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function download() {
    if (ready) { save(ready); return; }
    setBusy(true); setError('');
    try {
      const blob = await checkedMedia(await fetch(source, { signal: AbortSignal.timeout(120000) }), kind);
      setReady(blob);
      // Safari needs a fresh user click after the file is fetched.
      if (!/AppleWebKit/.test(navigator.userAgent) || /Chrome|Chromium|Edg/.test(navigator.userAgent)) save(blob);
    } catch (err) { setError(err instanceof Error ? err.message : 'Download failed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-col gap-2">
    <Button type="button" variant={kind === 'jpg' ? 'outline' : 'default'} onClick={download} disabled={busy} className="h-auto w-full py-3 text-sm font-semibold transition active:scale-[0.96] active:brightness-90">
      {busy && <LoaderCircle className="animate-spin motion-reduce:animate-none" />}{busy ? 'Processing...' : label}
    </Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}