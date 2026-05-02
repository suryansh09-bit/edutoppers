"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface VideoPlayerProps {
  batchId: string;
  subjectId: string;
  childId: string;
  subjectSlug: string;
  title: string;
  onClose: () => void;
}

interface VideoData {
  success: boolean;
  type?: "drm" | "hls" | "mp4" | "youtube";
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
          // Reset and let user try again
          setStatus("ready");
          if (widgetIdRef.current && window.turnstile) {
            try { window.turnstile.reset(widgetIdRef.current); } catch {}
          }
        }
      } catch {
        if (!isMounted) return;
        // Network error during verification — reset widget
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
      {/* Shield icon */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mb-1">
        <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>

      <div className="text-center">
        <h3 className="text-white font-extrabold text-lg mb-1">Human Verification</h3>
        <p className="text-white/50 text-sm max-w-xs leading-relaxed">
          Complete the security check below to unlock video playback
        </p>
      </div>

      {/* Turnstile widget */}
      <div
        ref={containerRef}
        className={`transition-all duration-300 ${status === "loading" ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      />

      {status === "loading" && (
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <div className="w-4 h-4 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
          Loading verification...
        </div>
      )}

      {status === "verifying" && (
        <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
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
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
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

      {/* Powered by Cloudflare note */}
      <p className="text-white/25 text-[11px] flex items-center gap-1.5 mt-1">
        <svg className="w-3.5 h-3.5" viewBox="0 0 109 41" fill="currentColor">
          <path d="M71.2 21.8c-.4-1.2-1.6-2.2-3-2.2H35.9c-.3 0-.5.2-.6.4-.1.3 0 .5.2.7 0 0 1.7 1.7 2.5 5.1.1.3.3.5.6.5h29.2c.6 0 1.1-.4 1.2-1l2.2-3.5zm.1 10.5c-.4-1.2-1.6-2-3-2H35.9c-.3 0-.5.2-.6.4-.1.3 0 .5.2.7 0 0 1.7 1.7 2.5 5.1.1.3.3.5.6.5h29.2c.6 0 1.1-.4 1.2-1l2.3-3.7z"/>
        </svg>
        Protected by Cloudflare Turnstile
      </p>
    </div>
  );
}

export default function VideoPlayer({
  batchId,
  subjectId,
  childId,
  subjectSlug,
  title,
  onClose,
}: VideoPlayerProps) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("Loading video...");
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // ─── Load HLS ─────────────────────────────────────────────────────────────
  async function loadHls(video: HTMLVideoElement, src: string) {
    setProgress("Loading stream...");
    const Hls = (await import("hls.js")).default;
    if (Hls.isSupported()) {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        manifestLoadingMaxRetry: 5,
        manifestLoadingRetryDelay: 1500,
        levelLoadingMaxRetry: 5,
        levelLoadingRetryDelay: 1000,
        fragLoadingMaxRetry: 8,
        fragLoadingRetryDelay: 1000,
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.setRequestHeader("Referer", "https://www.pw.live/");
          xhr.setRequestHeader("Origin", "https://www.pw.live");
        },
      });
      hlsRef.current = hls as typeof hlsRef.current;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const lvls: QualityLevel[] = hls.levels
          .map((l, i) => ({ height: l.height || 0, bitrate: l.bitrate || 0, index: i }))
          .sort((a, b) => b.height - a.height);
        setQualities(lvls);
        video.play().catch(() => {});
        setLoading(false);
        setPlaying(true);
      });

      let mediaRecoveryAttempted = false;
      hls.on(Hls.Events.ERROR, (_event: unknown, errData: { fatal?: boolean; type?: string; details?: string }) => {
        if (!errData.fatal) return;
        if (errData.type === "networkError") {
          hls.startLoad();
        } else if (errData.type === "mediaError") {
          if (!mediaRecoveryAttempted) {
            mediaRecoveryAttempted = true;
            hls.recoverMediaError();
          } else {
            hls.swapAudioCodec();
            hls.recoverMediaError();
          }
        } else {
          setError("stream_error");
          setLoading(false);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
        setLoading(false);
        setPlaying(true);
      }, { once: true });
      video.addEventListener("error", () => {
        setError("stream_error");
        setLoading(false);
      }, { once: true });
    } else {
      setError("browser_unsupported");
      setLoading(false);
    }
  }

  // ─── Load Video ───────────────────────────────────────────────────────────
  const loadVideo = useCallback(async () => {
    setLoading(true);
    setError("");
    setYoutubeUrl(null);
    setProgress("Fetching video info...");
    setQualities([]);
    setCurrentQuality(-1);

    if (shakaRef.current) { await shakaRef.current.destroy().catch(() => {}); shakaRef.current = null; }
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    try {
      const params = new URLSearchParams({
        batchId, subjectId, childId,
        ...(subjectSlug ? { subjectSlug } : {}),
      });
      const res = await fetch(`/api/video-url?${params.toString()}`);
      const data: VideoData = await res.json();

      if (!data.success) {
        setError("not_found");
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

      if (data.type === "drm" && data.mpdUrl && data.kid && data.key) {
        setProgress("Initializing player...");
        const shaka = await import("shaka-player");
        shaka.default.polyfill.installAll();

        // Silence the MediaSource warning from shaka
        const origWarn = console.warn;
        console.warn = (...args: unknown[]) => {
          if (typeof args[0] === "string" && args[0].includes("MediaSource")) return;
          origWarn.apply(console, args);
        };
        const origError = console.error;
        console.error = (...args: unknown[]) => {
          if (typeof args[0] === "string" && args[0].includes("MediaSource")) return;
          origError.apply(console, args);
        };

        if (!shaka.default.Player.isBrowserSupported()) {
          console.warn = origWarn; console.error = origError;
          if (data.hlsUrl) { await loadHls(video, data.hlsUrl); }
          else { setError("browser_unsupported"); setLoading(false); }
          return;
        }

        const player = new shaka.default.Player();
        await player.attach(video);
        shakaRef.current = player;
        console.warn = origWarn; console.error = origError;

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

        player.configure({ drm: { clearKeys: { [data.kid]: data.key } } });

        player.addEventListener("variantschanged", () => {
          if (!shakaRef.current) return;
          const tracks = shakaRef.current.getVariantTracks();
          const qs: QualityLevel[] = tracks
            .filter((t: { height: number }) => t.height)
            .map((t: { height: number; bandwidth: number }, i: number) => ({ height: t.height ?? 0, bitrate: t.bandwidth, index: i }))
            .sort((a: QualityLevel, b: QualityLevel) => b.height - a.height);
          setQualities(qs);
        });

        setProgress("Loading stream...");
        try {
          await player.load(data.mpdUrl);
          video.play().catch(() => {});
          setLoading(false);
          setPlaying(true);
        } catch (shakaErr: unknown) {
          const code = (shakaErr as { code?: number })?.code;
          await player.destroy().catch(() => {});
          shakaRef.current = null;
          if (data.hlsUrl) {
            setProgress("Switching to backup stream...");
            await loadHls(video, data.hlsUrl);
          } else {
            setError(code === 3015 ? "browser_unsupported" : "stream_error");
            setLoading(false);
          }
        }
      } else if ((data.type === "hls" || data.type === "drm") && (data.hlsUrl || data.videoUrl)) {
        await loadHls(video, data.hlsUrl || data.videoUrl || "");
      } else if (data.videoUrl) {
        setProgress("Loading video...");
        video.src = data.videoUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch(() => {});
          setLoading(false);
          setPlaying(true);
        }, { once: true });
        video.addEventListener("error", () => {
          setError("stream_error");
          setLoading(false);
        }, { once: true });
      } else {
        setError("not_found");
        setLoading(false);
      }
    } catch {
      setError("network_error");
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, subjectId, childId, subjectSlug]);

  useEffect(() => {
    if (!verified) return;
    loadVideo();
    return () => {
      shakaRef.current?.destroy().catch(() => {});
      hlsRef.current?.destroy();
    };
  }, [loadVideo, verified]);

  // ─── Video Events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1));
    };
    const onDuration = () => setDuration(video.duration || 0);
    const onVolume = () => { setVolume(video.volume); setMuted(video.muted); };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDuration);
    video.addEventListener("volumechange", onVolume);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDuration);
      video.removeEventListener("volumechange", onVolume);
    };
  }, []);

  // ─── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!videoRef.current || youtubeUrl) return;
      switch (e.key) {
        case "Escape": onClose(); break;
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": e.preventDefault(); skip(10); break;
        case "ArrowLeft": e.preventDefault(); skip(-10); break;
        case "ArrowUp": e.preventDefault(); adjustVolume(0.1); break;
        case "ArrowDown": e.preventDefault(); adjustVolume(-0.1); break;
        case "f": toggleFullscreen(); break;
        case "m": toggleMute(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, youtubeUrl]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  }
  function skip(s: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + s, v.duration || 0));
    resetControlsTimer();
  }
  function adjustVolume(delta: number) {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Math.max(0, Math.min(1, v.volume + delta));
    v.muted = false;
  }
  function toggleMute() { const v = videoRef.current; if (v) v.muted = !v.muted; }
  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    !document.fullscreenElement ? el.requestFullscreen().catch(() => {}) : document.exitFullscreen().catch(() => {});
  }
  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    resetControlsTimer();
  }
  function setSpeed(rate: number) {
    const v = videoRef.current; if (v) v.playbackRate = rate;
    setPlaybackRate(rate); setShowSpeedMenu(false);
  }
  function setQuality(index: number) {
    if (hlsRef.current) { hlsRef.current.currentLevel = index; setCurrentQuality(index); setShowQualityMenu(false); return; }
    if (shakaRef.current) {
      if (index === -1) { shakaRef.current.configure({ abr: { enabled: true } }); }
      else {
        const tracks = shakaRef.current.getVariantTracks();
        if (tracks[index]) { shakaRef.current.selectVariantTrack(tracks[index], true); shakaRef.current.configure({ abr: { enabled: false } }); }
      }
      setCurrentQuality(index);
    }
    setShowQualityMenu(false);
  }
  function formatTime(s: number): string {
    if (!s || isNaN(s)) return "0:00";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  // Error message mapping
  const errorMessages: Record<string, { title: string; desc: string }> = {
    not_found: { title: "Video not available", desc: "This video URL could not be resolved. Try retrying 2–3 times — it usually works!" },
    stream_error: { title: "Stream error", desc: "The stream encountered an error. Tap Retry — most videos play on 2nd or 3rd attempt." },
    network_error: { title: "Network error", desc: "Check your connection and tap Retry. Videos usually load after 1–2 retries." },
    browser_unsupported: { title: "Browser not supported", desc: "This video format is not supported in your browser. Try Chrome or Firefox." },
  };
  const errInfo = errorMessages[error] || { title: "Playback failed", desc: error };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ background: "rgba(2, 4, 12, 0.97)", backdropFilter: "blur(10px)" }}
      ref={containerRef}
      onClick={(e) => { if (e.target === containerRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-5xl animate-scale-up">

        {/* ── Top bar ── */}
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
          <h2 className="text-white font-bold text-sm sm:text-[15px] line-clamp-1 flex-1 opacity-90">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/80 text-white/60 hover:text-white flex items-center justify-center transition-all flex-shrink-0 border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Player box ── */}
        <div
          ref={wrapperRef}
          className="relative aspect-video bg-[#060810] rounded-2xl overflow-hidden border border-white/5"
          onMouseMove={resetControlsTimer}
          onMouseEnter={resetControlsTimer}
          onClick={() => { if (verified && !youtubeUrl && !loading && !error) { togglePlay(); resetControlsTimer(); } }}
        >

          {/* ── Verification gate ── */}
          {!verified && (
            <div className="absolute inset-0 z-30 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0d0f1e 0%, #111827 100%)" }}>
              <TurnstileGate onVerified={() => setVerified(true)} />
            </div>
          )}

          {/* ── Loading ── */}
          {verified && loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/70">
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-indigo-500 animate-spin" />
                <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-b-violet-400 animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <p className="text-white/60 text-sm font-medium">{progress}</p>
            </div>
          )}

          {/* ── Error state ── */}
          {verified && error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#060810]/95 px-6">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>

              <h3 className="text-white font-extrabold text-base mb-1">{errInfo.title}</h3>
              <p className="text-white/40 text-xs text-center max-w-xs leading-relaxed mb-5">{errInfo.desc}</p>

              {/* Retry tip card */}
              <div className="w-full max-w-sm bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 mb-5 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
                  <div>
                    <p className="text-amber-300 font-bold text-xs mb-1">Tip: Retry 2–3 times</p>
                    <p className="text-white/45 text-[11px] leading-relaxed">
                      Most videos load successfully on the 2nd or 3rd retry due to temporary server throttling. If it still fails, contact us on Telegram.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setRetryCount(c => c + 1); loadVideo(); }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry{retryCount > 0 ? ` (${retryCount})` : ""}
                </button>
                <a
                  href="https://t.me/urs_boy09"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 hover:text-sky-200 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.012 9.47c-.148.668-.54.83-1.093.516l-3.017-2.222-1.457 1.4c-.16.16-.296.296-.607.296l.215-3.06 5.56-5.016c.242-.215-.053-.334-.374-.12L7.084 14.43l-2.95-.923c-.641-.2-.655-.64.134-.948l11.52-4.44c.534-.196 1.002.13.774.13z"/>
                  </svg>
                  Contact
                </a>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="bg-white/8 hover:bg-white/15 text-white/50 hover:text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >Back</button>
              </div>
            </div>
          )}

          {/* ── YouTube ── */}
          {verified && youtubeUrl && !loading && (
            <iframe
              src={youtubeUrl.replace("watch?v=", "embed/").split("&")[0] + "?autoplay=1"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          )}

          {/* ── Video element ── */}
          {!youtubeUrl && (
            <video ref={videoRef} className="w-full h-full" playsInline />
          )}

          {/* ── Custom Controls ── */}
          {verified && !youtubeUrl && !error && (
            <div
              className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10 pointer-events-none" />
              <div className="relative z-10 px-4 pb-4">
                {/* Progress bar */}
                <div className="relative h-1 hover:h-2 bg-white/20 rounded-full cursor-pointer mb-4 transition-all duration-150 group/bar" onClick={seekTo}>
                  <div className="absolute top-0 left-0 h-full bg-white/25 rounded-full pointer-events-none" style={{ width: `${bufferedPct}%` }} />
                  <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full -translate-x-1/2 shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none" style={{ left: `${progressPct}%` }} />
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button onClick={togglePlay} className="text-white hover:text-indigo-300 transition-colors flex-shrink-0">
                    {playing ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                  </button>
                  <button onClick={() => skip(-10)} className="text-white/80 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors flex-shrink-0">-10</button>
                  <button onClick={() => skip(10)} className="text-white/80 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors flex-shrink-0">+10</button>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors">
                      {muted || volume === 0
                        ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                        : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>}
                    </button>
                    <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                      onChange={(e) => { const v = parseFloat(e.target.value); if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; } }}
                      className="w-16 sm:w-20 accent-indigo-500 cursor-pointer" />
                  </div>
                  <span className="text-white/60 text-xs flex-shrink-0 font-mono hidden sm:block">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  <div className="flex-1" />
                  {/* Speed */}
                  <div className="relative flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                      className="text-white/70 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">{playbackRate}x</button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden min-w-[80px] shadow-2xl z-30">
                        {SPEEDS.map(s => (
                          <button key={s} onClick={(e) => { e.stopPropagation(); setSpeed(s); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${playbackRate === s ? "text-indigo-400 bg-indigo-500/10 font-bold" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>{s}x</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Quality */}
                  {qualities.length > 0 && (
                    <div className="relative flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                        className="text-white/70 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        {currentQuality === -1 ? "Auto" : `${qualities.find(q => q.index === currentQuality)?.height || ""}p`}</button>
                      {showQualityMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden min-w-[80px] shadow-2xl z-30">
                          <button onClick={(e) => { e.stopPropagation(); setQuality(-1); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentQuality === -1 ? "text-indigo-400 bg-indigo-500/10 font-bold" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>Auto</button>
                          {qualities.map(q => (
                            <button key={q.index} onClick={(e) => { e.stopPropagation(); setQuality(q.index); }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentQuality === q.index ? "text-indigo-400 bg-indigo-500/10 font-bold" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>{q.height}p</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-white/80 hover:text-white transition-colors flex-shrink-0">
                    {fullscreen
                      ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
                      : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-white/20 text-xs mt-2.5 hidden sm:block">
          Space = play/pause &nbsp;·&nbsp; ← → skip 10s &nbsp;·&nbsp; F = fullscreen &nbsp;·&nbsp; M = mute &nbsp;·&nbsp; Esc = back
        </p>
      </div>
    </div>
  );
}
