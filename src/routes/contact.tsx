import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/info-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => infoHead("Contact", "Support availability and information to include when reporting a download problem or rights concern to FB Download Hub."),
  component: Contact,
});

function Contact() {
  return <InfoPage title="Contact" intro="For common download issues, start with our Help & FAQ page.">
    <Button asChild variant="outline" className="text-primary transition active:scale-[0.96]"><Link to="/help">Open Help & FAQ</Link></Button>
    <section><h2>Support availability</h2><p>A support email address has not yet been published. This page does not currently accept messages.</p></section>
    <section><h2>Reporting a download problem</h2><p>When a support channel becomes available, include the public Facebook link, the file format you tried, your browser and the exact error message. Do not share your API key, passwords or private account information.</p></section>
    <section><h2>Privacy and content rights</h2><p>For a privacy question or rights concern, describe the affected content and your relationship to it. FB Download Hub does not control content hosted on Facebook; requests to remove the original video should also be directed to Facebook or its uploader.</p></section>
  </InfoPage>;
}