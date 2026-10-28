import catalog from "@/data/channels.json";
import type { Channel } from "@/types/channel";

export const channels: Channel[] = catalog;
export const demoChannel: Channel = {
  id: "player-demo", name: "Big Buck Bunny", category: "Demo", language: "English",
  streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", isDemo: true,
  description: "A public HLS playback demo hosted by Mux. This is a sample film, not a live TV channel.",
};
const priority = ["Kantipur TV HD", "NTV HD", "Himalaya HD", "AP1", "NTV News HD", "Image Channel HD", "News 24", "Himalaya Sports"];
export const orderedChannels = [...channels].sort((a, b) => {
  const rank = (name: string) => { const index = priority.indexOf(name); return index < 0 ? 100 : index; };
  return rank(a.name) - rank(b.name);
});
export const featuredChannel = orderedChannels[0] || demoChannel;
export const categories = ["All channels", "News", "Entertainment", "Sports", "Movies", "Music", "General", "Kids", "Discovery", "Spiritual"];
export function getChannel(id: string) { return id === demoChannel.id ? demoChannel : channels.find(channel => channel.id === id); }
export function relatedChannels(channel: Channel) {
  return [...orderedChannels.filter(item => item.category === channel.category), ...orderedChannels.filter(item => item.category !== channel.category)]
    .filter(item => item.id !== channel.id).slice(0, 6);
}
