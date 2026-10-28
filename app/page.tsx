import Link from "next/link";
import { ArrowUpRight, Radio, Play, ArrowRight } from "lucide-react";
import { Hero } from "@/components/tv/Hero";
import { ChannelGrid } from "@/components/tv/ChannelGrid";
import { Guide } from "@/components/tv/Guide";
export default function Home() {
  return (
    <>
      <Hero />
      <section className="shell library-section" id="channels">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <Radio size={14} />
              TUNE INTO YOUR WORLD
            </div>
            <h2>
              Good television. <span>Great company.</span>
            </h2>
          </div>
          <Link href="/live" className="text-link">
            All channels
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <ChannelGrid compact />
        <p className="availability-note">
          Channels from your supplied playlist. The LIVE label identifies
          channel listings; stream availability is not verified.
        </p>
      </section>
      <section className="demo-banner shell">
        <div className="demo-banner-icon">
          <Play size={24} fill="currentColor" />
        </div>
        <div>
          <span className="eyebrow">TAKE A LOOK AROUND</span>
          <h2>Meet your new favorite player.</h2>
          <p>Try a sample film and settle in. No account needed.</p>
        </div>
        <Link href="/watch/player-demo" className="button button-secondary">
          Play the demo
          <ArrowRight size={17} />
        </Link>
      </section>
      <Guide />
    </>
  );
}
