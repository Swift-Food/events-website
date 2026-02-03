"use client";

import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface ImageCropModalProps {
  isOpen: boolean;
  imageToCrop: string | null;
  crop: { x: number; y: number };
  zoom: number;
  isUploading: boolean;
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
  onCropChange,
  onZoomChange,
  onCropComplete,
  onSave,
  onCancel,
}: ImageCropModalProps) {
  if (!isOpen || !imageToCrop) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-card-background backdrop-blur-2xl p-8 text-foreground">
        <h2 className="mb-6 text-3xl font-bold">Crop Image</h2>

        <div className="relative h-[500px] w-full rounded-2xl bg-black">
          <Cropper
            image={imageToCrop}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-4">
            <label className="text-sm font-semibold text-foreground">
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

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="flex-1 rounded-full bg-card-background backdrop-blur-md py-4 text-center font-semibold text-foreground transition-all hover:bg-white/15 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isUploading}
              className="flex-1 rounded-full bg-primary py-4 text-center font-bold text-primary-foreground transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
