import type { Channel, Programme } from "@/types/channel";
/** Replace this adapter with XMLTV/JSON EPG ingestion; all current rows are explicit samples. */
export function sampleGuide(channels: Channel[]): Programme[] {
  return channels.flatMap(channel => ["Sample programme", "Sample feature", "Sample broadcast"].map((title, index) => ({
    id: `sample-${channel.id}-${index}`, channelId: channel.id, title,
    start: `2000-01-01T${String(18 + index).padStart(2, "0")}:00:00+05:45`,
    end: `2000-01-01T${String(19 + index).padStart(2, "0")}:00:00+05:45`, isSample: true,
  })));
}
