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
  const videoRef = useRef<HTMLVideoElement>(null);
  const shakaRef = useRef<{ destroy: () => Promise<void> } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadVideo = useCallback(async () => {
    setLoading(true);
    setError("");
    setProgress("Fetching video info...");

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

      // YouTube
      if (data.type === "youtube" && data.videoUrl) {
        setYoutubeUrl(data.videoUrl);
        setLoading(false);
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      if (data.type === "drm" && data.mpdUrl && data.kid && data.key) {
        setProgress("Loading DRM video player...");

        const shaka = await import("shaka-player");
        shaka.default.polyfill.installAll();

        if (!shaka.default.Player.isBrowserSupported()) {
          // Fallback to HLS if DRM not supported
          if (data.hlsUrl) {
            const Hls = (await import("hls.js")).default;
            if (Hls.isSupported()) {
              const hls = new Hls();
              hls.loadSource(data.hlsUrl);
              hls.attachMedia(video);
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {});
                setLoading(false);
              });
              return;
            }
          }
          setError("Your browser does not support video playback");
          setLoading(false);
          return;
        }

        const player = new shaka.default.Player();
        await player.attach(video);
        shakaRef.current = player;

        // Register request filter to append CloudFront auth params to segment requests
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
          drm: {
            clearKeys: {
              [data.kid]: data.key,
            },
          },
        });

        player.addEventListener("error", (event: Event) => {
          const detail = (event as Event & { detail?: { message?: string } })?.detail;
          setError(detail?.message || "Video playback error");
        });

        setProgress("Loading video stream...");
        await player.load(data.mpdUrl);
        video.play().catch(() => {});
        setLoading(false);
      } else if ((data.type === "hls" || data.type === "drm") && (data.videoUrl || data.hlsUrl)) {
        setProgress("Loading HLS video...");

        const Hls = (await import("hls.js")).default;

        const hlsSource = data.hlsUrl || data.videoUrl || "";

        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(hlsSource);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
            setLoading(false);
          });
          hls.on(Hls.Events.ERROR, (_event: string, errData: { fatal?: boolean; type?: string }) => {
            if (errData.fatal) {
              setError("HLS playback error");
              setLoading(false);
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = hlsSource;
          video.addEventListener("loadedmetadata", () => {
            video.play().catch(() => {});
            setLoading(false);
          });
        } else {
          setError("HLS not supported in this browser");
          setLoading(false);
        }
      } else if (data.videoUrl) {
        video.src = data.videoUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch(() => {});
          setLoading(false);
        });
        video.addEventListener("error", () => {
          setError("Failed to load video");
          setLoading(false);
        });
      } else {
        setError("No playable video URL found");
        setLoading(false);
      }
    } catch {
      setError("Failed to load video");
      setLoading(false);
    }
  }, [batchId, subjectId, childId, subjectSlug]);

  useEffect(() => {
    loadVideo();

    return () => {
      if (shakaRef.current) {
        shakaRef.current.destroy().catch(() => {});
      }
    };
  }, [loadVideo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === containerRef.current) onClose();
      }}
      ref={containerRef}
    >
      <div className="relative w-full max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-lg line-clamp-1 flex-1 mr-4">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-3xl leading-none px-2"
          >
            &times;
          </button>
        </div>

        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="animate-spin w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full mb-4" />
              <p className="text-white/70 text-sm">{progress}</p>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 opacity-50">&#9888;</div>
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button
                onClick={loadVideo}
                className="btn-purple text-white px-6 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : youtubeUrl ? (
            <iframe
              src={youtubeUrl.replace("watch?v=", "embed/").split("&")[0] + "?autoplay=1"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              playsInline
              autoPlay
            />
          )}
        </div>
      </div>
    </div>
  );
}
