"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Cloudflare Turnstile ────────────────────────────────────────────────────
const TURNSTILE_SITE_KEY = "0x4AAAAAADHS5DlouHNP_hXs";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, opts: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

function TurnstileGate({ onVerified }: { onVerified: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "verifying" | "verified" | "error">("loading");
  const verifiedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function handleToken(token: string) {
      if (!isMounted || !token || verifiedRef.current) return;
      setStatus("verifying");
      try {
        const res = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!isMounted) return;
        if (data.success) {
          verifiedRef.current = true;
          setStatus("verified");
          setTimeout(() => { if (isMounted) onVerified(); }, 800);
        } else {
          setStatus("ready");
          if (widgetIdRef.current && window.turnstile) {
            try { window.turnstile.reset(widgetIdRef.current); } catch {}
          }
        }
      } catch {
        if (!isMounted) return;
        setStatus("ready");
        if (widgetIdRef.current && window.turnstile) {
          try { window.turnstile.reset(widgetIdRef.current); } catch {}
        }
      }
    }

    function renderWidget() {
      if (!containerRef.current || !window.turnstile) return;
      try {
        const id = window.turnstile!.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "dark",
          size: "normal",
          callback: (token: string) => { handleToken(token); },
          "error-callback": () => { if (isMounted) setStatus("error"); },
          "expired-callback": () => {
            if (isMounted) {
              setStatus("ready");
              if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.reset(widgetIdRef.current); } catch {}
              }
            }
          },
        });
        widgetIdRef.current = id;
        if (isMounted) setStatus("ready");
      } catch {
        if (isMounted) setStatus("error");
      }
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) { clearInterval(interval); clearTimeout(timeout); renderWidget(); }
      }, 200);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (isMounted) setStatus("error");
      }, 8000);
      return () => { isMounted = false; clearInterval(interval); clearTimeout(timeout); };
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-5 px-6">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 flex items-center justify-center mb-1">
        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-white font-extrabold text-lg mb-1">Human Verification</h3>
        <p className="text-white/50 text-sm max-w-xs leading-relaxed">
          Complete the security check below to unlock live class playback
        </p>
      </div>
      <div
        ref={containerRef}
        className={`transition-all duration-300 ${status === "loading" ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      />
      {status === "loading" && (
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <div className="w-4 h-4 border-2 border-white/20 border-t-red-400 rounded-full animate-spin" />
          Loading verification...
        </div>
      )}
      {status === "verifying" && (
        <div className="flex items-center gap-2 text-red-300 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          Verifying...
        </div>
      )}
      {status === "error" && (
        <div className="text-center">
          <p className="text-amber-400 text-sm mb-3">Verification service unavailable. Please try again later.</p>
          <button
            onClick={() => {
              setStatus("loading");
              if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.reset(widgetIdRef.current); setStatus("ready"); } catch {}
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors"
          >
            Retry Verification
          </button>
        </div>
      )}
      {status === "verified" && (
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          Verified! Loading video...
        </div>
      )}
      <p className="text-white/25 text-[11px] flex items-center gap-1.5 mt-1">
        <svg className="w-3.5 h-3.5" viewBox="0 0 109 41" fill="currentColor">
          <path d="M71.2 21.8c-.4-1.2-1.6-2.2-3-2.2H35.9c-.3 0-.5.2-.6.4-.1.3 0 .5.2.7 0 0 1.7 1.7 2.5 5.1.1.3.3.5.6.5h29.2c.6 0 1.1-.4 1.2-1l2.2-3.5zm.1 10.5c-.4-1.2-1.6-2-3-2H35.9c-.3 0-.5.2-.6.4-.1.3 0 .5.2.7 0 0 1.7 1.7 2.5 5.1.1.3.3.5.6.5h29.2c.6 0 1.1-.4 1.2-1l2.3-3.7z"/>
        </svg>
        Protected by Cloudflare Turnstile
      </p>
    </div>
  );
}

interface LiveVideoPlayerProps {
  /** Live class schedule / video ID */
  videoId: string;
  batchId: string;
  subjectId?: string;
  subjectSlug?: string;
  title: string;
  /** Whether the class is currently live */
  isLive?: boolean;
  /** Direct CloudFront / CDN / YouTube URL already on the item (skips API lookup) */
  directUrl?: string;
  /** urlType from the live class item, e.g. "awsVideo", "penpencilvdo", "youtube" */
  urlType?: string;
  onClose: () => void;
  /** When true, renders as a full page instead of a fixed modal overlay */
  fullPage?: boolean;
}

interface VideoData {
  success: boolean;
  type?: "drm" | "hls" | "mp4" | "youtube" | "live";
  mpdUrl?: string;
  hlsUrl?: string;
  videoUrl?: string;
  kid?: string;
  key?: string;
  error?: string;
}

interface QualityLevel {
  height: number;
  bitrate: number;
  index: number;
}

export default function LiveVideoPlayer({
  videoId,
  batchId,
  subjectId = "",
  subjectSlug = "",
  title,
  isLive = false,
  directUrl,
  urlType,
  onClose,
  fullPage = false,
}: LiveVideoPlayerProps) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);

  // Player state
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);

  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shakaRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // ─── Load Video ───────────────────────────────────────────────────────────
  const loadVideo = useCallback(async () => {
    setLoading(true);
    setError("");
    setYoutubeUrl(null);
    setProgress("Fetching class video...");
    setQualities([]);
    setCurrentQuality(-1);

    if (shakaRef.current) {
      await shakaRef.current.destroy().catch(() => {});
      shakaRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.load();
    }

    try {
      let data: VideoData;

      // If a direct URL is available, send it to the API for resolution (proxy + DRM)
      if (directUrl) {
        setProgress("Resolving video URL...");

        // YouTube direct
        if (directUrl.includes("youtube.com") || directUrl.includes("youtu.be") ||
            urlType === "youtube") {
          setYoutubeUrl(directUrl);
          setLoading(false);
          return;
        }

        // Pass direct URL through our live-video API for proxying
        const params = new URLSearchParams({
          direct_url: directUrl,
          batch_id: batchId,
          ...(subjectId ? { subject_id: subjectId } : {}),
          ...(subjectSlug ? { subject_slug: subjectSlug } : {}),
          ...(urlType ? { url_type: urlType } : {}),
        });
        const res = await fetch(`/api/live-video?${params.toString()}`);
        data = await res.json();
      } else {
        // Standard lookup via schedule/video ID
        const params = new URLSearchParams({
          video_id: videoId,
          batch_id: batchId,
          schedule_id: videoId,
          ...(subjectId ? { subject_id: subjectId } : {}),
          ...(subjectSlug ? { subject_slug: subjectSlug } : {}),
        });
        const res = await fetch(`/api/live-video?${params.toString()}`);
        data = await res.json();
      }

      if (!data.success) {
        setError(data.error || "Could not load video");
        setLoading(false);
        return;
      }

      if (data.type === "youtube" && data.videoUrl) {
        setYoutubeUrl(data.videoUrl);
        setLoading(false);
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      // DRM playback via Shaka Player
      if (data.type === "drm" && data.mpdUrl && data.kid && data.key) {
        setProgress("Loading DRM player...");
        const shaka = await import("shaka-player");
        shaka.default.polyfill.installAll();

        if (!shaka.default.Player.isBrowserSupported()) {
          // Fall back to proxied HLS
          const fallbackHls = data.hlsUrl || data.mpdUrl.replace(/\.mpd(\?|$)/, ".m3u8$1");
          const proxied = fallbackHls.startsWith("/api/hls-proxy")
            ? fallbackHls
            : `/api/hls-proxy?url=${encodeURIComponent(fallbackHls)}`;
          await loadHls(video, proxied);
          return;
        }

        const player = new shaka.default.Player();
        await player.attach(video);
        shakaRef.current = player;

        // Forward CloudFront auth query string to every request
        const mpdParts = data.mpdUrl.split("?");
        if (mpdParts.length > 1) {
          const queryString = "?" + mpdParts[1];
          const engine = player.getNetworkingEngine();
          if (engine) {
            engine.registerRequestFilter((type: number, request: { uris: string[] }) => {
              if ((type === 0 || type === 1) && !request.uris[0].includes("?")) {
                request.uris[0] += queryString;
              }
            });
          }
        }

        player.configure({
          drm: { clearKeys: { [data.kid]: data.key } },
        });

        player.addEventListener("error", (event: Event) => {
          const detail = (event as Event & { detail?: { message?: string; code?: number } })?.detail;
          // On DRM error, fall back to proxied HLS
          if (data.hlsUrl) {
            setProgress("DRM failed, trying HLS...");
            loadHls(video, data.hlsUrl).catch(() => {
              setError(detail?.message || "Playback error");
            });
          } else {
            setError(detail?.message || "Playback error");
          }
        });

        player.addEventListener("variantschanged", () => {
          if (!shakaRef.current) return;
          const tracks = shakaRef.current.getVariantTracks();
          const qs: QualityLevel[] = tracks
            .filter((t: { height: number }) => t.height)
            .map((t: { height: number; bandwidth: number }, i: number) => ({
              height: t.height ?? 0,
              bitrate: t.bandwidth,
              index: i,
            }))
            .sort((a: QualityLevel, b: QualityLevel) => b.height - a.height);
          setQualities(qs);
        });

        setProgress("Loading stream...");
        try {
          await player.load(data.mpdUrl);
          video.play().catch(() => {});
          setLoading(false);
          setPlaying(true);
        } catch {
          // DRM load failed — fall back to proxied HLS
          if (data.hlsUrl) {
            setProgress("Switching to HLS...");
            await shakaRef.current?.destroy().catch(() => {});
            shakaRef.current = null;
            await loadHls(video, data.hlsUrl);
          } else {
            setError("Failed to load DRM stream");
            setLoading(false);
          }
        }
        return;
      }

      // HLS (proxied URL from our API)
      const hlsSrc = data.hlsUrl || data.videoUrl || "";
      if ((data.type === "hls" || data.type === "live" || data.type === "drm") && hlsSrc) {
        await loadHls(video, hlsSrc);
        return;
      }

      // MP4 / direct
      if (data.videoUrl) {
        setProgress("Loading video...");
        video.src = data.videoUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch(() => {});
          setLoading(false);
          setPlaying(true);
        }, { once: true });
        video.addEventListener("error", () => {
          setError("Failed to load video");
          setLoading(false);
        }, { once: true });
        return;
      }

      setError("No playable URL found");
      setLoading(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load video";
      setError(msg);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, batchId, subjectId, subjectSlug, directUrl, urlType]);

  async function loadHls(video: HTMLVideoElement, src: string) {
    setProgress("Loading stream...");
    const Hls = (await import("hls.js")).default;
    if (Hls.isSupported()) {
      // Destroy any existing instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        startLevel: -1,
        maxBufferLength: isLive ? 30 : 60,
        maxMaxBufferLength: isLive ? 60 : 120,
        // Retry settings for network errors
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 1000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const lvls: QualityLevel[] = hls.levels.map(
          (l: { height: number; bitrate: number }, i: number) => ({
            height: l.height || 0,
            bitrate: l.bitrate || 0,
            index: i,
          })
        ).sort((a: QualityLevel, b: QualityLevel) => b.height - a.height);
        setQualities(lvls);
        video.play().catch(() => {});
        setLoading(false);
        setPlaying(true);
      });

      let mediaRecoveryAttempted = false;
      hls.on(Hls.Events.ERROR, (_: unknown, errData: { fatal?: boolean; type?: string; details?: string; response?: { code?: number } }) => {
        if (!errData.fatal) return;

        if (errData.type === "networkError") {
          // Try to recover from network errors
          hls.startLoad();
        } else if (errData.type === "mediaError") {
          if (!mediaRecoveryAttempted) {
            mediaRecoveryAttempted = true;
            hls.recoverMediaError();
          } else {
            // Second media error — swap codec
            hls.swapAudioCodec();
            hls.recoverMediaError();
          }
        } else {
          const detail = errData.details || "playback failed";
          const httpCode = errData.response?.code;
          const msg = httpCode
            ? `HLS error: ${detail} (HTTP ${httpCode}). Please retry.`
            : `HLS error: ${detail}. Please retry.`;
          setError(msg);
          setLoading(false);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
        setLoading(false);
        setPlaying(true);
      }, { once: true });
      video.addEventListener("error", () => {
        setError("Failed to load stream");
        setLoading(false);
      }, { once: true });
    } else {
      setError("HLS playback not supported in this browser");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!verified) return;
    loadVideo();
    return () => {
      shakaRef.current?.destroy().catch(() => {});
      hlsRef.current?.destroy();
    };
  }, [loadVideo, verified]);

  // ─── Video Event Listeners ────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1));
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onVolumeChange = () => { setVolume(video.volume); setMuted(video.muted); };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, []);

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (youtubeUrl) return;
      switch (e.key) {
        case "Escape": onClose(); break;
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": e.preventDefault(); if (!isLive) skip(10); break;
        case "ArrowLeft": e.preventDefault(); if (!isLive) skip(-10); break;
        case "f": toggleFullscreen(); break;
        case "m": toggleMute(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, youtubeUrl, isLive]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  };

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function skip(seconds: number) {
    const video = videoRef.current;
    if (!video || isLive) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration || 0));
    resetControlsTimer();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }

  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !duration || isLive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * duration;
    resetControlsTimer();
  }

  function setSpeed(rate: number) {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }

  function setQuality(index: number) {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
      setShowQualityMenu(false);
      return;
    }
    if (shakaRef.current) {
      if (index === -1) {
        shakaRef.current.configure({ abr: { enabled: true } });
      } else {
        const tracks = shakaRef.current.getVariantTracks();
        if (tracks[index]) {
          shakaRef.current.selectVariantTrack(tracks[index], true);
          shakaRef.current.configure({ abr: { enabled: false } });
        }
      }
      setCurrentQuality(index);
    }
    setShowQualityMenu(false);
  }

  function formatTime(s: number): string {
    if (!s || isNaN(s)) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      className={fullPage
        ? "min-h-screen w-full flex items-center justify-center p-2 sm:p-4"
        : "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      }
      style={{ background: "rgba(2, 4, 12, 0.97)", backdropFilter: "blur(10px)", minHeight: fullPage ? "100dvh" : undefined }}
      ref={containerRef}
      onClick={(e) => { if (!fullPage && e.target === containerRef.current) onClose(); }}
    >
      <div className={`relative w-full max-w-5xl ${fullPage ? "" : "animate-scale-up"}`}>
        {/* Title bar */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm font-semibold flex-shrink-0 border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isLive && (
              <span className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-red-600 rounded-lg text-white text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
            <h2 className="text-white font-bold text-sm sm:text-[15px] line-clamp-1 opacity-90">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/80 text-white/60 hover:text-white flex items-center justify-center transition-all flex-shrink-0 border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Player wrapper */}
        <div
          ref={wrapperRef}
          className="relative aspect-video bg-[#060810] rounded-2xl overflow-hidden border border-white/5"
          onMouseMove={resetControlsTimer}
          onMouseEnter={resetControlsTimer}
          onClick={() => { if (!youtubeUrl && !loading && !error) { togglePlay(); resetControlsTimer(); } }}
        >
          {/* ── Verification gate ── */}
          {!verified && (
            <div className="absolute inset-0 z-30 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0d0f1e 0%, #111827 100%)" }}>
              <TurnstileGate onVerified={() => setVerified(true)} />
            </div>
          )}

          {/* Loading */}
          {verified && loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/70">
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-red-500 animate-spin" />
                <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-b-red-400 animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <p className="text-white/60 text-sm font-medium">{progress}</p>
            </div>
          )}

          {/* Error */}
          {verified && error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#060810]/95 px-6">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h3 className="text-white font-extrabold text-base mb-1">Playback Error</h3>
              <p className="text-white/40 text-xs text-center max-w-xs leading-relaxed mb-5">{error}</p>
              <div className="w-full max-w-sm bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 mb-5 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
                  <div>
                    <p className="text-amber-300 font-bold text-xs mb-1">Tip: Retry 2–3 times</p>
                    <p className="text-white/45 text-[11px] leading-relaxed">
                      Most videos load on the 2nd or 3rd retry. If it still fails, try a different class.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); loadVideo(); }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="bg-white/8 hover:bg-white/15 text-white/50 hover:text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >Back</button>
              </div>
            </div>
          )}

          {/* YouTube embed */}
          {verified && youtubeUrl && !loading && (
            <iframe
              src={youtubeUrl.replace("watch?v=", "embed/").split("&")[0] + "?autoplay=1"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          )}

          {/* Video element */}
          {!youtubeUrl && (
            <video ref={videoRef} className="w-full h-full" playsInline />
          )}

          {/* Controls */}
          {verified && !youtubeUrl && !error && (
            <div
              className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10 px-4 pb-3">
                {/* Seek bar for recordings */}
                {!isLive && (
                  <div
                    className="relative h-1 hover:h-2 bg-white/20 rounded-full cursor-pointer mb-3 transition-all duration-150 group/bar"
                    onClick={seekTo}
                  >
                    <div className="absolute top-0 left-0 h-full bg-white/30 rounded-full pointer-events-none" style={{ width: `${bufferedPct}%` }} />
                    <div className="absolute top-0 left-0 h-full bg-red-500 rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
                      style={{ left: `${progressPct}%` }}
                    />
                  </div>
                )}

                {/* LIVE bar */}
                {isLive && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-xs text-white/60 flex-shrink-0">● LIVE</span>
                  </div>
                )}

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Play/Pause */}
                  <button onClick={togglePlay} className="text-white hover:text-red-300 transition-colors flex-shrink-0">
                    {playing ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </button>

                  {/* Skip (recordings only) */}
                  {!isLive && (
                    <>
                      <button onClick={() => skip(-10)} className="text-white hover:text-red-300 transition-colors flex-shrink-0" title="Back 10s (←)">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                        </svg>
                      </button>
                      <button onClick={() => skip(10)} className="text-white hover:text-red-300 transition-colors flex-shrink-0" title="Forward 10s (→)">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Volume */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={toggleMute} className="text-white hover:text-red-300 transition-colors">
                      {muted || volume === 0 ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
                      )}
                    </button>
                    <input
                      type="range" min={0} max={1} step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; }
                      }}
                      className="w-14 sm:w-20 accent-red-500 cursor-pointer"
                    />
                  </div>

                  {/* Time (recordings) */}
                  {!isLive && (
                    <span className="text-white/70 text-xs flex-shrink-0 font-mono hidden sm:block">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  )}

                  <div className="flex-1" />

                  {/* Speed (recordings only) */}
                  {!isLive && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                        className="text-white/80 hover:text-white text-xs font-medium px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {playbackRate}x
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-white/10 rounded-lg overflow-hidden min-w-[80px] shadow-xl z-30">
                          {SPEEDS.map((s) => (
                            <button
                              key={s}
                              onClick={(e) => { e.stopPropagation(); setSpeed(s); }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${playbackRate === s ? "text-red-400 bg-red-500/10 font-semibold" : "text-white hover:bg-white/10"}`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quality */}
                  {qualities.length > 0 && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                        className="text-white/80 hover:text-white text-xs font-medium px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {currentQuality === -1 ? "Auto" : `${qualities.find((q) => q.index === currentQuality)?.height || ""}p`}
                      </button>
                      {showQualityMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-white/10 rounded-lg overflow-hidden min-w-[80px] shadow-xl z-30">
                          <button
                            onClick={(e) => { e.stopPropagation(); setQuality(-1); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentQuality === -1 ? "text-red-400 bg-red-500/10 font-semibold" : "text-white hover:bg-white/10"}`}
                          >
                            Auto
                          </button>
                          {qualities.map((q) => (
                            <button
                              key={q.index}
                              onClick={(e) => { e.stopPropagation(); setQuality(q.index); }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentQuality === q.index ? "text-red-400 bg-red-500/10 font-semibold" : "text-white hover:bg-white/10"}`}
                            >
                              {q.height}p
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fullscreen */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="text-white hover:text-red-300 transition-colors flex-shrink-0"
                    title="Fullscreen (f)"
                  >
                    {fullscreen ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-white/20 text-xs mt-2.5 hidden sm:block">
          Space = play/pause &nbsp;·&nbsp; {!isLive && "← → skip 10s · "} F = fullscreen &nbsp;·&nbsp; M = mute &nbsp;·&nbsp; Esc = back
        </p>
      </div>
    </div>
  );
}
