"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { api } from "@/lib/api";
import { extractYouTubeVideoId } from "@/lib/youtube";

export interface VideoPlayerHandle {
  getCurrentTime: () => number | null;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          height?: string;
          width?: string;
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState?: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

const PROGRESS_SAVE_INTERVAL_MS = 15000; // 15 seconds
const YT_ENDED = 0;
const YT_PAUSED = 2;

interface VideoPlayerProps {
  /** Our backend video id (for progress API) */
  videoId: number;
  /** Full YouTube URL (used to extract YouTube video id) */
  youtubeUrl: string;
  /** Initial position in seconds (from GET progress) */
  initialPositionSeconds?: number;
  /** If set, optional "auto play next" triggers this when video ends */
  nextVideoId?: number | null;
  /** Callback when video ends and nextVideoId is set (parent can navigate) */
  onPlayNext?: (nextVideoId: number) => void;
  /** Callback when video is marked completed (parent can refetch course progress / refresh sidebar) */
  onCompleted?: () => void;
  /** Course id for building next lesson URL if needed */
  courseId?: string;
  className?: string;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  {
    videoId,
    youtubeUrl,
    initialPositionSeconds = 0,
    nextVideoId,
    onPlayNext,
    onCompleted,
    className = "",
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveProgressRef = useRef<(currentTime: number, isCompleted: boolean) => Promise<void>>(() => Promise.resolve());
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const completedRef = useRef(false);

  const saveProgress = useCallback(
    async (currentTime: number, isCompleted: boolean) => {
      try {
        await api.post(`/progress/videos/${videoId}`, {
          last_position_seconds: Math.floor(currentTime),
          is_completed: isCompleted,
        });
      } catch {
        // Non-blocking; progress will retry on next interval or end
      }
    },
    [videoId]
  );
  saveProgressRef.current = saveProgress;

  useImperativeHandle(
    ref,
    () => ({
      getCurrentTime: () => {
        const p = playerRef.current;
        if (!p) return null;
        try {
          const t = p.getCurrentTime();
          if (!Number.isFinite(t) || t < 0) return null;
          // YouTube API returns seconds; ensure integer for consistent mm:ss display
          let seconds = Math.floor(t);
          // If value is unreasonably large (> 24h), might be in milliseconds
          if (seconds > 86400) seconds = Math.floor(seconds / 1000);
          return seconds;
        } catch {
          return null;
        }
      },
    }),
    []
  );

  useEffect(() => {
    const ytVideoId = extractYouTubeVideoId(youtubeUrl);
    if (!ytVideoId) {
      setError("Invalid or unsupported video URL");
      return;
    }

    const containerId = "yt-player-" + videoId;
    let mounted = true;

    function loadScript(): Promise<void> {
      if (window.YT?.Player) return Promise.resolve();
      return new Promise((resolve) => {
        const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (existing) {
          if (window.YT?.Player) return resolve();
          window.onYouTubeIframeAPIReady = () => resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prevReady?.();
          resolve();
        };
        document.head.appendChild(script);
      });
    }

    loadScript().then(() => {
      if (!mounted || !containerRef.current) return;
      const YT = window.YT;
      if (!YT?.Player) {
        setError("YouTube player failed to load");
        return;
      }

      try {
        new YT.Player(containerId, {
          height: "360",
          width: "100%",
          videoId: ytVideoId,
          playerVars: {
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : "",
          },
          events: {
            onReady(event: { target: YTPlayer }) {
              if (!mounted) return;
              const p = event.target;
              playerRef.current = p;
              if (initialPositionSeconds > 0) {
                p.seekTo(initialPositionSeconds, true);
              }
              setIsReady(true);
              setError(null);
            },
            onStateChange(event: { data: number; target: YTPlayer }) {
              if (!mounted) return;
              const target = event.target;
              if (event.data === YT_PAUSED) {
                const currentTime = target.getCurrentTime();
                if (Number.isFinite(currentTime) && currentTime >= 0) {
                  saveProgressRef.current(currentTime, false);
                }
              }
              if (event.data === YT_ENDED) {
                const currentTime = target.getCurrentTime();
                completedRef.current = true;
                saveProgressRef.current(currentTime, true).then(() => {
                  onCompleted?.();
                  if (nextVideoId != null && onPlayNext) {
                    onPlayNext(nextVideoId);
                  }
                });
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
              }
            },
          },
        });
      } catch {
        setError("Could not load video. It may be private or unavailable.");
      }
    });

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [youtubeUrl, videoId, initialPositionSeconds, nextVideoId, onPlayNext, onCompleted]);

  useEffect(() => {
    if (!isReady || completedRef.current) return;
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || completedRef.current) return;
      try {
        const state = p.getPlayerState?.();
        if (state === YT_ENDED) return;
        const currentTime = p.getCurrentTime();
        if (Number.isFinite(currentTime) && currentTime >= 0) {
          saveProgressRef.current(currentTime, false);
        }
      } catch {
        // ignore
      }
    }, PROGRESS_SAVE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isReady]);

  if (error) {
    return (
      <div className={`rounded-lg bg-gray-100 dark:bg-gray-800 p-6 text-center ${className}`}>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div id={"yt-player-" + videoId} ref={containerRef} className="aspect-video bg-black rounded-lg" />
    </div>
  );
});
