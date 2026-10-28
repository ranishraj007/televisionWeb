"use client";
import type { Channel } from "@/types/channel";
export function VideoPlayer({ channel }: { channel: Channel }) {
  return <div className="player-shell"><div className="video-frame"><video src={channel.streamUrl} controls playsInline muted preload="auto" aria-label={channel.name} /></div></div>;
}
