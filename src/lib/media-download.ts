export async function checkedMedia(response: Response, kind: 'mp4' | 'jpg'): Promise<Blob> {
  if (!response.ok) throw new Error('File unavailable. Paste the Facebook link again.');
  const blob = await response.blob();
  if (blob.size < 16) throw new Error('Facebook returned an empty file. Paste the link again.');
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const valid = kind === 'mp4'
    ? String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp'
    : (bytes[0] === 255 && bytes[1] === 216) || (bytes[0] === 137 && bytes[1] === 80) || String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF';
  if (!valid) throw new Error('Facebook did not return a playable file. Paste the link again.');
  return blob;
}

export function decodeMedia(raw: string): string {
  try { return JSON.parse('"' + raw + '"').replace(/&amp;/g, '&'); }
  catch { return raw.replace(/\\\//g, '/').replace(/&amp;/g, '&'); }
}