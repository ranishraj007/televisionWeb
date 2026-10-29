"use client";
import { useEffect, useState } from "react";
import type { Channel } from "@/types/channel";
export function ChannelLogo({
  channel,
  large = false,
}: {
  channel: Channel;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [allowImage, setAllowImage] = useState(false);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    setAllowImage(
      Boolean(
        channel.logo &&
        (channel.logo.startsWith("https:") ||
          window.location.protocol === "http:"),
      ),
    );
  }, [channel.logo]);
  const short = channel.name.replace(/\b(HD|TV|Channel)\b/gi, "").trim();
  const initials = short
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`channel-logo tone-${channel.category.toLowerCase()} ${large ? "logo-large" : ""}`}
      aria-hidden="true"
    >
      <span className={short.length <= 8 ? "logo-word" : "logo-initials"}>
        {short.length <= 8 ? short : initials}
      </span>
      {large && (
        <span className="logo-caption">
          {channel.isDemo
            ? "SAMPLE FILM"
            : channel.category === "News"
              ? "NEWS & PERSPECTIVES"
              : "LIVE TELEVISION"}
        </span>
      )}
      {allowImage && !failed && (
        <img
          src={channel.logo}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
