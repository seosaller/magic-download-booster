import { describe, expect, it } from 'vitest';
import { mediaUrl, nativeFormats } from '../src/lib/fb-formats';
function fixture(sizes: number[][]) {
  return JSON.stringify({ dash_manifest: '<MPD><Period><AdaptationSet mimeType="video/mp4">' + sizes.map(([w,h]) => `<Representation width="${w}" height="${h}" bandwidth="100"><BaseURL>https://video.fbcdn.net/${h}.mp4?a=1&amp;b=2</BaseURL></Representation>`).join('') + '</AdaptationSet><AdaptationSet mimeType="audio/mp4"><Representation bandwidth="192000"><BaseURL>https://video.fbcdn.net/audio.mp4</BaseURL></Representation></AdaptationSet></Period></MPD>' });
}
describe('native website formats', () => {
  it('shows both native 2K and 4K when available', () => expect(nativeFormats(fixture([[2560,1440],[3840,2160]])).links.map(l => l.quality)).toEqual(['2K','4K']));
  it('keeps 2K when 4K is unavailable', () => expect(nativeFormats(fixture([[2560,1440]])).links.map(l => l.quality)).toEqual(['2K']));
  it('never upscales HD into high resolution', () => expect(nativeFormats(fixture([[1920,1080]])).links).toEqual([]));
  it('recognizes portrait native resolutions', () => expect(nativeFormats(fixture([[1440,2560],[2160,3840]])).links.map(l => l.quality)).toEqual(['2K','4K']));
  it('does not offer high resolution without paired audio', () => expect(nativeFormats(fixture([[3840,2160]]).replace('audio/mp4','unknown')).links).toEqual([]));
  it('rejects lookalike media hosts', () => expect(mediaUrl('https://fbcdn.net.evil.example/video.mp4')).toBeUndefined());
  it('keeps signed URL separators intact', () => expect(nativeFormats(fixture([[2560,1440]])).links[0]?.url).toBe('https://video.fbcdn.net/1440.mp4?a=1&b=2'));
});