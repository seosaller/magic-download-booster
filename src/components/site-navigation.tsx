import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const pages = [
  { to: "/facebook-reels-downloader", label: "Reels Downloader" },
  { to: "/about", label: "About" },
  { to: "/help", label: "Help" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return <header className="border-t-4 border-primary bg-card shadow-sm">
    <nav aria-label="Main navigation" className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
      <Button asChild variant="ghost" className="h-auto gap-2 p-0 text-lg font-bold hover:bg-transparent">
        <Link to="/"><span className="grid h-9 w-9 place-items-center rounded-lg hero-gradient text-primary-foreground">FB</span><span>Download Hub</span></Link>
      </Button>
      <div className="flex flex-wrap gap-1">
        <Button asChild variant="ghost" className="text-primary transition active:scale-[0.96]"><Link to="/facebook-reels-downloader" activeProps={{ className: "bg-accent" }}>Reels</Link></Button>
        <Button asChild variant="ghost" className="text-primary transition active:scale-[0.96]"><Link to="/about" activeProps={{ className: "bg-accent" }}>About</Link></Button>
        <Button asChild className="transition active:scale-[0.96]"><Link to="/help">Help</Link></Button>
      </div>
    </nav>
  </header>;
}

export function SiteFooter() {
  return <footer className="mt-auto bg-foreground px-4 py-8 text-center text-sm text-background">
    <nav aria-label="Footer navigation" className="mb-4 flex flex-wrap justify-center gap-x-2 gap-y-1">
      {pages.map(page => <Button asChild variant="ghost" key={page.to} className="text-background transition hover:bg-background/10 hover:text-background active:scale-[0.96]"><Link to={page.to} activeProps={{ className: "underline" }}>{page.label}</Link></Button>)}
    </nav>
    <p>© {new Date().getFullYear()} FB Download Hub</p>
    <p className="mt-2 text-background/70">Download only content you own or have permission to save.</p>
    <p className="mt-2 text-xs text-background/70">Independent service. Not affiliated with Facebook or Meta.</p>
  </footer>;
}