"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { calendarService } from "@/services/calendar.service";
import { imageService } from "@/services/image.service";
import { useAuth } from "@/lib/auth/authContext";
import { Calendar, CalendarType, CalendarRole } from "@/types/calendar";
import {
  ArrowLeft,
  Upload,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function EditCalendarPage() {
  const router = useRouter();
  const params = useParams();
  const calendarUrl = params.calendarUrl as string;
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  // Form state
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newCalendarUrl, setNewCalendarUrl] = useState("");
  const [calendarImage, setCalendarImage] = useState("");
  const [calendarColor, setCalendarColor] = useState("#6366f1");
  const [calendarType, setCalendarType] = useState<CalendarType>(CalendarType.PERSONAL);
  const [isPublic, setIsPublic] = useState(true);

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  // Preset colors
  const presetColors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#06b6d4", "#f97316", "#ef4444",
  ];

  // Fetch calendar and check permissions
  useEffect(() => {
    const fetchCalendar = async () => {
      if (!isAuthenticated || authLoading) return;

      try {
        setLoading(true);
        const cal = await calendarService.getCalendarByUrl(calendarUrl);
        setCalendar(cal);

        // Pre-fill form
        setName(cal.name);
        setDescription(cal.description || "");
        setNewCalendarUrl(cal.calendarUrl);
        setCalendarImage(cal.calendarImage || "");
        setCalendarColor(cal.calendarColor || "#6366f1");
        setCalendarType(cal.calendarType);
        setIsPublic(cal.isPublic);

        // Check permissions
        const isOwner = cal.owner?.user?.id === user?.id;
        if (isOwner) {
          setCanEdit(true);
        } else {
          // Check if user is admin collaborator
          try {
            const collaborators = await calendarService.getCollaborators(cal.id);
            const userCollab = collaborators.find(
              (c) => c.inviteAccepted && c.eventUser?.id === user?.eventUser?.id
            );
            if (userCollab && userCollab.role === CalendarRole.ADMIN) {
              setCanEdit(true);
            } else {
              toast.error("You don't have permission to edit this calendar");
              router.push(`/calendars/${calendarUrl}`);
            }
          } catch (err) {
            toast.error("You don't have permission to edit this calendar");
            router.push(`/calendars/${calendarUrl}`);
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch calendar:", error);
        toast.error("Failed to load calendar");
        router.push("/calendars/me");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [isAuthenticated, authLoading, calendarUrl, user, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      const imageUrl = await imageService.uploadImage(file);
      setCalendarImage(imageUrl);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      toast.error("Calendar name is required");
      return false;
    }
    if (name.length > 255) {
      toast.error("Name must be 255 characters or less");
      return false;
    }
    if (!newCalendarUrl.trim()) {
      toast.error("Calendar URL is required");
      return false;
    }
    if (newCalendarUrl.length < 3 || newCalendarUrl.length > 100) {
      toast.error("Calendar URL must be 3-100 characters");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(newCalendarUrl)) {
      toast.error("Calendar URL can only contain lowercase letters, numbers, and hyphens");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !calendar) return;

    try {
      setIsSubmitting(true);

      await calendarService.updateCalendar(calendar.id, {
        name,
        description: description || undefined,
        calendarUrl: newCalendarUrl,
        calendarImage: calendarImage || undefined,
        calendarColor,
        calendarType,
        isPublic,
      });

      toast.success("Calendar updated successfully!");
      router.push(`/calendars/${newCalendarUrl}`);
    } catch (error: any) {
      console.error("Failed to update calendar:", error);
      toast.error(error.response?.data?.message || "Failed to update calendar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading spinner while loading
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated or can't edit, return null
  if (!isAuthenticated || !canEdit) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/calendars/${calendarUrl}`)}
          className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Calendar
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Edit Calendar
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            Update your calendar details
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Calendar Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tech Events 2025"
              maxLength={255}
              className="w-full rounded-lg border border-white/10 bg-card-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {name.length}/255 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your calendar..."
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-card-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Calendar URL */}
          <div>
            <label htmlFor="calendarUrl" className="block text-sm font-medium text-foreground mb-2">
              Calendar URL <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/calendars/</span>
              <input
                type="text"
                id="calendarUrl"
                value={newCalendarUrl}
                onChange={(e) => setNewCalendarUrl(e.target.value.toLowerCase())}
                placeholder="tech-events-2025"
                maxLength={100}
                pattern="[a-z0-9-]+"
                className="flex-1 rounded-lg border border-white/10 bg-card-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              3-100 characters, lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Calendar Image
            </label>
            {calendarImage ? (
              <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-white/10">
                <Image
                  src={calendarImage}
                  alt="Calendar preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCalendarImage("")}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="image-upload"
                className="flex aspect-video w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-card-background transition-colors hover:border-white/20"
              >
                {uploadingImage ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload image
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Max 5MB
                    </p>
                  </>
                )}
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Calendar Color
            </label>
            <div className="flex flex-wrap gap-3">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCalendarColor(color)}
                  className={`h-10 w-10 rounded-lg transition-all ${
                    calendarColor === color
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
              <input
                type="color"
                value={calendarColor}
                onChange={(e) => setCalendarColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-white/10"
                title="Custom color"
              />
            </div>
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Calendar Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCalendarType(CalendarType.PERSONAL)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  calendarType === CalendarType.PERSONAL
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-card-background text-foreground hover:border-white/20"
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => setCalendarType(CalendarType.TEAM)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  calendarType === CalendarType.TEAM
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-card-background text-foreground hover:border-white/20"
                }`}
              >
                Team
              </button>
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-card-background p-4">
            <div>
              <p className="font-medium text-foreground">Public Calendar</p>
              <p className="text-sm text-muted-foreground">
                Anyone can discover and subscribe to this calendar
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                isPublic ? "bg-primary" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  isPublic ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/calendars/${calendarUrl}`)}
              className="flex-1 rounded-lg border border-white/10 bg-card-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImage}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
