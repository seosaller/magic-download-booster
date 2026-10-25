import { describe, expect, it } from 'vitest';
import { languageFromPath, languagePaths } from './i18n';
describe('language routes', () => {
  it('uses Vietnamese on the root home page', () => { expect(languageFromPath('/')).toBe('vi'); expect(languagePaths.vi.home).toBe('/'); });
  it('uses English at /en and its Reels page', () => { expect(languageFromPath('/en')).toBe('en'); expect(languagePaths.en.reels).toBe('/en/facebook-reels-downloader'); });
  it('uses Portuguese at /pt and its Reels page', () => { expect(languageFromPath('/pt')).toBe('pt'); expect(languagePaths.pt.reels).toBe('/pt/facebook-reels-downloader'); });
  it('uses Indonesian at /id and its Reels page', () => { expect(languageFromPath('/id')).toBe('id'); expect(languagePaths.id.reels).toBe('/id/facebook-reels-downloader'); });
});
