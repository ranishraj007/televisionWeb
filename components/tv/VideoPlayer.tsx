"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  PictureInPicture2,
  LoaderCircle,
  Radio,
  RotateCcw,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import type Hls from "hls.js";
import { ViewerCount } from "@/components/tv/ViewerCount";
import { playbackSources, playbackRequestUrl } from "@/lib/playback-sources";
import type { Channel } from "@/types/channel";

type PlayerStatus = "loading" | "ready" | "buffering" | "error";
const clock = (seconds: number) =>
  !Number.isFinite(seconds)
    ? "0:00"
    : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
export function VideoPlayer({ channel }: { channel: Channel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [live, setLive] = useState(!channel.isDemo);
  const [pip, setPip] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [forceNative, setForceNative] = useState(false);
  const hideControls = () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = null;
    setControlsVisible(false);
  };
  const showControls = () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setControlsVisible(true);
    controlsTimerRef.current = setTimeout(hideControls, 5000);
  };
  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sources = playbackSources(
      channel.streamUrl,
      Boolean(channel.isDemo),
      window.location.protocol === "https:",
    );
    const streamUrl = sources[sourceIndex] || sources[0];
    let disposed = false;
    let failed = false;
    let hls: Hls | null = null;
    let recovered = false;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const clearWatchdog = () => {
      if (watchdog) clearTimeout(watchdog);
    };
    const fail = (message: string) => {
      if (disposed || failed) return;
      failed = true;
      clearWatchdog();
      video.pause();
      if (!forceNative && sourceIndex + 1 < sources.length) {
        setSourceIndex(sourceIndex + 1);
        return;
      }
      setError(message);
      setStatus("error");
      setPlaying(false);
    };
    const startWatchdog = () => {
      clearWatchdog();
      watchdog = setTimeout(
        () =>
          fail(
            "The broadcaster is taking too long to respond. Try again or choose another channel.",
          ),
        25000,
      );
    };
    const ready = () => {
      if (disposed) return;
      clearWatchdog();
      setStatus("ready");
      setDuration(video.duration);
    };
    const buffering = () => {
      if (!disposed && !video.paused) {
        setStatus("buffering");
        startWatchdog();
      }
    };
    const onPlaying = () => {
      ready();
      setPlaying(true);
    };
    const resetVolume = () => {
      video.muted = false;
      video.volume = 1;
      setMuted(false);
      setVolume(1);
    };
    const paused = () => {
      clearWatchdog();
      setPlaying(false);
      setStatus((current) => (current === "buffering" ? "ready" : current));
    };
    const time = () => setPosition(video.currentTime);
    const metadata = () => {
      setDuration(video.duration);
      if (!hls) setLive(video.duration === Infinity);
    };
    const audio = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };
    const nativeError = () => {
      // hls.js handles media errors and gets one recovery attempt.
      if (hls || disposed) return;
      console.error(
        "[video player] Native media error",
        video.error?.code,
        video.error?.message,
      );
      fail(
        "This stream could not be opened. It may be offline, restricted by the provider, or use an unsupported codec. Try another channel or the demo.",
      );
    };
    video.addEventListener("canplay", ready);
    video.addEventListener("play", resetVolume);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", buffering);
    video.addEventListener("stalled", buffering);
    video.addEventListener("pause", paused);
    video.addEventListener("timeupdate", time);
    video.addEventListener("loadedmetadata", metadata);
    video.addEventListener("durationchange", metadata);
    video.addEventListener("volumechange", audio);
    video.addEventListener("error", nativeError);
    setStatus("loading");
    setError("");
    setNotice("");
    setPlaying(false);
    setPosition(0);
    setDuration(0);
    setLive(!channel.isDemo);
    resetVolume();
    setPip(
      Boolean(
        document.pictureInPictureEnabled && video.requestPictureInPicture,
      ),
    );
    const setup = async () => {
      startWatchdog();
      if (forceNative) {
        video.src = streamUrl;
        video.load();
        return;
      }
      try {
        const { default: HlsLibrary } = await import("hls.js");
        if (disposed) return;
        if (!HlsLibrary.isSupported()) {
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
            video.load();
            return;
          }
          fail(
            "This browser does not support HLS video playback. Try a current version of Safari, Chrome, Firefox, or Edge.",
          );
          return;
        }
        hls = new HlsLibrary({
          enableWorker: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          xhrSetup: (xhr, url) => {
            const requestUrl = playbackRequestUrl(url);
            if (requestUrl !== url) xhr.open("GET", requestUrl, true);
          },
        });
        hlsRef.current = hls;
        hls.on(HlsLibrary.Events.MEDIA_ATTACHED, () => {
          if (!disposed) hls?.loadSource(streamUrl);
        });
        hls.on(HlsLibrary.Events.LEVEL_LOADED, (_, data) => {
          if (!disposed) setLive(data.details.live);
        });
        hls.on(HlsLibrary.Events.ERROR, (_, data) => {
          if (disposed || !data.fatal) return;
          console.error("[video player]", {
            source: streamUrl.startsWith("/api/") ? "relay" : "direct",
            type: data.type,
            details: data.details,
            status: data.response?.code,
            reason: data.reason,
          });
          if (data.type === HlsLibrary.ErrorTypes.MEDIA_ERROR && !recovered) {
            recovered = true;
            hls?.recoverMediaError();
            startWatchdog();
            return;
          }
          hls?.stopLoad();
          fail(
            data.type === HlsLibrary.ErrorTypes.NETWORK_ERROR
              ? `The connection failed (${data.details}${data.response?.code ? `, HTTP ${data.response.code}` : ""}). Try the browser player below.`
              : `The video could not be decoded (${data.details}). Try the browser player below.`,
          );
        });
        hls.attachMedia(video);
      } catch {
        fail(
          "The video player could not load. Check your connection and try again.",
        );
      }
    };
    void setup();
    return () => {
      disposed = true;
      clearWatchdog();
      video.removeEventListener("canplay", ready);
      video.removeEventListener("play", resetVolume);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", buffering);
      video.removeEventListener("stalled", buffering);
      video.removeEventListener("pause", paused);
      video.removeEventListener("timeupdate", time);
      video.removeEventListener("loadedmetadata", metadata);
      video.removeEventListener("durationchange", metadata);
      video.removeEventListener("volumechange", audio);
      video.removeEventListener("error", nativeError);
      hls?.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [channel.streamUrl, channel.isDemo, attempt, sourceIndex, forceNative]);
  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || status === "error") return;
    if (!video.paused) {
      video.pause();
      return;
    }
    try {
      setNotice("");
      await video.play();
    } catch {
      setNotice(
        "Playback did not start. Press play again, or retry the stream.",
      );
    }
  };
  const toggleMute = () => {
    if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (frameRef.current?.requestFullscreen)
        await frameRef.current.requestFullscreen();
      else {
        const video = videoRef.current as
          | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
          | null;
        if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
        else setNotice("Fullscreen is not available in this browser.");
      }
    } catch {
      setNotice(
        "Your browser could not open fullscreen. Try its built-in video controls.",
      );
    }
  };
  const pictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement)
        await document.exitPictureInPicture();
      else await videoRef.current?.requestPictureInPicture();
    } catch {
      setNotice(
        "Picture-in-picture is not available yet. Start playback and try again.",
      );
    }
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === " " || event.key === "k") {
      event.preventDefault();
      void togglePlayback();
    }
    if (event.key === "m") {
      event.preventDefault();
      toggleMute();
    }
    if (event.key === "f") {
      event.preventDefault();
      void fullscreen();
    }
  };
  return (
    <div className="player-shell">
      <div
        className="video-frame"
        data-controls-visible={controlsVisible}
        ref={frameRef}
        tabIndex={0}
        onKeyDown={keyboard}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") showControls();
        }}
        onPointerMove={(event) => {
          if (event.pointerType === "mouse") showControls();
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") showControls();
        }}
        onPointerLeave={hideControls}
        aria-label={`${channel.name} video player. Space to play, M to mute, F for fullscreen.`}
      >
        <video
          ref={videoRef}
          playsInline
          controls={forceNative}
          preload="auto"
          poster="/images/mountains.jpg"
          aria-label={channel.name}
          onClick={() => void togglePlayback()}
        />
        <span
          className={`player-top-label ${channel.isDemo ? "demo-label" : ""}`}
        >
          <i />
          {channel.isDemo ? "DEMO FILM" : live ? "LIVE STREAM" : "STREAM"}
        </span>
        {(status === "loading" || status === "buffering") && (
          <div className="player-overlay loading-overlay" role="status">
            <LoaderCircle className="spin" size={34} />
            <span>
              {status === "buffering"
                ? "Buffering…"
                : "Connecting to your channel…"}
            </span>
          </div>
        )}
        {status === "ready" && !playing && (
          <button
            className="big-play"
            aria-label={`Play ${channel.name}`}
            onClick={() => void togglePlayback()}
          >
            <Play fill="currentColor" size={32} />
          </button>
        )}
        {status === "error" && (
          <div
            className="player-overlay error-overlay"
            role="alert"
            aria-label="Playback error"
          >
            <span className="error-icon">
              <AlertCircle size={26} />
            </span>
            <h2>A moment off air.</h2>
            <p>{error}</p>
            <div>
              <button
                className="button button-primary"
                onClick={() => {
                  setSourceIndex(0);
                  setForceNative(false);
                  setAttempt((value) => value + 1);
                }}
              >
                <RotateCcw size={16} />
                Try again
              </button>
              {!forceNative && (
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setSourceIndex(0);
                    setForceNative(true);
                    setAttempt((value) => value + 1);
                  }}
                >
                  Use browser player
                </button>
              )}
              {!channel.isDemo && (
                <Link
                  href="/watch/player-demo"
                  className="button button-secondary"
                >
                  Try the demo
                  <ArrowUpRight size={16} />
                </Link>
              )}
            </div>
          </div>
        )}
        <div className="player-controls">
          <button
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => void togglePlayback()}
            disabled={status === "error"}
          >
            {playing ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" />
            )}
          </button>
          <button
            aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
            onClick={toggleMute}
          >
            {muted || volume === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <input
            className="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            aria-label="Volume"
            onChange={(event) => {
              const video = videoRef.current;
              if (video) {
                video.volume = Number(event.target.value);
                video.muted = false;
              }
            }}
          />
          {live ? (
            <button
              className="live-edge"
              aria-label="Jump to live"
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                const edge = hlsRef.current?.liveSyncPosition;
                if (edge != null) video.currentTime = edge;
                else if (video.seekable.length)
                  video.currentTime = Math.max(
                    0,
                    video.seekable.end(video.seekable.length - 1) - 2,
                  );
              }}
            >
              <Radio size={13} />
              LIVE
            </button>
          ) : (
            <span className="player-time">
              {clock(position)} / {clock(duration)}
            </span>
          )}
          {!live && duration > 0 && Number.isFinite(duration) && (
            <input
              type="range"
              className="seek-slider"
              min="0"
              max={duration}
              step="1"
              value={position}
              aria-label="Playback position"
              onChange={(event) => {
                if (videoRef.current)
                  videoRef.current.currentTime = Number(event.target.value);
              }}
            />
          )}
          <div className="controls-spacer" />
          {pip && (
            <button
              aria-label="Picture in picture"
              onClick={() => void pictureInPicture()}
              disabled={status !== "ready"}
            >
              <PictureInPicture2 size={19} />
            </button>
          )}
          <button
            aria-label="Toggle fullscreen"
            onClick={() => void fullscreen()}
          >
            <Maximize size={19} />
          </button>
        </div>
      </div>
      {notice && (
        <div className="player-notice" role="status">
          {notice}
        </div>
      )}
      <div className="player-bottom">
        <span>
          <span
            className={`connection-dot ${status === "error" ? "connection-error" : ""}`}
          />
          {status === "error"
            ? "Stream unavailable"
            : playing
              ? "Now playing"
              : status === "ready"
                ? "Ready when you are"
                : "Connecting"}
        </span>
        <ViewerCount
          channelId={channel.id}
          active={playing && status === "ready"}
        />
      </div>
    </div>
  );
}
