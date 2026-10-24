"""Run with python3 tests/mp3_conversion.py while the preview is running."""
import asyncio
import json
import subprocess
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    with tempfile.TemporaryDirectory(prefix='mp3-test-') as folder:
        fixture = Path(folder) / 'input.mp4'
        output = Path(folder) / 'output.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i',
                        'color=c=blue:s=320x180:d=2', '-f', 'lavfi', '-i',
                        'sine=frequency=440:duration=2', '-c:v', 'libx264',
                        '-c:a', 'aac', '-shortest', str(fixture)], check=True)
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(viewport={'width': 1280, 'height': 1800})
            await page.goto('http://localhost:8080', wait_until='networkidle')
            await page.route('**/test-audio-source', lambda route: route.fulfill(
                path=str(fixture), content_type='video/mp4'))
            await page.route('**/missing-audio-source', lambda route: route.fulfill(
                status=404, body='Unavailable', content_type='text/plain'))
            async with page.expect_download(timeout=180000) as event:
                await page.evaluate('''async () => {
                    const m = await import('/mp3/download.js');
                    m.saveMp3(await m.createMp3('/missing-audio-source|/test-audio-source'));
                }''')
            download = await event.value
            assert download.suggested_filename == 'fb-audio.mp3'
            await download.save_as(str(output))
            await browser.close()
        info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error',
            '-show_entries', 'stream=codec_name,codec_type', '-of', 'json', str(output)]))
        assert info['streams'] == [{'codec_name': 'mp3', 'codec_type': 'audio'}], info
        print('PASS: unavailable audio falls back to video and downloads real MP3 audio only.')


asyncio.run(main())