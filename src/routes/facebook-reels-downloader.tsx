import { createFileRoute } from '@tanstack/react-router';
import { DownloaderPage } from '@/components/downloader-page';
import { downloaderHead } from '@/lib/i18n';
export const Route = createFileRoute('/facebook-reels-downloader')({
 head: () => downloaderHead('vi', true),
 component: () => <DownloaderPage language="vi" reels />,
});
