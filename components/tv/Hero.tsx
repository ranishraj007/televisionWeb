import Link from "next/link";
import {
  Play,
  ArrowRight,
  Radio,
  Heart,
  MonitorPlay,
  ChevronRight,
} from "lucide-react";
import { featuredChannel, channels } from "@/lib/channels";
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img
        className="hero-image"
        src="/images/mountains.jpg"
        alt="Sunlit mountain peaks rising above the clouds"
        fetchPriority="high"
      />
      <div className="hero-shade" />
      <div className="hero-content shell">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="eyebrow-line" />
            YOUR WORLD. LIVE.
          </div>
          <h1 id="hero-title">
            A little closer
            <br />
            to <em>home.</em>
          </h1>
          <p>
            The stories you follow. The moments you live for.
            <br className="desktop-break" /> Your favorite TV channels, all in
            one place.
          </p>
          <div className="hero-channel">
            <span className="live-label">
              <i />
              LIVE
            </span>
            <strong>{featuredChannel.name}</strong>
            <span className="tiny-dot" />
            <span>{featuredChannel.language || featuredChannel.category}</span>
          </div>
          <div className="hero-buttons">
            <Link
              className="button button-primary"
              href={`/watch/${featuredChannel.id}`}
            >
              <Play size={18} fill="currentColor" />
              Watch live
            </Link>
            <Link className="button button-glass" href="#channels">
              Browse channels
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-details">
            <span>
              <Radio size={14} />
              {channels.length} channels
            </span>
            <span>
              <MonitorPlay size={14} />
              Any screen. Your space.
            </span>
          </div>
        </div>
        <div className="hero-location">
          <span className="location-line" />
          <span>
            INSPIRED BY HOME<small>A view worth coming back to.</small>
          </span>
        </div>
      </div>
      <div className="hero-bottom shell">
        <span>
          <i />
          Discover something worth watching
        </span>
        <Link href="/favorites">
          <Heart size={14} />
          Make it yours
          <ChevronRight size={15} />
        </Link>
      </div>
    </section>
  );
}
