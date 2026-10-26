<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- MP3 jobs use CloudConvert's native conversion task with the original audio stream or playable video as fallback, never an extension rename, so speech and music remain together.
- High-quality video defaults to lazy-loaded, single-thread browser FFmpeg stream copying with bounded media size and cancellable workers; CloudConvert is an explicit fallback, keeping native resolution and sound without requiring conversion credits for local processing.
- Keep processing WASM asset pointers in public/wasm, externalize large binaries with lovable-assets, and load pointer URLs only from browser event-driven code; binary source imports break deployment and large repository files exceed commit limits.
- MP3 and video processing keep independent UI states; CloudConvert jobs share the existing status endpoint, while local video outputs use revocable blob URLs so neither blocks direct video downloads.
- Shared header and footer are mounted around the root Outlet; information pages are separate content routes with their own metadata and use the shared InfoPage layout to keep navigation and typography consistent.
- Home-page informational content is isolated in HomeContent so copy and presentation changes do not modify the downloader's processing or conversion states.
- Video and Reels content routes use the shared DownloaderPage with page-specific copy and supporting content, so downloads and conversion behavior stay consistent without duplicated processing logic.
- Completed conversion downloads use the shared success Button variant and semantic success tokens so ready states remain consistent across themes and pages.
- Native 1080p is selected independently and processed in FullHdDownload; verify output metadata before offering the download, and show unavailable when absent rather than substituting lower-resolution HD.

- Language-specific downloader routes reuse DownloaderPage and shared translation dictionaries; Vietnamese is the unprefixed default, while explicit language routes render the same processing flow without duplication.
- Determine the document language and navigation from the current route, not browser storage, so SSR and language links remain consistent.
- Downloader information layouts share compact reading styles across languages so mobile and tablet spacing and card density stay consistent.
- Validate Facebook links with the shared Zod schema in the browser and server function; restrict page-fetch redirects to approved Facebook hosts to prevent arbitrary outbound requests.
- The TikTok downloader supports TikTok links only (Douyin, Kuaishou and the Evil0ctal API were removed); it resolves through Tikwm browser-first with the server function as fallback, keyed by numeric video ID.
- TikTok thumbnails use the validated ID-based proxy; MP3 conversion uploads the bounded complete playable video fetched with TikTok headers to CloudConvert, avoiding CDN import failures while preserving speech and music and reusing shared status polling.
- Reuse resolved public TikTok sources in a bounded, short-lived server cache to avoid duplicate provider requests during thumbnail loading and downloads; cache misses always resolve and validate again.
- Keep Bun test files outside the application TypeScript compilation to prevent Bun's fetch declarations from overriding Worker/browser fetch types; run the tests with Bun separately.
