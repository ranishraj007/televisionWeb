import Link from "next/link";
import { ArrowUpRight, CalendarDays, Play } from "lucide-react";
import { orderedChannels } from "@/lib/channels";
import { sampleGuide } from "@/lib/epg";
import { ChannelLogo } from "./ChannelLogo";
export function Guide({ full = false }: { full?: boolean }) {
  const rows = orderedChannels.slice(0, full ? 12 : 3);
  const programmes = sampleGuide(rows);
  return (
    <section className={`guide-section ${full ? "" : "shell"}`}>
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            <CalendarDays size={14} />
            PLAN YOUR WATCH
          </div>
          <h2>
            The channel guide<span>.</span>
          </h2>
        </div>
        {!full && (
          <Link href="/guide" className="text-link">
            Open guide
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      <div className="guide-note">
        <span className="sample-badge">SAMPLE GUIDE</span>
        <p>
          Preview only — these are example programmes, not actual broadcast
          schedules.
        </p>
      </div>
      <div className="guide-scroll">
        <div className="guide-table">
          <div className="guide-table-head">
            <span>CHANNEL</span>
            <span>
              18:00 <b>Sample</b>
            </span>
            <span>19:00</span>
            <span>20:00</span>
          </div>
          {rows.map((channel) => (
            <div className="guide-row" key={channel.id}>
              <Link className="guide-channel" href={`/watch/${channel.id}`}>
                <ChannelLogo channel={channel} />
                <span>
                  <strong>{channel.name}</strong>
                  <small>{channel.category}</small>
                </span>
              </Link>
              {programmes
                .filter((item) => item.channelId === channel.id)
                .map((programme, index) => (
                  <div
                    className={`guide-programme ${index === 0 ? "guide-current" : ""}`}
                    key={programme.id}
                  >
                    <span>{programme.title}</span>
                    <small>
                      {programme.start.slice(11, 16)} –{" "}
                      {programme.end.slice(11, 16)} · Sample
                    </small>
                    {index === 0 && (
                      <Link
                        href={`/watch/${channel.id}`}
                        aria-label={`Watch ${channel.name}`}
                      >
                        <Play size={13} fill="currentColor" />
                      </Link>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
