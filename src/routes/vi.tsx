import { createFileRoute } from '@tanstack/react-router';
import { DownloaderPage } from '@/components/downloader-page';
import { downloaderHead } from '@/lib/i18n';
export const Route = createFileRoute('/vi')({
 head: () => downloaderHead('vi', false),
 component: () => <DownloaderPage language="vi" />,
});
