// Browser-only MP3 conversion, shared by the website and PHP distribution.
const base = new URL('./', import.meta.url);
const MAX_INPUT_BYTES = 128 * 1024 * 1024;

export async function createMp3(source, onStatus = () => {}) {
  const sources = String(source).split('|').filter(Boolean);
  let lastError;
  for (const one of sources) {
    try { return await createMp3From(one, onStatus); } catch (error) { lastError = error; }
  }
  throw lastError || new Error('MP3 conversion failed. Please try again.');
}

async function createMp3From(source, onStatus) {
  let engine;
  let wasmUrl;
  try {
    onStatus('Preparing...');
    const { FFmpeg } = await import(new URL('ffmpeg/index.js', base).href);
    engine = new FFmpeg();
    const wasmResponse = await fetch(new URL('ffmpeg-core.wasm.gz', base));
    if (!wasmResponse.ok) throw new Error('Audio engine could not load. Please try again.');
    let wasm = await wasmResponse.arrayBuffer();
    const signature = new Uint8Array(wasm, 0, Math.min(2, wasm.byteLength));
    if (signature[0] === 31 && signature[1] === 139) {
      if (typeof DecompressionStream === 'undefined') throw new Error('Please use an up-to-date browser for MP3.');
      wasm = await new Response(new Blob([wasm]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    }
    wasmUrl = URL.createObjectURL(new Blob([wasm], { type: 'application/wasm' }));
    await engine.load({
      classWorkerURL: new URL('ffmpeg/worker.js', base).href,
      coreURL: new URL('ffmpeg-core.js', base).href,
      wasmURL: wasmUrl,
    });
    onStatus('Processing...');
    const response = await fetch(source, { signal: AbortSignal.timeout(60000) });
    if (!response.ok || /text\//i.test(response.headers.get('content-type') || '')) {
      throw new Error('Audio source unavailable. Paste the Facebook link again; HD/SD downloads are still available.');
    }
    if (Number(response.headers.get('content-length')) > MAX_INPUT_BYTES) {
      throw new Error('This video is too large for browser MP3 conversion. HD/SD downloads are still available.');
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Audio source unavailable. Please try again.');
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_INPUT_BYTES) {
        await reader.cancel();
        throw new Error('This video is too large for browser MP3 conversion. HD/SD downloads are still available.');
      }
      chunks.push(value);
    }
    const input = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { input.set(chunk, offset); offset += chunk.byteLength; }
    await engine.writeFile('source.mp4', input);
    let code = await engine.exec(['-i', 'source.mp4', '-map', '0:a:0', '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', 'audio.mp3'], 180000);
    if (code !== 0) code = await engine.exec(['-y', '-i', 'source.mp4', '-vn', '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '2', 'audio.mp3'], 180000);
    if (code !== 0) throw new Error('MP3 could not be created from this video. HD/SD downloads are still available.');
    const output = await engine.readFile('audio.mp3');
    if (!(output instanceof Uint8Array) || output.byteLength === 0) throw new Error('MP3 conversion returned no audio.');
    return new Blob([output], { type: 'audio/mpeg' });
  } catch (error) {
    if (error instanceof Error && error.message) throw error;
    throw new Error('MP3 conversion failed. Please try again; HD/SD downloads are still available.');
  } finally {
    engine?.terminate();
    if (wasmUrl) URL.revokeObjectURL(wasmUrl);
  }
}

export function saveMp3(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fb-audio.mp3';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}