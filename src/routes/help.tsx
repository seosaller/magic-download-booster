import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/info-page";

export const Route = createFileRoute("/help")({
  head: () => infoHead("Help & FAQ", "Get help with Facebook video downloads, MP3 conversion, expired links and CloudConvert errors."),
  component: Help,
});

function Help() {
  return <InfoPage title="Help & FAQ" intro="Answers to common download and conversion questions.">
    <section><h2>How do I download a video?</h2><p>Copy the link from the public video’s Share menu on Facebook. Paste it into the downloader and select Download. Once the available files appear, choose a quality to save the file to your device.</p></section>
    <section><h2>Why can’t my video be found?</h2><p>Check that the link opens a public video or reel. Private, friends-only, deleted and login-restricted content is not supported. Facebook may also temporarily restrict access to a video.</p></section>
    <section><h2>What sound does MP3 include?</h2><p>MP3 contains the sound available in the original source, including speech and music together. It does not separate vocals from music or add sound to a silent video.</p></section>
    <section><h2>Why is conversion taking longer?</h2><p>MP3 and high-quality video processing require a conversion service. Keep the page open until the file is ready. If processing fails or times out, try again. Direct HD/SD downloads remain independent of conversions.</p></section>
    <section><h2>What if conversion credits run out?</h2><p>Use direct HD/SD downloads, add your own valid CloudConvert API key when prompted or retry when conversion credits are available. Credit allowances depend on the CloudConvert account and plan.</p></section>
    <section><h2>Why does a download say the file is unavailable?</h2><p>The source link may have expired or the file may no longer be accessible. Paste the original Facebook link again to retrieve fresh download options. If your browser blocks the download, check its download permissions and try opening the site directly.</p></section>
    <section><h2>Why doesn’t Paste work?</h2><p>Your browser may deny clipboard access. Paste the link into the input manually or allow clipboard access for this site.</p></section>
  </InfoPage>;
}