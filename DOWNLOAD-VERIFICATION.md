# Facebook download repair verification

## Confirmed defects
- Height-only labeling incorrectly called a 1216×1824 portrait AV1 source “2K”. Native 2K now requires a short edge of at least 1440 pixels; 4K requires 2160. Other native sources show their actual resolution rather than claiming 2K.
- The old DASH parser ignored MIME types inherited from AdaptationSet and selected only one highest stream. The replacement preserves separate native sources and the original audio from the same first complete manifest, excluding recommendation manifests.
- Full-file verification caught cross-post audio selection while implementing this repair: recommendation audio produced a 67.99-second MP3 for a 133.67-second video. A regression prevents mixing manifests; the corrected MP3 is 133.697 seconds.
- GenDownload's adapter discarded all audio formats. Its Facebook alternative now retains validated audio formats for real conversion.
- Facebook MP3 used CloudConvert import/url with potentially expired signed CDN addresses and no Facebook referer. It now refreshes extraction and uploads bounded media bytes retrieved with the required headers. This is a reliability defect in the old path, not proof that the reported production failure had one specific CloudConvert cause.
- The download proxy redirected failed requests to the external CDN, exposing browser CORS failures for processing and silently failing hidden-frame downloads. It now validates all redirect hops, returns same-origin no-store errors, and displays iframe download errors on the page.
- The proxy trusted type=mp3 and could send MP4/M4A bytes with audio/mpeg headers. It now checks MP3 signatures before offering an MP3 attachment. Conversion remains real CloudConvert MP3 encoding at 320 kbps.
- High-resolution browser muxing previously omitted output-resolution checks. Every local output now checks video dimensions and the presence of the original audio before the ready link appears.

## Real-file evidence (preview, 2026-11-17)
Input: https://www.facebook.com/share/v/19yCGooSWf/

- MP3 downloaded by clicking the completed UI link: **5,350,229 bytes**, HTTP audio/mpeg, MP3 codec, **320000 bits/s**, **133.697292 seconds**. Complete FFmpeg decode exited 0.
- Native video downloaded through the UI: **15,128,710 bytes**, MP4 container, AV1 **720×1080**, AAC audio, **133.802667 seconds**. Complete FFmpeg audio/video decode exited 0. This validates the shared local mux engine, not genuine live 2K.
- Original highest video independently probed: AV1 **1216×1824**, not native 2K. The page correctly reports 2K unavailable instead of substituting another quality.
- Correctly labeled highest native source also downloaded through the UI: **32,718,021 bytes**, AV1 **1216×1824** with AAC audio, **133.802667 seconds**, full decode exited 0. Its button now reads 1216p instead of 2K.
- Controlled real-media fixture: browser engine merged separate H.264 **2560×1440** video and AAC audio; downloaded **1,596,980-byte** MP4 verified with ffprobe and a complete error-free decode. Fixture URLs were intercepted in the browser; this is **not** a live Facebook/provider 2K download.
- An invalid/expired Facebook CDN address returned a visible download error; page stayed at /en rather than navigating away. Mobile 390px and tablet 768px showed no horizontal overflow.
- 56 Bun regression tests passed across 15 files. Preview harness's latest build entry: build OK. All content routes already have app-specific leaf metadata.

## Limitations
- The reported production failures were not reproduced with the supplied historical sample: before edits, preview produced both an MP3 and a muxed file. Production-site extraction did not produce a usable result during observation; its exact original failing request/provider response was unavailable.
- A genuine live Facebook 2K source was not available for this sample. The parser rules and real controlled 2K engine output are verified; end-to-end live Facebook 2K remains unverified.
- CloudConvert credentials are configured and account access returned 200; five credits remained at final inspection. Conversion remains subject to credits, provider availability, and a 64 MiB input limit. Browser muxing retains its 256 MiB total limit and cancellation/timeout protections.
- Native AV1 stream copying preserves source quality without transcoding, but older devices without AV1 playback may need a direct HD/SD download. CloudConvert video fallback was retained but not real-file-tested in this request.
- Changes are verified in preview and require publishing before the live URL receives them. No production success is claimed after these edits.