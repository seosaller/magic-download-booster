import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="border-t-4 border-primary bg-card shadow-sm">
    <nav aria-label="Main navigation" onKeyDown={event => { if (event.key === "Escape") setMenuOpen(false); }} className="container mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <Button asChild variant="ghost" className="h-auto min-w-0 justify-self-start gap-2 p-0 text-lg font-bold hover:bg-transparent data-[status=active]:text-primary">
        <Link to="/" activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hero-gradient text-primary-foreground">FB</span><span className="min-w-0 truncate">Download Hub</span></Link>
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={menuOpen ? "Close menu" : "Open menu"} title={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="header-menu" onClick={() => setMenuOpen(open => !open)} className="size-11 shrink-0 justify-self-end text-primary transition active:scale-[0.96] lg:hidden">
        {menuOpen ? <X /> : <Menu />}
      </Button>
      <div id="header-menu" className={`${menuOpen ? "grid" : "hidden"} col-span-2 min-w-0 gap-2 pt-4 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:flex lg:items-center lg:justify-center lg:gap-1 lg:pt-0`}>
        <Button asChild variant="ghost" className="h-11 justify-start text-primary transition active:scale-[0.96] data-[status=active]:bg-primary data-[status=active]:font-semibold data-[status=active]:text-primary-foreground data-[status=active]:hover:bg-primary/90 data-[status=active]:hover:text-primary-foreground lg:h-9 lg:justify-center"><Link to="/facebook-reels-downloader" activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}>Reels</Link></Button>
        <Button asChild variant="ghost" className="h-11 justify-start text-primary transition active:scale-[0.96] data-[status=active]:bg-primary data-[status=active]:font-semibold data-[status=active]:text-primary-foreground data-[status=active]:hover:bg-primary/90 data-[status=active]:hover:text-primary-foreground lg:h-9 lg:justify-center"><Link to="/about" activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}>About</Link></Button>
        <Button asChild variant="ghost" className="h-11 justify-start text-primary transition active:scale-[0.96] data-[status=active]:bg-primary data-[status=active]:font-semibold data-[status=active]:text-primary-foreground data-[status=active]:hover:bg-primary/90 data-[status=active]:hover:text-primary-foreground lg:h-9 lg:justify-center"><Link to="/help" activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}>Help</Link></Button>
      </div>
    </nav>
  </header>;
}

export function SiteFooter() {
  return <footer className="mt-auto bg-foreground px-4 py-8 text-center text-sm text-background">
    <nav aria-label="Footer navigation" className="mx-auto mb-4 grid max-w-3xl grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-center">
      {pages.map(page => <Button asChild variant="ghost" key={page.to} className="h-auto min-h-11 min-w-0 whitespace-normal text-background transition hover:bg-background/10 hover:text-background active:scale-[0.96] data-[status=active]:bg-background/15 data-[status=active]:font-semibold data-[status=active]:underline data-[status=active]:underline-offset-4"><Link to={page.to} activeOptions={{ exact: true }}>{page.label}</Link></Button>)}
    </nav>
    <p>© {new Date().getFullYear()} FB Download Hub</p>
    <p className="mt-2 text-background/70">Download only content you own or have permission to save.</p>
    <p className="mt-2 text-xs text-background/70">Independent service. Not affiliated with Facebook or Meta.</p>
  </footer>;
}