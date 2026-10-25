import { createFileRoute } from '@tanstack/react-router';
import { DownloaderPage } from '@/components/downloader-page';
import { downloaderHead } from '@/lib/i18n';
export const Route = createFileRoute('/pt/facebook-reels-downloader')({
 head: () => downloaderHead('pt', true),
 component: () => <DownloaderPage language="pt" reels />,
});
