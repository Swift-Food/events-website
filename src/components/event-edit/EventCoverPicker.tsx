/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Shuffle, Check, Loader2, Upload } from "lucide-react";
import { eventCoverService } from "@/services/event-cover.service";

interface EventCoverPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  onUploadClick: () => void;
  currentCover: string | null;
}

function formatCategoryName(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function EventCoverPicker({
  isOpen,
  onClose,
  onSelect,
  onUploadClick,
  currentCover,
}: EventCoverPickerProps) {
  const [imagesByCategory, setImagesByCategory] = useState<
    Record<string, string[]>
  >({});
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    currentCover
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const imageGridRef = useRef<HTMLDivElement>(null);

  // Fetch all covers in one request
  useEffect(() => {
    if (!isOpen) return;
    // Skip if already loaded
    if (categories.length > 0) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const data = await eventCoverService.getAll();
        setImagesByCategory(data);
        const cats = Object.keys(data);
        setCategories(cats);
        if (cats.length > 0) {
          setActiveCategory(cats[0]);
        }
      } catch (error) {
        console.error("Failed to fetch cover images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isOpen, categories.length]);

  // Scroll image grid to top when changing categories
  useEffect(() => {
    if (imageGridRef.current) {
      imageGridRef.current.scrollTop = 0;
    }
  }, [activeCategory]);

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      requestAnimationFrame(() => setIsAnimating(false));
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleImageClick = useCallback(
    (imageUrl: string) => {
      setSelectedImage(imageUrl);
      onSelect(imageUrl);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleRandom = useCallback(() => {
    if (categories.length === 0) return;

    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const images = imagesByCategory[randomCategory] || [];

    if (images.length > 0) {
      const randomImage = images[Math.floor(Math.random() * images.length)];
      setActiveCategory(randomCategory);
      setSelectedImage(randomImage);
      onSelect(randomImage);
    }
  }, [categories, imagesByCategory, onSelect]);

  // Click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  const currentImages = activeCategory
    ? imagesByCategory[activeCategory] || []
    : [];

  const imageGrid = (cols: string) =>
    loading ? (
      <div className={`grid ${cols} gap-3`}>
        {Array.from({ length: cols === "grid-cols-3" ? 9 : 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    ) : currentImages.length === 0 ? (
      <div className="flex items-center justify-center h-full text-white/60 text-sm">
        No images available
      </div>
    ) : (
      <div className={`grid ${cols} gap-3`}>
        {currentImages.map((imageUrl, index) => (
          <button
            key={`${activeCategory}-${index}`}
            type="button"
            onClick={() => handleImageClick(imageUrl)}
            className={`relative aspect-[4/3] rounded-xl overflow-hidden group transition-all cursor-pointer ${
              selectedImage === imageUrl
                ? "ring-3 ring-amber-500 ring-offset-2 ring-offset-[#1a1a1a]"
                : "hover:ring-2 hover:ring-white/20"
            }`}
          >
            <img
              src={imageUrl}
              alt={`${formatCategoryName(activeCategory || "")} cover ${index + 1}`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {selectedImage === imageUrl && (
              <div className="absolute inset-0 bg-amber-600/20 flex items-center justify-center">
                <div className="rounded-full bg-amber-600 p-1.5">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 transition-opacity duration-200 ${
        isAnimating ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`w-full sm:max-w-4xl h-[85vh] sm:h-[80vh] sm:max-h-[700px] rounded-t-2xl sm:rounded-2xl bg-[#1a1a1a]/70 backdrop-blur-sm border border-white/10 text-white flex flex-col overflow-hidden transition-transform duration-200 ${
          isAnimating ? "translate-y-full sm:translate-y-0 sm:scale-95" : "translate-y-0 sm:scale-100"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold">Choose Cover</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onUploadClick();
              }}
              className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/15"
            >
              <Upload className="h-4 w-4" />
              Upload your own
            </button>
            <button
              type="button"
              onClick={handleRandom}
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-amber-600/20 px-4 py-2 text-sm font-medium text-amber-400 transition-all hover:bg-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shuffle className="h-4 w-4" />
              )}
              Random
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Body: sidebar + grid */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Category sidebar — desktop */}
          <div className="hidden md:flex flex-col w-48 shrink-0 border-r border-white/10 overflow-y-auto py-2">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-9 rounded-lg bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all ${
                    activeCategory === category
                      ? "bg-amber-600/20 text-amber-400 border-r-2 border-amber-500"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {formatCategoryName(category)}
                </button>
              ))
            )}
          </div>

          {/* Mobile layout */}
          <div className="md:hidden flex flex-col min-h-0 flex-1 overflow-hidden">
            <div className="flex gap-2 px-4 py-3 overflow-x-auto shrink-0 border-b border-white/10">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-20 rounded-full bg-white/5 animate-pulse shrink-0"
                    />
                  ))
                : categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        activeCategory === category
                          ? "bg-amber-600 text-white"
                          : "bg-white/10 text-white/60 hover:bg-white/15"
                      }`}
                    >
                      {formatCategoryName(category)}
                    </button>
                  ))}
            </div>
            {/* Mobile upload button */}
            <div className="px-4 py-3 border-b border-white/10 sm:hidden">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUploadClick();
                }}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/15"
              >
                <Upload className="h-4 w-4" />
                Upload your own
              </button>
            </div>
            <div ref={imageGridRef} className="flex-1 overflow-y-auto p-4">
              {imageGrid("grid-cols-2")}
            </div>
          </div>

          {/* Desktop image grid */}
          <div
            ref={imageGridRef}
            className="hidden md:block flex-1 overflow-y-auto p-5"
          >
            {imageGrid("grid-cols-3")}
          </div>
        </div>
      </div>
    </div>
  );
}
