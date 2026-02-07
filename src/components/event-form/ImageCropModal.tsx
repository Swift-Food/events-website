"use client";

import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { X } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageToCrop: string | null;
  crop: { x: number; y: number };
  zoom: number;
  isUploading: boolean;
  aspect?: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ImageCropModal({
  isOpen,
  imageToCrop,
  crop,
  zoom,
  isUploading,
  aspect = 1,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onSave,
  onCancel,
}: ImageCropModalProps) {
  if (!isOpen || !imageToCrop) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#1a1a1a]/70 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Crop Image</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="relative h-[300px] w-full rounded-xl bg-black overflow-hidden">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
            <label className="text-xs font-medium text-muted-foreground">
              Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="flex-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-6 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isUploading}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
