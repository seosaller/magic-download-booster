import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/info-page";

export const Route = createFileRoute("/privacy")({
  head: () => infoHead("Privacy Policy", "How FB Download Hub handles submitted links, conversion requests, browser storage and third-party services."),
  component: Privacy,
});

function Privacy() {
  return <InfoPage title="Privacy Policy" intro="This policy describes the information used when you process a link or download a file through FB Download Hub.">
    <section><h2>Links and download requests</h2><p>The Facebook link you submit is sent to our service to retrieve public video information and available media. Download requests include the media URL and file format so the file can be delivered to your device. Do not submit private information or links you do not have permission to use.</p></section>
    <section><h2>Audio and video conversions</h2><p>Free high-quality video processing combines media in your browser after retrieving the source streams through our download service. It does not send a conversion job to CloudConvert. MP3 and the optional CloudConvert video fallback share source media URLs and conversion instructions with CloudConvert to create the requested file. Its own privacy policy and retention practices apply to that processing.</p></section>
    <section><h2>Your optional API key</h2><p>If you save your own CloudConvert API key, it is stored in your browser’s local storage. It is also sent to our service when you start a conversion or check its status, so the request can be authenticated with CloudConvert. Never share your key publicly. To remove it, clear this site’s stored data in your browser settings.</p></section>
    <section><h2>Technical information</h2><p>Hosting and connected services may process technical information such as IP addresses, request details and error diagnostics to operate the service and investigate failures. Do not include passwords or sensitive personal information in submitted links.</p></section>
    <section><h2>Third-party websites</h2><p>Facebook and CloudConvert operate independently from this site. Visiting their websites or using their services is subject to their own terms and privacy policies.</p></section>
    <section><h2>Changes and questions</h2><p>This policy may be updated when the service changes. Please review it before using the service. See our Contact page for the current availability of privacy support.</p></section>
  </InfoPage>;
}