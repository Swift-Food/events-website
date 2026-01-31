"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Upload,
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  Video,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { imageService } from "@/services/image.service";
import { highlightService } from "@/services/highlight.service";
import { HighlightMediaItem } from "@/types/highlight";

interface AddHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  calendarId?: string;
}

interface MediaPreview extends HighlightMediaItem {
  id: string;
  file?: File;
  isUploading?: boolean;
  isUploaded?: boolean;
}

export default function AddHighlightModal({
  isOpen,
  onClose,
  onSuccess,
  calendarId,
}: AddHighlightModalProps) {
  const [mediaItems, setMediaItems] = useState<MediaPreview[]>([]);
  const [caption, setCaption] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newItems: MediaPreview[] = [];

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (!isVideo && !isImage) {
          toast.error(`${file.name} is not a supported file type`);
          continue;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        const mediaItem: MediaPreview = {
          id: generateId(),
          url: previewUrl,
          type: isVideo ? "video" : "image",
          file,
          isUploading: false,
          isUploaded: false,
        };

        // Get video duration if it's a video
        if (isVideo) {
          const video = document.createElement("video");
          video.src = previewUrl;
          await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => {
              mediaItem.duration = Math.round(video.duration);
              resolve();
            };
            video.onerror = () => resolve();
          });
        }

        newItems.push(mediaItem);
      }

      setMediaItems((prev) => [...prev, ...newItems]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  // Remove media item
  const removeMediaItem = useCallback((id: string) => {
    setMediaItems((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item && !item.isUploaded) {
        URL.revokeObjectURL(item.url);
      }
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  // Move media item in order
  const moveMediaItem = useCallback((fromIndex: number, toIndex: number) => {
    setMediaItems((prev) => {
      const items = [...prev];
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      return items;
    });
  }, []);

  // Upload all media and create highlight
  const handleSubmit = async () => {
    if (mediaItems.length === 0) {
      toast.error("Please add at least one image or video");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all media items that haven't been uploaded yet
      const uploadedItems: HighlightMediaItem[] = [];

      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];

        if (item.isUploaded) {
          // Already uploaded
          uploadedItems.push({
            url: item.url,
            type: item.type,
            duration: item.duration,
            thumbnailUrl: item.thumbnailUrl,
          });
          continue;
        }

        if (!item.file) {
          throw new Error("File missing for upload");
        }

        // Update uploading state
        setMediaItems((prev) =>
          prev.map((m) =>
            m.id === item.id ? { ...m, isUploading: true } : m
          )
        );

        // Upload the file
        const uploadedUrl = await imageService.uploadImage(item.file);

        // Update uploaded state
        setMediaItems((prev) =>
          prev.map((m) =>
            m.id === item.id
              ? { ...m, url: uploadedUrl, isUploading: false, isUploaded: true }
              : m
          )
        );

        uploadedItems.push({
          url: uploadedUrl,
          type: item.type,
          duration: item.duration,
          thumbnailUrl: item.thumbnailUrl,
        });
      }

      // Create the highlight
      await highlightService.createHighlight({
        mediaItems: uploadedItems,
        caption: caption.trim() || undefined,
        calendarId,
        expiresInHours,
      });

      toast.success("Highlight created successfully!");
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Failed to create highlight:", error);
      toast.error(
        error.response?.data?.message || "Failed to create highlight"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up and close
  const handleClose = () => {
    // Clean up blob URLs
    mediaItems.forEach((item) => {
      if (!item.isUploaded && item.file) {
        URL.revokeObjectURL(item.url);
      }
    });
    setMediaItems([]);
    setCaption("");
    setExpiresInHours(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-card-background shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Create Highlight
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Media upload area */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Media
            </label>

            {/* Uploaded media preview */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {mediaItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-card-secondary-background group"
                  >
                    {item.type === "image" ? (
                      <Image
                        src={item.url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="h-full w-full object-cover"
                      />
                    )}

                    {/* Type indicator */}
                    <div className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded bg-black/60">
                      {item.type === "video" ? (
                        <Video className="h-3 w-3 text-white" />
                      ) : (
                        <ImageIcon className="h-3 w-3 text-white" />
                      )}
                    </div>

                    {/* Loading overlay */}
                    {item.isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => removeMediaItem(item.id)}
                      disabled={item.isUploading || isSubmitting}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    {/* Reorder buttons */}
                    <div className="absolute left-1 top-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {index > 0 && (
                        <button
                          onClick={() => moveMediaItem(index, index - 1)}
                          disabled={isSubmitting}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                        >
                          ←
                        </button>
                      )}
                      {index < mediaItems.length - 1 && (
                        <button
                          onClick={() => moveMediaItem(index, index + 1)}
                          disabled={isSubmitting}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                        >
                          →
                        </button>
                      )}
                    </div>

                    {/* Order number */}
                    <div className="absolute bottom-1 right-1 flex h-5 min-w-5 items-center justify-center rounded bg-primary px-1 text-[10px] font-semibold text-white">
                      {index + 1}
                    </div>
                  </div>
                ))}

                {/* Add more button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="aspect-square rounded-lg border-2 border-dashed border-white/20 bg-card-secondary-background flex items-center justify-center transition-colors hover:border-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Empty state upload area */}
            {mediaItems.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full rounded-xl border-2 border-dashed border-white/20 bg-card-secondary-background p-8 flex flex-col items-center justify-center gap-3 transition-colors hover:border-primary hover:bg-primary/10 disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Upload media
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images and videos supported
                  </p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 500))}
              placeholder="Add a caption to your highlight..."
              rows={3}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-white/10 bg-card-secondary-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {caption.length}/500
            </p>
          </div>

          {/* Expiration */}
          {/* <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Expires in
            </label>
            <div className="flex gap-2">
              {[12, 24, 48, 72].map((hours) => (
                <button
                  key={hours}
                  onClick={() => setExpiresInHours(hours)}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    expiresInHours === hours
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 bg-card-secondary-background text-foreground hover:border-white/20"
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mediaItems.length === 0 || isSubmitting}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Highlight"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
