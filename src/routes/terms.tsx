import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/info-page";

export const Route = createFileRoute("/terms")({
  head: () => infoHead("Terms of Use", "Read the terms for using FB Download Hub, including copyright, acceptable use and conversion availability."),
  component: Terms,
});

function Terms() {
  return <InfoPage title="Terms of Use" intro="By using FB Download Hub, you agree to use the service responsibly and comply with applicable laws and the rights of content owners.">
    <section><h2>Permission to download</h2><p>Download only content you own or have permission to save. You are responsible for obtaining any necessary permissions and complying with copyright, privacy and other applicable laws. A publicly accessible video is not automatically licensed for downloading or redistribution.</p></section>
    <section><h2>Acceptable use</h2><p>Do not use the service to access private content, bypass access restrictions, infringe another person’s rights, distribute unlawful material or interfere with the service. Respect the terms of Facebook and any other service involved.</p></section>
    <section><h2>Quality and availability</h2><p>Downloads depend on the original media and third-party availability. We do not guarantee that every link will work, that a particular resolution will be available or that conversions will complete. Media URLs may expire; process the original link again if a download stops working.</p></section>
    <section><h2>Conversion services</h2><p>CloudConvert handles MP3 and high-quality video processing. Conversion limits, credits and any charges on your CloudConvert account are governed by your plan with that service. Keep your API key secure.</p></section>
    <section><h2>Disclaimer</h2><p>The service is provided as available, without a guarantee of uninterrupted or error-free operation. To the extent permitted by applicable law, we are not responsible for losses caused by unavailable downloads, third-party failures or misuse of downloaded content. Nothing here excludes rights that cannot legally be excluded.</p></section>
    <section><h2>Updates</h2><p>These terms may change as the service develops. Review this page for the current terms before using the service.</p></section>
  </InfoPage>;
}