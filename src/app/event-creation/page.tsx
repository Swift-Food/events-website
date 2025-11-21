/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Edit, Trash2 } from "lucide-react";
import EventDescriptionModal from "@/components/event-edit/EventDescriptionModal";
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
    persistEventDraft,
  } = useEventCreation();

  // Local state for UI only
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
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

  useEffect(() => {
    const interval = setInterval(() => {
      persistEventDraft();
    }, 10000);
    return () => clearInterval(interval);
  }, [persistEventDraft]);

  const handleBlurSave = useCallback(() => {
    persistEventDraft();
  }, [persistEventDraft]);

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
      <div className="flex w-full max-w-5xl flex-col gap-8 rounded-3xl bg-[#2a2a2d] p-8 text-white shadow-2xl lg:flex-row">
        <section className="flex flex-col gap-4 rounded-2xl bg-[#1f1f21] p-6 lg:w-80 lg:shrink-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Event cover"
                className="h-full w-full object-cover"
                onBlur={handleBlurSave}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#f9f8f6] text-black">
                <span className="text-3xl font-serif">You Are Invited</span>
                <span className="text-sm text-black/60">
                  Upload a cover image
                </span>
              </div>
            )}
            <div className="absolute bottom-4 right-4 flex flex-wrap gap-3">
              <label
                htmlFor="cover-upload"
                className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black shadow-lg transition hover:bg-white"
              >
                Change cover
              </label>
              {coverPreview && (
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-black"
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
          <div className="rounded-2xl border border-white/10 bg-[#131315] p-4 text-sm">
            <div className="flex items-center justify-between text-white/70">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Starts
                </p>
                <p className="text-base text-white">{formattedStart}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Ends
                </p>
                <p className="text-base text-white">{formattedEnd}</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-white/60">
              Cover: <span className="text-white">{coverName}</span>
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
                className="w-full bg-transparent text-4xl font-semibold text-white outline-none placeholder:text-white/30"
              />
            </div>
            <button
              type="button"
              onClick={handleClearForm}
              className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 transition hover:bg-red-500/20 hover:border-red-500/50"
              title="Clear entire form"
            >
              <Trash2 className="h-5 w-5" />
              <span className="hidden sm:inline">Clear Form</span>
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center py-3">
                <div className="h-3 w-3 rounded-full bg-white"></div>
                <div
                  className="my-2 w-px flex-1"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 2px, transparent 2px, transparent 6px)",
                  }}
                ></div>
                <div className="h-3 w-3 rounded-full border-2 border-white/50"></div>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-white/50 w-12">Start</label>
                  <input
                    type="date"
                    value={start.split("T")[0]}
                    onChange={(e) =>
                      setStart(e.target.value + "T" + start.split("T")[1])
                    }
                    className="flex-1 rounded-xl bg-[#3a3a3d] px-4 py-3 text-white outline-none"
                    onBlur={handleBlurSave}
                  />
                  <input
                    type="time"
                    value={start.split("T")[1]}
                    onChange={(e) =>
                      setStart(start.split("T")[0] + "T" + e.target.value)
                    }
                    className="w-32 rounded-xl bg-[#3a3a3d] px-4 py-3 text-white outline-none"
                    onBlur={handleBlurSave}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-white/50 w-12">End</label>
                  <input
                    type="date"
                    value={end.split("T")[0]}
                    onChange={(e) =>
                      setEnd(e.target.value + "T" + end.split("T")[1])
                    }
                    className="flex-1 rounded-xl bg-[#3a3a3d] px-4 py-3 text-white outline-none"
                    onBlur={handleBlurSave}
                  />
                  <input
                    type="time"
                    value={end.split("T")[1]}
                    onChange={(e) =>
                      setEnd(end.split("T")[0] + "T" + e.target.value)
                    }
                    className="w-32 rounded-xl bg-[#3a3a3d] px-4 py-3 text-white outline-none"
                    onBlur={handleBlurSave}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4">
            <label className="text-md text-white font-semibold">
              Add Event Location
            </label>
            <input
              type="text"
              placeholder="Offline location or virtual link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
              onBlur={handleBlurSave}
            />
          </div>

          <button
            type="button"
            onClick={handleDescriptionClick}
            className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-[#1f1f21] px-4 py-3 text-white text-md transition hover:bg-[#25252a] font-semibold"
          >
            <Edit className="h-5 w-5" />
            <span>Edit Description</span>
          </button>

          <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tickets</p>
                <p className="text-xs text-white/50">
                  {tickets === "free" ? "Free" : `$${ticketPrice}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTickets("free")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    tickets === "free"
                      ? "bg-white text-black"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setTickets("paid")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    tickets === "paid"
                      ? "bg-white text-black"
                      : "bg-white/10 text-white/70"
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
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
                placeholder="Ticket price"
                onBlur={handleBlurSave}
              />
            )}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium">Require approval</p>
                <p className="text-xs text-white/50">
                  Attendees must be approved
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequireApproval((prev) => !prev)}
                className={`h-6 w-12 rounded-full border border-transparent transition ${
                  requireApproval ? "bg-white" : "bg-white/10"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-black transition ${
                    requireApproval ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium">Capacity</p>
                <p className="text-xs text-white/50">{capacity}</p>
              </div>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-40 rounded-xl bg-white/5 px-3 py-2 text-right text-white outline-none"
                onBlur={handleBlurSave}
              />
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-full bg-white py-4 text-center text-base font-semibold text-black transition hover:bg-white/80"
          >
            Create Event
          </button>
        </section>
      </div>

      {isCropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-[#2a2a2d] p-6 text-white">
            <h2 className="mb-4 text-2xl font-semibold">Crop Image</h2>

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

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm text-white/70">Zoom</label>
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="flex-1 rounded-full bg-white/10 py-3 text-center font-medium transition hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  className="flex-1 rounded-full bg-white py-3 text-center font-semibold text-black transition hover:bg-white/80"
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
