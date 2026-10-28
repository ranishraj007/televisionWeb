"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Search, Radio, Heart, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { useFavorites } from "@/components/tv/FavoritesProvider";
const navigation = [{ href: "/", label: "Home" }, { href: "/live", label: "Live TV" }, { href: "/categories", label: "Categories" }, { href: "/favorites", label: "Favorites" }];
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { ids, ready } = useFavorites();
  useEffect(() => { if (!open) return; const close = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [open]);
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand" aria-label={`${siteConfig.name} home`} onClick={() => setOpen(false)}><span className="brand-icon"><Radio size={22} /></span><span>{siteConfig.name.split(" ").slice(0, -1).join(" ")} <b>{siteConfig.name.split(" ").at(-1)}</b><i /></span></Link>
    <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(item => <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}</nav>
    <div className="header-actions"><form action="/live" className="header-search" role="search"><Search size={16} /><input name="q" aria-label="Search channels" placeholder="Find your channel" /><kbd>↵</kbd></form><Link className="icon-button desktop-favorite" href="/favorites" aria-label={`Favorites${ready ? ` (${ids.length})` : ""}`}><Heart size={19} />{ready && ids.length > 0 && <span className="count-dot">{ids.length}</span>}</Link><button className="icon-button mobile-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
  </div>{open && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}<ArrowUpRight size={16} /></Link>)}<form action="/live" role="search"><input name="q" aria-label="Search mobile channels" placeholder="Search channels…" /><button aria-label="Search"><Search size={18} /></button></form></nav>}</header>;
}
