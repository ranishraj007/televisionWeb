import Link from "next/link";
import { Play, ArrowUpRight } from "lucide-react";
import type { Channel } from "@/types/channel";
import { ChannelLogo } from "./ChannelLogo";
import { FavoriteButton } from "./FavoriteButton";
export function ChannelCard({ channel }: { channel: Channel }) {
  return <article className="channel-card"><div className={`card-art art-${channel.category.toLowerCase()}`}>
    <Link href={`/watch/${channel.id}`} className="card-art-link" aria-label={`Watch ${channel.name}`}><span className={`live-label ${channel.isDemo ? "demo-label" : ""}`}><i />{channel.isDemo ? "DEMO" : "LIVE"}</span><ChannelLogo channel={channel} large /><span className="card-play"><Play size={23} fill="currentColor" /></span><span className="art-corner">{channel.number ? `CH ${channel.number}` : "TV"}</span></Link><FavoriteButton id={channel.id} name={channel.name} /></div>
    <Link href={`/watch/${channel.id}`} className="card-details"><div><h3>{channel.name}</h3><p>{channel.category}<span>•</span>{channel.language || channel.group || "Live TV"}</p></div><ArrowUpRight size={17} /></Link>
  </article>;
}
