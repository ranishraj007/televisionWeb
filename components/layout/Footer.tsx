import Link from "next/link";
import { Radio, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/config";
export function Footer() {
  return <footer className="site-footer shell"><div><Link href="/" className="footer-brand"><Radio size={20} />{siteConfig.name}</Link><p>A little closer to home.</p></div><nav aria-label="Footer"><Link href="/live">All channels</Link><Link href="/guide">Channel guide</Link><Link href="/watch/player-demo">Try the player <ArrowUpRight size={13} /></Link></nav><p className="footer-note">Made for the way you watch.<br /><span>Channel availability is controlled by each broadcaster.</span></p></footer>;
}
