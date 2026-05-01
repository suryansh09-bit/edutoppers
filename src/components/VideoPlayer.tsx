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

export default function VideoPlayer({
  batchId,
  subjectId,
  childId,
  subjectSlug,
  title,
  onClose,
}: VideoPlayerProps) {
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
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto

  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shakaRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // ─── Load Video ───────────────────────────────────────────────────────────
  const loadVideo = useCallback(async () => {
    setLoading(true);
    setError("");
    setYoutubeUrl(null);
    setProgress("Fetching video info...");
    setQualities([]);
    setCurrentQuality(-1);

    // Cleanup previous
    if (shakaRef.current) {
      await shakaRef.current.destroy().catch(() => {});
      shakaRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    try {
      const params = new URLSearchParams({
        batchId,
        subjectId,
        childId,
        ...(subjectSlug ? { subjectSlug } : {}),
      });
      const res = await fetch(`/api/video-url?${params.toString()}`);
      const data: VideoData = await res.json();

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

      if (data.type === "drm" && data.mpdUrl && data.kid && data.key) {
        setProgress("Loading DRM player...");
        const shaka = await import("shaka-player");
        shaka.default.polyfill.installAll();

        if (!shaka.default.Player.isBrowserSupported()) {
          // DRM not supported → try HLS
          if (data.hlsUrl) {
            await loadHls(video, data.hlsUrl);
          } else {
            setError("Your browser does not support this video format");
            setLoading(false);
          }
          return;
        }

        const player = new shaka.default.Player();
        await player.attach(video);
        shakaRef.current = player;

        // CloudFront auth query string forwarding
        const mpdParts = data.mpdUrl.split("?");
        if (mpdParts.length > 1) {
          const queryString = "?" + mpdParts[1];
          const engine = player.getNetworkingEngine();
          if (engine) {
            engine.registerRequestFilter(
              (type: number, request: { uris: string[] }) => {
                if ((type === 0 || type === 1) && !request.uris[0].includes("?")) {
                  request.uris[0] += queryString;
                }
              }
            );
          }
        }

        player.configure({
          drm: { clearKeys: { [data.kid]: data.key } },
        });

        player.addEventListener("error", (event: Event) => {
          const detail = (event as Event & { detail?: { message?: string } })?.detail;
          setError(detail?.message || "Video playback error");
        });

        player.addEventListener("variantschanged", () => {
          if (!shakaRef.current) return;
          const tracks = shakaRef.current.getVariantTracks();
          const qs: QualityLevel[] = tracks
            .filter((t: { height: number }) => t.height)
            .map((t: { height: number; bandwidth: number }, i: number) => ({ height: t.height ?? 0, bitrate: t.bandwidth, index: i }))
            .sort((a: QualityLevel, b: QualityLevel) => b.height - a.height);
          setQualities(qs);
        });

        setProgress("Loading video stream...");
        await player.load(data.mpdUrl);
        video.play().catch(() => {});
        setLoading(false);
        setPlaying(true);
      } else if ((data.type === "hls" || data.type === "drm") && (data.hlsUrl || data.videoUrl)) {
        const hlsSource = data.hlsUrl || data.videoUrl || "";
        await loadHls(video, hlsSource);
      } else if (data.videoUrl) {
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
      } else {
        setError("No playable video URL found");
        setLoading(false);
      }
    } catch {
      setError("Failed to load video");
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, subjectId, childId, subjectSlug]);

  async function loadHls(video: HTMLVideoElement, src: string) {
    setProgress("Loading HLS stream...");
    const Hls = (await import("hls.js")).default;
    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 1000,
        fragLoadingMaxRetry: 6,
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
        const lvls: QualityLevel[] = hls.levels.map((l, i) => ({
          height: l.height || 0,
          bitrate: l.bitrate || 0,
          index: i,
        })).sort((a, b) => b.height - a.height);
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
          setError(`HLS error: ${errData.details || "playback failed"}. Please retry.`);
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
        setError("Failed to load stream");
        setLoading(false);
      }, { once: true });
    } else {
      setError("HLS not supported in this browser");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideo();
    return () => {
      shakaRef.current?.destroy().catch(() => {});
      hlsRef.current?.destroy();
    };
  }, [loadVideo]);

  // ─── Video Event Listeners ────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };

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
      const video = videoRef.current;
      if (!video || youtubeUrl) return;
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

  // ─── Fullscreen Listener ──────────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ─── Controls auto-hide ───────────────────────────────────────────────────
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  };

  // ─── Player Controls ──────────────────────────────────────────────────────
  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function skip(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration || 0));
    resetControlsTimer();
  }

  function adjustVolume(delta: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, video.volume + delta));
    video.muted = false;
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }

  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !duration) return;
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
    // HLS quality
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index; // -1 = auto
      setCurrentQuality(index);
      setShowQualityMenu(false);
      return;
    }
    // Shaka quality
    if (shakaRef.current && index >= 0) {
      const tracks = shakaRef.current.getVariantTracks();
      if (tracks[index]) {
        shakaRef.current.selectVariantTrack(tracks[index], true);
        shakaRef.current.configure({ abr: { enabled: false } });
      }
      setCurrentQuality(index);
    } else if (shakaRef.current && index === -1) {
      shakaRef.current.configure({ abr: { enabled: true } });
      setCurrentQuality(-1);
    }
    setShowQualityMenu(false);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
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
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4"
      ref={containerRef}
      onClick={(e) => { if (e.target === containerRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-5xl">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-white font-semibold text-base line-clamp-1 flex-1 mr-4 opacity-90">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none px-2 transition-colors"
            title="Close (Esc)"
          >
            &times;
          </button>
        </div>

        {/* Player wrapper */}
        <div
          ref={wrapperRef}
          className="relative aspect-video bg-black rounded-xl overflow-hidden group"
          onMouseMove={resetControlsTimer}
          onMouseEnter={resetControlsTimer}
          onClick={() => { if (!youtubeUrl && !loading && !error) { togglePlay(); resetControlsTimer(); } }}
        >
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60">
              <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-3" />
              <p className="text-white/70 text-sm">{progress}</p>
            </div>
          )}

          {/* Error overlay */}
          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black">
              <div className="text-5xl mb-3 opacity-40">⚠</div>
              <p className="text-red-400 text-base mb-4 text-center px-4">{error}</p>
              <button
                onClick={(e) => { e.stopPropagation(); loadVideo(); }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* YouTube embed */}
          {youtubeUrl && !loading && (
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
            <video
              ref={videoRef}
              className="w-full h-full"
              playsInline
            />
          )}

          {/* Custom Controls */}
          {!youtubeUrl && !error && (
            <div
              className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              {/* Skip indicators */}
              <div className="absolute inset-0 flex pointer-events-none">
                <div className="flex-1" />
                <div className="flex-1" />
              </div>

              <div className="relative z-10 px-4 pb-3">
                {/* Progress bar */}
                <div
                  className="relative h-1 hover:h-2 bg-white/20 rounded-full cursor-pointer mb-3 transition-all duration-150 group/bar"
                  onClick={seekTo}
                >
                  {/* Buffered */}
                  <div
                    className="absolute top-0 left-0 h-full bg-white/30 rounded-full pointer-events-none"
                    style={{ width: `${bufferedPct}%` }}
                  />
                  {/* Progress */}
                  <div
                    className="absolute top-0 left-0 h-full bg-purple-500 rounded-full pointer-events-none"
                    style={{ width: `${progressPct}%` }}
                  />
                  {/* Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 rounded-full -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `${progressPct}%` }}
                  />
                </div>

                {/* Bottom controls row */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-purple-300 transition-colors flex-shrink-0"
                    title={playing ? "Pause (Space)" : "Play (Space)"}
                  >
                    {playing ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Skip back 10s */}
                  <button
                    onClick={() => skip(-10)}
                    className="text-white hover:text-purple-300 transition-colors flex-shrink-0"
                    title="Back 10s (←)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                      <text x="8.5" y="15" fontSize="5" fill="currentColor">10</text>
                    </svg>
                  </button>

                  {/* Skip forward 10s */}
                  <button
                    onClick={() => skip(10)}
                    className="text-white hover:text-purple-300 transition-colors flex-shrink-0"
                    title="Forward 10s (→)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                      <text x="8.5" y="15" fontSize="5" fill="currentColor">10</text>
                    </svg>
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={toggleMute} className="text-white hover:text-purple-300 transition-colors" title="Mute (m)">
                      {muted || volume === 0 ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (videoRef.current) {
                          videoRef.current.volume = v;
                          videoRef.current.muted = v === 0;
                        }
                      }}
                      className="w-16 sm:w-20 accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Time */}
                  <span className="text-white/70 text-xs flex-shrink-0 font-mono hidden sm:block">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  <div className="flex-1" />

                  {/* Speed */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                      className="text-white/80 hover:text-white text-xs font-medium px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      title="Playback speed"
                    >
                      {playbackRate}x
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-white/10 rounded-lg overflow-hidden min-w-[80px] shadow-xl z-30">
                        {SPEEDS.map((s) => (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); setSpeed(s); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${playbackRate === s ? "text-purple-400 bg-purple-500/10 font-semibold" : "text-white hover:bg-white/10"}`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quality */}
                  {qualities.length > 0 && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                        className="text-white/80 hover:text-white text-xs font-medium px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                        title="Video quality"
                      >
                        {currentQuality === -1 ? "Auto" : `${qualities.find((q) => q.index === currentQuality)?.height || ""}p`}
                      </button>
                      {showQualityMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-white/10 rounded-lg overflow-hidden min-w-[80px] shadow-xl z-30">
                          <button
                            onClick={(e) => { e.stopPropagation(); setQuality(-1); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentQuality === -1 ? "text-purple-400 bg-purple-500/10 font-semibold" : "text-white hover:bg-white/10"}`}
                          >
                            Auto
                          </button>
                          {qualities.map((q) => (
                            <button
                              key={q.index}
                              onClick={(e) => { e.stopPropagation(); setQuality(q.index); }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentQuality === q.index ? "text-purple-400 bg-purple-500/10 font-semibold" : "text-white hover:bg-white/10"}`}
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
                    className="text-white hover:text-purple-300 transition-colors flex-shrink-0"
                    title="Fullscreen (f)"
                  >
                    {fullscreen ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
