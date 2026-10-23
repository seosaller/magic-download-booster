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

- MP3 conversion runs only in the browser using self-hosted single-thread FFmpeg WASM; the Worker cannot launch native FFmpeg and no paid conversion API is required.
- Keep the shared browser MP3 module and its engine under public/mp3 and copy them into PHP distributions so both versions use the same conversion and cleanup behavior.
- Store the WASM engine gzip-compressed and decompress in-browser to keep individual deployment assets below hosting size limits.
