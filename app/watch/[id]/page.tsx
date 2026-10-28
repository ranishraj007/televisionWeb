import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ArrowUpRight, Radio, Info } from "lucide-react";
import { getChannel, relatedChannels } from "@/lib/channels";
import { VideoPlayer } from "@/components/tv/VideoPlayer";
import { ChannelLogo } from "@/components/tv/ChannelLogo";
import { FavoriteButton } from "@/components/tv/FavoriteButton";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const channel = getChannel(id);
  return { title: channel ? `Watch ${channel.name}` : "Channel not found" };
}
export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const channel = getChannel(id);
  if (!channel) notFound();
  const related = relatedChannels(channel);
  return (
    <div className="shell watch-page">
      <div className="watch-breadcrumb">
        <Link href="/live">
          <ChevronLeft size={16} />
          All channels
        </Link>
        <span>
          {channel.category}
          <span>/</span>
          {channel.name}
        </span>
      </div>
      <div className="watch-layout">
        <div className="watch-main">
          <VideoPlayer channel={channel} key={channel.id} />
          <div className="watch-title">
            <ChannelLogo channel={channel} />
            <div>
              <div className="watch-title-line">
                <h1>{channel.name}</h1>
                <span
                  className={`live-label ${channel.isDemo ? "demo-label" : ""}`}
                >
                  <i />
                  {channel.isDemo ? "DEMO" : "LIVE"}
                </span>
              </div>
              <p>
                {channel.category}
                <span>•</span>
                {channel.language || channel.group || "HLS playback demo"}
              </p>
            </div>
            {!channel.isDemo && (
              <FavoriteButton id={channel.id} name={channel.name} withLabel />
            )}
          </div>
          <div className="watch-about">
            <h2>
              {channel.isDemo
                ? "A little test run."
                : "Settle in. You’re in good company."}
            </h2>
            <p>
              {channel.description ||
                `Watch ${channel.name} from your supplied channel playlist. Playback and programme availability depend on the broadcaster.`}
            </p>
            {channel.isDemo ? (
              <p className="stream-note">
                <Info size={16} />
                <span>
                  Public test film hosted by{" "}
                  <a
                    href="https://test-streams.mux.dev/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mux
                  </a>
                  , used by the hls.js project. This is on-demand sample
                  content, not a live broadcast.
                </span>
              </p>
            ) : (
              <p className="stream-note">
                <Info size={16} />
                <span>
                  Channel availability depends on the broadcaster.
                  If this channel is unavailable,{" "}
                  <Link href="/watch/player-demo">try the player demo</Link>.
                </span>
              </p>
            )}
          </div>
        </div>
        <aside className="related-channels">
          <div className="related-heading">
            <h2>Keep exploring</h2>
            <Radio size={17} />
          </div>
          <p>There’s more on your frequency.</p>
          {related.map((item) => (
            <Link
              key={item.id}
              href={`/watch/${item.id}`}
              className="related-channel"
            >
              <ChannelLogo channel={item} />
              <span>
                <strong>{item.name}</strong>
                <small>{item.category}</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          ))}
          <Link href="/live" className="related-all">
            Browse all channels
            <ArrowUpRight size={16} />
          </Link>
          <div className="related-guide">
            <span className="eyebrow">A LITTLE PLANNING</span>
            <h3>What’s on your watchlist?</h3>
            <p>Explore the sample channel guide.</p>
            <Link href="/guide">
              Open guide
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
