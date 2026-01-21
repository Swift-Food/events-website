"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { HighlightResponseDto, HighlightMediaItem } from "@/types/highlight";

interface HighlightViewerProps {
  highlights: HighlightResponseDto[];
  initialHighlightIndex?: number;
  onClose: () => void;
}

const IMAGE_DURATION = 5000; // 5 seconds for images

export default function HighlightViewer({
  highlights,
  initialHighlightIndex = 0,
  onClose,
}: HighlightViewerProps) {
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(initialHighlightIndex);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedProgressRef = useRef<number>(0);

  const currentHighlight = highlights[currentHighlightIndex];
  const currentMedia = currentHighlight?.mediaItems[currentMediaIndex];
  const totalMediaItems = currentHighlight?.mediaItems.length || 0;

  // Calculate time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Get duration for current media
  const getCurrentDuration = useCallback(() => {
    if (!currentMedia) return IMAGE_DURATION;
    if (currentMedia.type === "video" && currentMedia.duration) {
      return currentMedia.duration * 1000; // Convert to ms
    }
    return IMAGE_DURATION;
  }, [currentMedia]);

  // Navigate to next media item or highlight
  const goToNext = useCallback(() => {
    if (currentMediaIndex < totalMediaItems - 1) {
      // Go to next media in current highlight
      setCurrentMediaIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentHighlightIndex < highlights.length - 1) {
      // Go to next highlight
      setCurrentHighlightIndex((prev) => prev + 1);
      setCurrentMediaIndex(0);
      setProgress(0);
    } else {
      // End of all highlights
      onClose();
    }
  }, [currentMediaIndex, totalMediaItems, currentHighlightIndex, highlights.length, onClose]);

  // Navigate to previous media item or highlight
  const goToPrevious = useCallback(() => {
    if (currentMediaIndex > 0) {
      // Go to previous media in current highlight
      setCurrentMediaIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentHighlightIndex > 0) {
      // Go to previous highlight
      setCurrentHighlightIndex((prev) => prev - 1);
      const prevHighlight = highlights[currentHighlightIndex - 1];
      setCurrentMediaIndex(prevHighlight.mediaItems.length - 1);
      setProgress(0);
    }
  }, [currentMediaIndex, currentHighlightIndex, highlights]);

  // Handle progress and auto-advance
  useEffect(() => {
    if (!currentMedia || isPaused) return;

    const duration = getCurrentDuration();
    startTimeRef.current = Date.now() - pausedProgressRef.current * duration;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      if (newProgress >= 1) {
        goToNext();
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentMedia, isPaused, getCurrentDuration, goToNext, currentMediaIndex, currentHighlightIndex]);

  // Reset paused progress when media changes
  useEffect(() => {
    pausedProgressRef.current = 0;
    setProgress(0);
  }, [currentMediaIndex, currentHighlightIndex]);

  // Handle video playback
  useEffect(() => {
    if (videoRef.current && currentMedia?.type === "video") {
      videoRef.current.muted = isMuted;
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          // Autoplay might be blocked
        });
      }
    }
  }, [currentMedia, isPaused, isMuted]);

  // Pause/resume
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      pausedProgressRef.current = progress;
      setIsPaused(true);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          onClose();
          break;
        case " ":
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Handle touch/click navigation
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width / 3) {
      goToPrevious();
    } else if (clickX > (width * 2) / 3) {
      goToNext();
    } else {
      togglePause();
    }
  };

  if (!currentHighlight || !currentMedia) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Progress bars */}
      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 px-3 pt-3">
        {currentHighlight.mediaItems.map((_, index) => (
          <div
            key={index}
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
          >
            <div
              className="h-full bg-white transition-all duration-50 ease-linear"
              style={{
                width:
                  index < currentMediaIndex
                    ? "100%"
                    : index === currentMediaIndex
                    ? `${progress * 100}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent pb-16 pt-6">
        <div className="flex items-center justify-between px-4">
          <Link
            href={currentHighlight.owner ? `/user/${currentHighlight.owner.id}` : "#"}
            className="flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            {currentHighlight.owner?.profilePicture ? (
              <Image
                src={currentHighlight.owner.profilePicture}
                alt={currentHighlight.owner.organizationName}
                width={40}
                height={40}
                className="rounded-full border-2 border-white"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary/20">
                <span className="text-sm font-semibold text-white">
                  {currentHighlight.owner?.organizationName?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">
                {currentHighlight.owner?.organizationName || "Unknown"}
              </p>
              <p className="text-xs text-white/70">
                {getTimeAgo(currentHighlight.createdAt)}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {currentMedia.type === "video" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePause();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Media content */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={handleContentClick}
      >
        {currentMedia.type === "image" ? (
          <Image
            src={currentMedia.url}
            alt=""
            fill
            className="object-contain"
            priority
          />
        ) : (
          <video
            ref={videoRef}
            src={currentMedia.url}
            poster={currentMedia.thumbnailUrl}
            className="h-full w-full object-contain"
            playsInline
            autoPlay
            muted={isMuted}
            loop={false}
          />
        )}
      </div>

      {/* Navigation arrows (desktop) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToPrevious();
        }}
        className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/40 sm:block"
        style={{
          visibility:
            currentHighlightIndex === 0 && currentMediaIndex === 0
              ? "hidden"
              : "visible",
        }}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToNext();
        }}
        className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/40 sm:block"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Caption */}
      {currentHighlight.caption && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-4 pb-6 pt-16">
          <p className="text-sm text-white">{currentHighlight.caption}</p>
        </div>
      )}

      {/* Highlight navigation dots (when multiple highlights) */}
      {highlights.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {highlights.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentHighlightIndex(index);
                setCurrentMediaIndex(0);
                setProgress(0);
              }}
              className={`h-1.5 rounded-full transition-all ${
                index === currentHighlightIndex
                  ? "w-4 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
