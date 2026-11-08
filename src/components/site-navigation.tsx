import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { copy, languages, languageNames, languagePaths, languageFromPath } from "@/lib/i18n";
import vietnamFlag from "flag-icons/flags/4x3/vn.svg";
import usaFlag from "flag-icons/flags/4x3/us.svg";
import brazilFlag from "flag-icons/flags/4x3/br.svg";
import indonesiaFlag from "flag-icons/flags/4x3/id.svg";
import { tiktokPaths } from "@/lib/tiktok";
import { socialPaths, socialPlatforms, socialPlatformFromPath } from "@/lib/social";

const pages = [
  { to: "/facebook-reels-downloader", label: "Reels Downloader" },
  { to: "/about", label: "About" },
  { to: "/help", label: "Help" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/contact", label: "Contact" },
] as const;

const languageFlags = { vi: vietnamFlag, en: usaFlag, pt: brazilFlag, id: indonesiaFlag };

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function keepLanguageOpen() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }
  function closeLanguageSoon() {
    keepLanguageOpen();
    closeTimer.current = setTimeout(() => setLanguageOpen(false), 180);
  }
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const pathname = useRouterState({ select: state => state.location.pathname });
  const language = languageFromPath(pathname);
  const t = copy[language];
  const paths = languagePaths[language];
  const isReels = pathname.endsWith('/facebook-reels-downloader');
  const isTikTok = pathname.endsWith('/tiktok-downloader');
  const socialPlatform = socialPlatformFromPath(pathname);
  return <header className="border-t-4 border-primary bg-card shadow-sm">
    <nav aria-label="Main navigation" onKeyDown={event => { if (event.key === "Escape") setMenuOpen(false); }} className="container mx-auto grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <Button asChild variant="ghost" className="h-auto min-w-0 justify-self-start gap-2 p-0 text-lg font-bold hover:bg-transparent data-[status=active]:text-primary">
        <Link to={paths.home} activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hero-gradient text-primary-foreground">FB</span><span className="min-w-0 truncate">Download Hub</span></Link>
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={menuOpen ? t.menuClose : t.menuOpen} title={menuOpen ? t.menuClose : t.menuOpen} aria-expanded={menuOpen} aria-controls="header-menu" onClick={() => setMenuOpen(open => !open)} className="size-11 shrink-0 justify-self-end text-primary transition active:scale-[0.96] lg:hidden">
        {menuOpen ? <X /> : <Menu />}
      </Button>
      <div className="justify-self-end lg:col-start-3 lg:row-start-1" onPointerEnter={event => { if (event.pointerType === "mouse") { keepLanguageOpen(); setLanguageOpen(true); } }} onPointerLeave={event => { if (event.pointerType === "mouse") closeLanguageSoon(); }}>
        <DropdownMenu modal={false} open={languageOpen} onOpenChange={open => { keepLanguageOpen(); setLanguageOpen(open); }}><DropdownMenuTrigger asChild><Button variant="outline" className="h-9 gap-1.5 px-2 text-foreground sm:px-3" aria-label={t.language} title={t.language}><img src={languageFlags[language]} alt="" aria-hidden="true" className="h-[18px] w-6 shrink-0 rounded-sm object-cover" /><span className="hidden sm:inline">{languageNames[language]}</span><span className="sm:hidden">{language.toUpperCase()}</span><ChevronDown className={`size-3 transition-transform motion-reduce:transition-none ${languageOpen ? "rotate-180" : ""}`} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" sideOffset={5} className="w-52 p-1.5" onPointerEnter={keepLanguageOpen} onPointerLeave={event => { if (event.pointerType === "mouse") closeLanguageSoon(); }}>
          {languages.map(code => <DropdownMenuItem asChild key={code}><Link to={socialPlatform ? socialPaths[code][socialPlatform] : isTikTok ? tiktokPaths[code] : isReels ? languagePaths[code].reels : languagePaths[code].home} onClick={() => { setMenuOpen(false); setLanguageOpen(false); }} lang={code} className={`flex min-h-11 items-center gap-2.5 px-2 text-sm ${code === language ? "font-semibold text-primary" : "text-foreground"}`}><img src={languageFlags[code]} alt="" aria-hidden="true" className="h-[18px] w-6 shrink-0 rounded-sm object-cover" /><span className="flex-1">{languageNames[code]}{code === "pt" ? " (Brasil)" : ""}</span>{code === language && <Check className="size-4 text-primary" />}</Link></DropdownMenuItem>)}
        </DropdownMenuContent></DropdownMenu>
      </div>
      <div id="header-menu" className={`${menuOpen ? "grid" : "hidden"} col-span-3 min-w-0 gap-2 pt-4 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:flex lg:items-center lg:justify-center lg:gap-1 lg:pt-0`}>
        {socialPlatforms.map(platform => <Button asChild key={platform} variant="ghost" className="h-11 justify-start text-primary transition active:scale-[0.96] data-[status=active]:bg-primary data-[status=active]:font-semibold data-[status=active]:text-primary-foreground lg:h-9 lg:justify-center lg:px-2"><Link to={socialPaths[language][platform]} activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}>{platform === "twitter" ? "Twitter/X" : platform === "douyin" ? "Douyin" : "Threads"}</Link></Button>)}
        <Button asChild variant="ghost" className="h-11 justify-start text-primary transition active:scale-[0.96] data-[status=active]:bg-primary data-[status=active]:font-semibold data-[status=active]:text-primary-foreground lg:h-9 lg:justify-center"><Link to={tiktokPaths[language]} activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}>TikTok</Link></Button>
        <Button asChild variant="ghost" className="h-11 justify-start text-primary transition active:scale-[0.96] data-[status=active]:bg-primary data-[status=active]:font-semibold data-[status=active]:text-primary-foreground data-[status=active]:hover:bg-primary/90 data-[status=active]:hover:text-primary-foreground lg:h-9 lg:justify-center"><Link to={paths.reels} activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}>Reels</Link></Button>
        <Button asChild variant="ghost" className="h-11 justify-start text-primary transition active:scale-[0.96] data-[status=active]:bg-primary data-[status=active]:font-semibold data-[status=active]:text-primary-foreground data-[status=active]:hover:bg-primary/90 data-[status=active]:hover:text-primary-foreground lg:h-9 lg:justify-center"><Link to="/about" activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}>{t.about}</Link></Button>
        <Button asChild variant="ghost" className="h-11 justify-start text-primary transition active:scale-[0.96] data-[status=active]:bg-primary data-[status=active]:font-semibold data-[status=active]:text-primary-foreground data-[status=active]:hover:bg-primary/90 data-[status=active]:hover:text-primary-foreground lg:h-9 lg:justify-center"><Link to="/help" activeOptions={{ exact: true }} onClick={() => setMenuOpen(false)}>{t.help}</Link></Button>
      </div>
    </nav>
  </header>;
}

export function SiteFooter() {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const language = languageFromPath(pathname);
  const t = copy[language];
  const labels = [t.reelsTitle, t.about, t.help, t.privacy, t.terms, t.contact];
  return <footer className="mt-auto bg-foreground px-4 py-8 text-center text-sm text-background">
    <nav aria-label="Footer navigation" className="mx-auto mb-4 grid max-w-3xl grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-center">
      <Button asChild variant="ghost" className="min-h-11 text-background hover:bg-background/10 hover:text-background data-[status=active]:underline"><Link to={tiktokPaths[language]} activeOptions={{ exact: true }}>TikTok</Link></Button>
      {socialPlatforms.map(platform => <Button asChild key={platform} variant="ghost" className="min-h-11 text-background hover:bg-background/10 hover:text-background data-[status=active]:underline"><Link to={socialPaths[language][platform]} activeOptions={{ exact: true }}>{platform === "twitter" ? "Twitter/X" : platform === "douyin" ? "Douyin" : "Threads"}</Link></Button>)}
      {pages.map((page, i) => <Button asChild variant="ghost" key={page.to} className="h-auto min-h-11 min-w-0 whitespace-normal text-background transition hover:bg-background/10 hover:text-background active:scale-[0.96] data-[status=active]:bg-background/15 data-[status=active]:font-semibold data-[status=active]:underline data-[status=active]:underline-offset-4"><Link to={i === 0 ? languagePaths[language].reels : page.to} activeOptions={{ exact: true }}>{labels[i]}</Link></Button>)}
    </nav>
    <p>© {new Date().getFullYear()} FB Download Hub</p>
    <p className="mt-2 text-background/70">{t.rights}</p>
    <p className="mt-2 text-xs text-background/70">{t.independent}</p>
  </footer>;
}