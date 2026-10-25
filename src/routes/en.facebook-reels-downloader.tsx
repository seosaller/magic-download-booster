import { createFileRoute } from '@tanstack/react-router';
import { DownloaderPage } from '@/components/downloader-page';
import { downloaderHead } from '@/lib/i18n';
export const Route = createFileRoute('/en/facebook-reels-downloader')({
 head: () => downloaderHead('en', true),
 component: () => <DownloaderPage language="en" reels />,
});
