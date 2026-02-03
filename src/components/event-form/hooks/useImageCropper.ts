import { useState, useCallback, useRef } from "react";
import type { Area } from "react-easy-crop";
import { imageService } from "@/services/image.service";
import { toast } from "sonner";

interface UseImageCropperOptions {
  onCropComplete: (imageUrl: string, imageName: string) => void;
}

interface UseImageCropperReturn {
  isCropModalOpen: boolean;
  imageToCrop: string | null;
  coverName: string;
  crop: { x: number; y: number };
  zoom: number;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setCrop: (crop: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  onCropAreaComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  triggerFileInput: () => void;
}

export function useImageCropper({
  onCropComplete,
}: UseImageCropperOptions): UseImageCropperReturn {
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [coverName, setCoverName] = useState("invite-cover.png");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const objectURL = URL.createObjectURL(file);
      setImageToCrop(objectURL);
      setCoverName(file.name);
      setIsCropModalOpen(true);
    },
    [],
  );

  const onCropAreaComplete = useCallback(
    (_croppedArea: Area, pixels: Area) => {
      setCroppedAreaPixels(pixels);
    },
    [],
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Failed to create blob");
        }
        const croppedImageUrl = URL.createObjectURL(blob);
        resolve(croppedImageUrl);
      }, "image/jpeg");
    });
  };

  const handleSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      setIsUploading(true);

      // First, crop the image locally
      const croppedImageBlob = await getCroppedImg(
        imageToCrop,
        croppedAreaPixels,
      );

      // Upload the cropped image to the server
      const uploadedImageUrl = await imageService.uploadImageFromBlob(
        croppedImageBlob,
        coverName,
      );

      // Call the callback with the uploaded URL
      onCropComplete(uploadedImageUrl, coverName);
      toast.success("Image uploaded successfully!");

      // Reset state
      setIsCropModalOpen(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (e) {
      console.error("Error uploading image:", e);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = useCallback(() => {
    setIsCropModalOpen(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    isCropModalOpen,
    imageToCrop,
    coverName,
    crop,
    zoom,
    isUploading,
    fileInputRef,
    handleImageSelect,
    setCrop,
    setZoom,
    onCropAreaComplete,
    handleSave,
    handleCancel,
    triggerFileInput,
  };
}
