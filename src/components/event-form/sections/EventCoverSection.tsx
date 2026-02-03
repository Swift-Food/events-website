/* eslint-disable @next/next/no-img-element */
"use client";

import { Shuffle } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";
import { eventCoverService } from "@/services/event-cover.service";
import { toast } from "sonner";

interface EventCoverSectionProps {
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCoverPicker: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function EventCoverSection({
  onImageSelect,
  onOpenCoverPicker,
  fileInputRef,
}: EventCoverSectionProps) {
  const { coverPreview, setCoverPreview, setCoverName } = useEventCreation();

  const handleRandomizeCover = async () => {
    try {
      const allCovers = await eventCoverService.getAll();
      const categories = Object.keys(allCovers);
      if (categories.length === 0) return;
      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];
      const images = allCovers[randomCategory];
      if (!images || images.length === 0) return;
      const randomImage = images[Math.floor(Math.random() * images.length)];
      setCoverPreview(randomImage);
      setCoverName("gallery-cover.png");
    } catch (error) {
      console.error("Failed to randomize cover:", error);
      toast.error("Failed to randomize cover");
    }
  };

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card-background backdrop-blur-sm">
      {coverPreview ? (
        <img
          src={coverPreview}
          alt="Event cover"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-card-background">
          <span className="text-3xl font-serif text-foreground">
            You Are Invited
          </span>
          <span className="text-sm text-muted-foreground">
            Upload a cover image
          </span>
        </div>
      )}
      <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenCoverPicker}
          className="rounded-full bg-primary/90 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary hover:scale-105 cursor-pointer"
        >
          Change cover
        </button>
        <button
          type="button"
          onClick={handleRandomizeCover}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/90 backdrop-blur-md text-primary-foreground transition-all hover:bg-primary hover:scale-105 cursor-pointer"
          aria-label="Randomize cover"
        >
          <Shuffle className="h-4 w-4" />
        </button>
      </div>
      <input
        id="cover-upload"
        type="file"
        accept="image/*"
        className="sr-only"
        ref={fileInputRef}
        onChange={onImageSelect}
      />
    </div>
  );
}
