/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Edit, Trash2 } from "lucide-react";
import EventDescriptionModal from "@/components/event-edit/EventDescriptionModal";
import CapacityModal from "@/components/event-edit/CapacityModal";
import {
  EventCreationProvider,
  useEventCreation,
} from "@/context/EventCreationContext";

function EventCreationForm() {
  const {
    eventName,
    setEventName,
    start,
    setStart,
    end,
    setEnd,
    location,
    setLocation,
    tickets,
    setTickets,
    ticketPrice,
    setTicketPrice,
    requireApproval,
    setRequireApproval,
    capacity,
    setCapacity,
    coverPreview,
    setCoverPreview,
    coverName,
    setCoverName,
    clearForm,
  } = useEventCreation();

  // Local state for UI only
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(value));
    } catch {
      return "Select date";
    }
  };

  const formattedStart = useMemo(() => formatDate(start), [start]);
  const formattedEnd = useMemo(() => formatDate(end), [end]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectURL = URL.createObjectURL(file);
    setImageToCrop(objectURL);
    setCoverName(file.name);
    setIsCropModalOpen(true);
  };

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
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
    pixelCrop: Area
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
      pixelCrop.height
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

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setCoverPreview(croppedImage);
      setIsCropModalOpen(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageRemove = () => {
    setCoverPreview(null);
    setCoverName("invite-cover.png");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDescriptionClick = () => {
    setIsDescriptionModalOpen(true);
  };

  const handleClearForm = () => {
    if (
      confirm(
        "Are you sure you want to clear the entire form? This action cannot be undone."
      )
    ) {
      clearForm();
      // Also clear local file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-6xl flex-col gap-6 text-foreground lg:flex-row">
        <section className="flex flex-col gap-5 rounded-3xl bg-card-background backdrop-blur-2xl shadow-2xl shadow-white/5 p-7 lg:w-96 lg:shrink-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card-background backdrop-blur-sm shadow-lg">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Event cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted">
                <span className="text-3xl font-serif text-foreground">
                  You Are Invited
                </span>
                <span className="text-sm text-muted-foreground">
                  Upload a cover image
                </span>
              </div>
            )}
            <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
              <label
                htmlFor="cover-upload"
                className="rounded-full bg-primary/90 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-xl transition-all hover:bg-primary hover:scale-105 cursor-pointer"
              >
                Change cover
              </label>
              {coverPreview && (
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="rounded-full bg-white/20 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-foreground shadow-xl transition-all hover:bg-white/30 hover:scale-105"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 text-sm shadow-lg">
            <div className="flex items-center justify-between text-muted-foreground">
              <div>
                <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground/60">
                  Starts
                </p>
                <p className="text-base font-semibold text-foreground mt-1">
                  {formattedStart}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground/60">
                  Ends
                </p>
                <p className="text-base font-semibold text-foreground mt-1">
                  {formattedEnd}
                </p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-foreground/10 text-xs text-muted-foreground">
              <span className="font-medium">Cover:</span>{" "}
              <span className="text-foreground font-medium">{coverName}</span>
            </div>
          </div>
        </section>

        <section className="flex-1 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Event Name"
                className="w-full bg-transparent text-3xl md:text-5xl font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <button
              type="button"
              onClick={handleClearForm}
              className="flex items-center gap-2 rounded-2xl bg-red-500/10 backdrop-blur-md px-5 py-3 text-red-400 transition-all hover:bg-red-500/20 hover:scale-105 shadow-lg"
              title="Clear entire form"
            >
              <Trash2 className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">Clear Form</span>
            </button>
          </div>

          <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6 shadow-xl">
            <div className="flex gap-5">
              <div className="flex flex-col items-center py-3">
                <div className="h-3.5 w-3.5 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                <div className="my-2 w-0.5 flex-1 rounded-full bg-primary/30"></div>
                <div className="h-3.5 w-3.5 rounded-full bg-primary/30 shadow-md"></div>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="text-sm font-medium text-muted-foreground sm:w-14">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="flex-1 rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="text-sm font-medium text-muted-foreground sm:w-14">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="flex-1 rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6 shadow-xl">
            <label className="text-base text-foreground font-semibold">
              Event Location
            </label>
            <input
              type="text"
              placeholder="Offline location or virtual link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-3 w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40 shadow-inner"
            />
          </div>

          <button
            type="button"
            onClick={handleDescriptionClick}
            className="flex w-full items-center justify-center gap-3 rounded-3xl bg-card-background backdrop-blur-xl px-6 py-4 text-foreground text-base transition-all hover:bg-white/15 font-semibold shadow-xl cursor-pointer"
          >
            <Edit className="h-5 w-5" />
            <span>Edit Description</span>
          </button>

          <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Tickets
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {tickets === "free" ? "Free" : `$${ticketPrice}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTickets("free")}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    tickets === "free"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                      : "bg-card-background text-muted-foreground hover:bg-white/15"
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setTickets("paid")}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    tickets === "paid"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                      : "bg-card-background text-muted-foreground hover:bg-white/15"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>
            {tickets === "paid" && (
              <input
                type="number"
                min={1}
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40 shadow-inner"
                placeholder="Enter ticket price"
              />
            )}
            <div className="flex items-center justify-between pt-5 border-t border-foreground/10">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Require Approval
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Attendees must be approved
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequireApproval((prev) => !prev)}
                className={`h-7 w-14 rounded-full transition-all shadow-inner ${
                  requireApproval
                    ? "bg-primary shadow-lg shadow-primary/30"
                    : "bg-card-background"
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full transition-all shadow-lg ${
                    requireApproval
                      ? "translate-x-7 bg-primary-foreground"
                      : "translate-x-0.5 bg-foreground"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between pt-5 border-t border-foreground/10">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Capacity
                </p>
                <p className="text-sm text-muted-foreground mt-1">{capacity}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCapacityModalOpen(true)}
                className="rounded-full p-2 transition-all hover:bg-card-background"
                aria-label="Edit capacity settings"
              >
                <Edit className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-full bg-primary py-5 text-center text-lg font-bold text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/50 hover:scale-[1.02] shadow-xl shadow-primary/30 hover:bg-primary/90"
          >
            Create Event
          </button>
        </section>
      </div>

      {isCropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-card-background backdrop-blur-2xl p-8 text-foreground shadow-2xl">
            <h2 className="mb-6 text-3xl font-bold">Crop Image</h2>

            <div className="relative h-[500px] w-full rounded-2xl bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
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
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="flex-1 rounded-full bg-card-background backdrop-blur-md py-4 text-center font-semibold text-foreground transition-all hover:bg-white/15 shadow-lg hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  className="flex-1 rounded-full bg-primary py-4 text-center font-bold text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 shadow-xl"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EventDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
      />

      <CapacityModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
      />
    </div>
  );
}

export default function EventCreationPage() {
  return (
    <EventCreationProvider>
      <EventCreationForm />
    </EventCreationProvider>
  );
}
