// Lossless browser mux with the same self-hosted single-thread engine as MP3.
const base = new URL('./', import.meta.url);
const MAX_BYTES = 128 * 1024 * 1024;
export async function createVideo(videoSource, audioSource, status = () => {}) {
  let engine, wasmUrl;
  try {
    status('Preparing...');
    const { FFmpeg } = await import(new URL('ffmpeg/index.js', base).href);
    engine = new FFmpeg();
    const response = await fetch(new URL('ffmpeg-core.wasm.gz', base));
    if (!response.ok) throw new Error('Video engine could not load. Please try again.');
    let wasm = await response.arrayBuffer();
    const sig = new Uint8Array(wasm, 0, Math.min(2, wasm.byteLength));
    if (sig[0] === 31 && sig[1] === 139) {
      if (typeof DecompressionStream === 'undefined') throw new Error('Please use an up-to-date browser.');
      wasm = await new Response(new Blob([wasm]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    }
    wasmUrl = URL.createObjectURL(new Blob([wasm], {type:'application/wasm'}));
    await engine.load({classWorkerURL:new URL('ffmpeg/worker.js',base).href, coreURL:new URL('ffmpeg-core.js',base).href, wasmURL:wasmUrl});
    let total = 0;
    for (const [source, name] of [[videoSource,'video.mp4'],[audioSource,'audio.mp4']]) {
      status('Processing...');
      const res = await fetch(source, {signal:AbortSignal.timeout(120000)});
      if (!res.ok || /text\//i.test(res.headers.get('content-type') || '')) throw new Error('Source unavailable. Paste the Facebook link again.');
      if (total + Number(res.headers.get('content-length')) > MAX_BYTES) throw new Error('Video is too large for browser processing.');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Video source unavailable.');
      const chunks = []; let size = 0;
      while (true) {
        const {done,value} = await reader.read(); if (done) break;
        total += value.byteLength; size += value.byteLength;
        if (total > MAX_BYTES) { await reader.cancel(); throw new Error('Video is too large for browser processing.'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.byteLength;}
      await engine.writeFile(name,bytes);
    }
    const code = await engine.exec(['-i','video.mp4','-i','audio.mp4','-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart','output.mp4'],180000);
    if (code !== 0) throw new Error('Video could not be prepared.');
    const bytes = await engine.readFile('output.mp4');
    if (!(bytes instanceof Uint8Array) || !bytes.byteLength) throw new Error('Video returned no data.');
    return new Blob([bytes],{type:'video/mp4'});
  } finally { engine?.terminate(); if (wasmUrl) URL.revokeObjectURL(wasmUrl); }
}
export function saveVideo(blob,quality) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href=url; a.download='fb-video-'+quality.toLowerCase()+'.mp4';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
