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
- Audio and high-quality video conversions keep independent UI states and share the existing job status endpoint, so neither blocks direct video downloads.
- Shared header and footer are mounted around the root Outlet; information pages are separate content routes with their own metadata and use the shared InfoPage layout to keep navigation and typography consistent.
