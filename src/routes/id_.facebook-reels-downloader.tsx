import { createFileRoute } from '@tanstack/react-router';
import { DownloaderPage } from '@/components/downloader-page';
import { downloaderHead } from '@/lib/i18n';
export const Route = createFileRoute('/id_/facebook-reels-downloader')({
 head: () => downloaderHead('id', true),
 component: () => <DownloaderPage language="id" reels />,
});
