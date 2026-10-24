import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/info-page";

export const Route = createFileRoute("/about")({
  head: () => infoHead("About", "Learn about FB Download Hub, an independent tool for saving public Facebook videos, reels and MP3 audio."),
  component: About,
});

function About() {
  return <InfoPage title="About FB Download Hub" intro="A simple way to save public Facebook videos, reels and their original sound to your device.">
    <section><h2>Videos and original audio</h2><p>FB Download Hub finds the download options available for a public Facebook link. SD and HD files can be downloaded directly. Higher-quality processing is offered when a suitable source is available. MP3 conversion preserves the sound in the source, including speech and music.</p></section>
    <section><h2>Availability</h2><p>Video quality depends on the original upload. Private, friends-only and login-restricted videos are not supported. Conversions use CloudConvert and depend on service availability and conversion credits.</p></section>
    <section><h2>Respect creators</h2><p>Only download content that you own or have permission to save. Public availability does not mean a video is free of copyright restrictions.</p></section>
    <section><h2>Independent service</h2><p>FB Download Hub is not affiliated with, endorsed by or sponsored by Facebook, Meta or CloudConvert. Their names and trademarks belong to their respective owners.</p></section>
  </InfoPage>;
}