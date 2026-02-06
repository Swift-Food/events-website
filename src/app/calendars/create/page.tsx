"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calendarService } from "@/services/calendar.service";
import { imageService } from "@/services/image.service";
import { useAuth } from "@/lib/auth/authContext";
import { CalendarType } from "@/types/calendar";
import {
 ArrowLeft,
 Upload,
 Loader2,
 Image as ImageIcon,
 X,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useImageCropper } from "@/components/event-form/hooks/useImageCropper";
import ImageCropModal from "@/components/event-form/ImageCropModal";

export default function CreateCalendarPage() {
 const router = useRouter();
 const { isAuthenticated, user, isLoading: authLoading } = useAuth();

 // Form state
 const [name, setName] = useState("");
 const [description, setDescription] = useState("");
 const [calendarUrl, setCalendarUrl] = useState("");
 const [calendarImage, setCalendarImage] = useState("");
 const [calendarBannerImageUrl, setCalendarBannerImageUrl] = useState("");
 const [calendarColor, setCalendarColor] = useState("#6366f1");
 const [calendarType, setCalendarType] = useState<CalendarType>(CalendarType.PERSONAL);
 const [isPublic, setIsPublic] = useState(true);
 const [showSubscriberCount, setShowSubscriberCount] = useState(true);
 const [autoDeletePastEventsAfterDays, setAutoDeletePastEventsAfterDays] = useState<number | null>(null);

 // UI state
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [uploadingImage, setUploadingImage] = useState(false);
 const [autoGenerateUrl, setAutoGenerateUrl] = useState(true);

 // Banner image cropper
 const bannerCropper = useImageCropper({
  aspect: 4,
  onCropComplete: (imageUrl) => {
   setCalendarBannerImageUrl(imageUrl);
  },
 });

 // Preset colors
 const presetColors = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#ef4444", // Red
 ];

 // Redirect to auth if not authenticated
 useEffect(() => {
  if (!authLoading && !isAuthenticated) {
   router.push("/auth?redirect=/calendars/create");
  }
 }, [isAuthenticated, authLoading, router]);

 // Auto-generate URL slug from name
 useEffect(() => {
  if (autoGenerateUrl && name) {
   const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
   setCalendarUrl(slug);
  }
 }, [name, autoGenerateUrl]);

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
   toast.error("Please upload an image file");
   return;
  }

  // Validate file size (max 5MB)
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
  if (!calendarUrl.trim()) {
   toast.error("Calendar URL is required");
   return false;
  }
  if (calendarUrl.length < 3 || calendarUrl.length > 100) {
   toast.error("Calendar URL must be 3-100 characters");
   return false;
  }
  // Validate URL format (alphanumeric, hyphens only)
  if (!/^[a-z0-9-]+$/.test(calendarUrl)) {
   toast.error("Calendar URL can only contain lowercase letters, numbers, and hyphens");
   return false;
  }
  return true;
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;
  if (!user?.eventUser?.id) {
   toast.error("User information not found");
   return;
  }

  try {
   setIsSubmitting(true);

   const calendar = await calendarService.createCalendar({
    name,
    description: description || undefined,
    calendarUrl,
    calendarImage: calendarImage || undefined,
    calendarBannerImageUrl: calendarBannerImageUrl || undefined,
    calendarColor,
    calendarType,
    isPublic,
    showSubscriberCount,
    ownerEventUserId: user.eventUser.id,
    autoDeletePastEventsAfterDays,
   });

   toast.success("Calendar created successfully!");
   router.push(`/calendars/${calendar.calendarUrl}`);
  } catch (error: any) {
   console.error("Failed to create calendar:", error);
   toast.error(error.response?.data?.message || "Failed to create calendar");
  } finally {
   setIsSubmitting(false);
  }
 };

 // Show loading spinner while auth is loading
 if (authLoading) {
  return (
   <div className="flex min-h-screen items-center justify-center ">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
   </div>
  );
 }

 // If not authenticated, return null (will redirect)
 if (!isAuthenticated) {
  return null;
 }

 return (
  <div className="min-h-screen ">
   <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
    {/* Back Button */}
    <button
     onClick={() => router.push("/calendars/me")}
     className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
    >
     <ArrowLeft className="h-5 w-5" />
     Back to My Calendars
    </button>

    {/* Header */}
    <div className="mb-8">
     <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
      Create Calendar
     </h1>
     <p className="mt-2 text-md text-muted-foreground">
      Create a new calendar to organize and share events
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
        value={calendarUrl}
        onChange={(e) => {
         setCalendarUrl(e.target.value.toLowerCase());
         setAutoGenerateUrl(false);
        }}
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

     {/* Banner Image Upload */}
     <div>
      <label className="block text-sm font-medium text-foreground mb-2">
       Banner Image
      </label>
      <p className="text-xs text-muted-foreground mb-2">
       Wide image displayed at the top of your calendar page (4:1 ratio)
      </p>
      {calendarBannerImageUrl ? (
       <div className="relative aspect-[4/1] w-full overflow-hidden rounded-lg border border-white/10">
        <Image
         src={calendarBannerImageUrl}
         alt="Banner preview"
         fill
         className="object-cover"
        />
        <button
         type="button"
         onClick={() => setCalendarBannerImageUrl("")}
         className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
         <X className="h-4 w-4" />
        </button>
       </div>
      ) : (
       <button
        type="button"
        onClick={bannerCropper.triggerFileInput}
        className="flex aspect-[4/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-card-background transition-colors hover:border-white/20"
       >
        <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
         Click to upload banner image
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
         Max 5MB
        </p>
       </button>
      )}
      <input
       ref={bannerCropper.fileInputRef}
       type="file"
       accept="image/*"
       onChange={bannerCropper.handleImageSelect}
       className="hidden"
      />
     </div>

     {/* Banner Image Crop Modal */}
     <ImageCropModal
      isOpen={bannerCropper.isCropModalOpen}
      imageToCrop={bannerCropper.imageToCrop}
      crop={bannerCropper.crop}
      zoom={bannerCropper.zoom}
      isUploading={bannerCropper.isUploading}
      aspect={bannerCropper.aspect}
      onCropChange={bannerCropper.setCrop}
      onZoomChange={bannerCropper.setZoom}
      onCropComplete={bannerCropper.onCropAreaComplete}
      onSave={bannerCropper.handleSave}
      onCancel={bannerCropper.handleCancel}
     />

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

     {/* Show Subscriber Count Toggle */}
     <div className="flex items-center justify-between rounded-lg border border-white/10 bg-card-background p-4">
      <div>
       <p className="font-medium text-foreground">Show Subscriber Count</p>
       <p className="text-sm text-muted-foreground">
        Display the number of subscribers on your calendar
       </p>
      </div>
      <button
       type="button"
       onClick={() => setShowSubscriberCount(!showSubscriberCount)}
       className={`relative h-6 w-11 rounded-full transition-colors ${
        showSubscriberCount ? "bg-primary" : "bg-white/10"
       }`}
      >
       <div
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
         showSubscriberCount ? "translate-x-5" : "translate-x-0.5"
        }`}
       />
      </button>
     </div>

     {/* Auto-delete past events */}
     <div>
      <label htmlFor="autoDelete" className="block text-sm font-medium text-foreground mb-2">
       Auto-delete Past Events
      </label>
      <select
       id="autoDelete"
       value={autoDeletePastEventsAfterDays === null ? "never" : autoDeletePastEventsAfterDays.toString()}
       onChange={(e) => setAutoDeletePastEventsAfterDays(
        e.target.value === "never" ? null : parseInt(e.target.value)
       )}
       className="w-full rounded-lg border border-white/10 bg-card-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
       <option value="never">Never (keep all past events)</option>
       <option value="0">Immediately after event ends</option>
       <option value="1">1 day after event ends</option>
       <option value="7">7 days after event ends</option>
       <option value="30">30 days after event ends</option>
      </select>
      <p className="mt-1 text-xs text-muted-foreground">
       Automatically remove events from this calendar after they end
      </p>
     </div>

     {/* Submit Button */}
     <div className="flex gap-3 pt-4">
      <button
       type="button"
       onClick={() => router.push("/calendars/me")}
       className="flex-1 rounded-lg border border-white/10 bg-card-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-white/5"
      >
       Cancel
      </button>
      <button
       type="submit"
       disabled={isSubmitting || uploadingImage || bannerCropper.isUploading}
       className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
       {isSubmitting ? (
        <>
         <Loader2 className="h-5 w-5 animate-spin" />
         Creating...
        </>
       ) : (
        "Create Calendar"
       )}
      </button>
     </div>
    </form>
   </div>
  </div>
 );
}
