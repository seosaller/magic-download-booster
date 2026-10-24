import { expect, it } from 'vitest';
import { checkedMedia, decodeMedia } from '../src/lib/media-download';
it('rejects empty downloads', async () => { await expect(checkedMedia(new Response(new Uint8Array()), 'mp4')).rejects.toThrow('empty file'); });
it('rejects error pages disguised as video', async () => { await expect(checkedMedia(new Response('<html>Unavailable media file</html>'), 'mp4')).rejects.toThrow('playable file'); });
it('keeps signed media query encoding unchanged', () => { expect(decodeMedia('https:\\/\\/video.fbcdn.net/v.mp4?token=a%26b%2Bc\\u0026x=1')).toBe('https://video.fbcdn.net/v.mp4?token=a%26b%2Bc&x=1'); });
it('accepts nonempty MP4 file signatures', async () => { const data = new Uint8Array(24); data.set([102,116,121,112],4); expect((await checkedMedia(new Response(data), 'mp4')).size).toBe(24); });