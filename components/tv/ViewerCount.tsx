"use client";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";

/** Active playback sessions on this app, refreshed every 15 seconds. */
export function ViewerCount({
  channelId,
  active,
}: {
  channelId: string;
  active: boolean;
}) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const sessionId = Array.from(
      crypto.getRandomValues(new Uint8Array(18)),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
    let disposed = false;
    let pending = false;
    const payload = (watching: boolean) =>
      JSON.stringify({ channelId, sessionId, active: watching });
    const leave = () => {
      const body = payload(false);
      if (
        !navigator.sendBeacon?.(
          "/api/viewers",
          new Blob([body], { type: "application/json" }),
        )
      ) {
        void fetch("/api/viewers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(
          active
            ? "/api/viewers"
            : `/api/viewers?channelId=${encodeURIComponent(channelId)}`,
          {
            method: active ? "POST" : "GET",
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
            ...(active
              ? {
                  headers: { "Content-Type": "application/json" },
                  body: payload(true),
                }
              : {}),
          },
        );
        if (!response.ok) throw new Error("Count unavailable");
        const data = await response.json();
        if (!disposed)
          setCount(
            Number.isInteger(data.count) && data.count >= 0 ? data.count : null,
          );
      } catch {
        if (!disposed) setCount(null);
      } finally {
        pending = false;
        // A heartbeat may finish after navigation or pause; remove it again.
        if (disposed && active) leave();
      }
    };
    const pageHide = () => {
      if (active) leave();
    };
    window.addEventListener("pagehide", pageHide);
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => {
      disposed = true;
      clearInterval(timer);
      window.removeEventListener("pagehide", pageHide);
      if (active) leave();
    };
  }, [channelId, active]);
  return (
    <span
      className="viewer-count"
      title="Active playback sessions on this app. Updates every 15 seconds."
    >
      <Users size={14} aria-hidden="true" />
      {count === null
        ? "Viewer count unavailable"
        : `${count.toLocaleString()} watching now`}
    </span>
  );
}
