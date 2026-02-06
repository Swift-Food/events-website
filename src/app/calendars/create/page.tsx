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
 X,
 Camera,
 Calendar as CalendarIcon,
 Globe,
 Eye,
 Trash2,
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
   <div className="mx-auto max-w-2xl px-3 md:px-6 pb-16 pt-6">
    {/* Back Button */}
    <button
     onClick={() => router.push("/calendars/me")}
     className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
     <ArrowLeft className="h-4 w-4" />
     Back to My Calendars
    </button>

    {/* Header */}
    <div className="mb-5">
     <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
      Create Calendar
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      Create a new calendar to organize and share events
     </p>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-3">
     {/* Banner & Calendar Image Preview */}
     <div>
      <div className="relative">
       {/* Banner Image */}
       <button
        type="button"
        onClick={calendarBannerImageUrl ? undefined : bannerCropper.triggerFileInput}
        className="relative aspect-[4/1] w-full overflow-hidden rounded-2xl group"
        style={{ backgroundColor: calendarColor || "#6366f1" }}
       >
        {calendarBannerImageUrl ? (
         <>
          <Image
           src={calendarBannerImageUrl}
           alt="Banner preview"
           fill
           className="object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
           <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <span
             onClick={(e) => { e.stopPropagation(); bannerCropper.triggerFileInput(); }}
             className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80 cursor-pointer"
            >
             <Camera className="h-4 w-4" />
            </span>
            <span
             onClick={(e) => { e.stopPropagation(); setCalendarBannerImageUrl(""); }}
             className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-red-500/80 cursor-pointer"
            >
             <X className="h-4 w-4" />
            </span>
           </div>
          </div>
         </>
        ) : (
         <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl hover:border-white/30 transition-colors">
          {bannerCropper.isUploading ? (
           <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          ) : (
           <>
            <Camera className="h-5 w-5 text-white/40 mb-1" />
            <p className="text-xs text-white/40">Upload banner</p>
           </>
          )}
         </div>
        )}
       </button>
       <input
        ref={bannerCropper.fileInputRef}
        type="file"
        accept="image/*"
        onChange={bannerCropper.handleImageSelect}
        className="hidden"
       />

       {/* Calendar Profile Image - overlapping banner */}
       <div className="absolute -bottom-10 left-4 sm:left-6">
        <label
         htmlFor="image-upload-create"
         className="relative block h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-xl border-4 border-[var(--background)] shadow-lg cursor-pointer group"
        >
         {calendarImage ? (
          <>
           <Image
            src={calendarImage}
            alt="Calendar preview"
            fill
            className="object-cover"
           />
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
             <span className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm">
              <Camera className="h-3.5 w-3.5" />
             </span>
             <span
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCalendarImage(""); }}
              className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm hover:bg-red-500/80 cursor-pointer"
             >
              <X className="h-3.5 w-3.5" />
             </span>
            </div>
           </div>
          </>
         ) : (
          <div
           className="flex h-full w-full flex-col items-center justify-center bg-card-secondary-background group-hover:bg-card-background transition-colors"
           style={{ backgroundColor: calendarColor || "#6366f1" }}
          >
           {uploadingImage ? (
            <Loader2 className="h-6 w-6 animate-spin text-white/50" />
           ) : (
            <>
             <CalendarIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white/30" />
             <Camera className="h-3.5 w-3.5 text-white/40 mt-1" />
            </>
           )}
          </div>
         )}
         <input
          type="file"
          id="image-upload-create"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={uploadingImage}
         />
        </label>
       </div>
      </div>
      {/* Spacer for overlapping profile image */}
      <div className="h-12" />
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

     {/* Name */}
     <div className="space-y-1">
      <input
       type="text"
       id="name"
       value={name}
       onChange={(e) => setName(e.target.value.slice(0, 255))}
       placeholder="Calendar Name"
       maxLength={255}
       className="w-full bg-transparent text-xl md:text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
       required
      />
      <p className={`text-xs ${name.length >= 255 ? "text-amber-400" : "text-muted-foreground"}`}>
       {name.length}/255 characters
      </p>
     </div>

     {/* Description */}
     <div>
      <label htmlFor="description" className="block text-xs font-medium text-muted-foreground mb-1">
       Description
      </label>
      <textarea
       id="description"
       value={description}
       onChange={(e) => setDescription(e.target.value)}
       placeholder="Describe your calendar..."
       rows={4}
       className="w-full rounded-xl bg-card-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
      />
     </div>

     {/* Calendar URL */}
     <div>
      <label htmlFor="calendarUrl" className="block text-xs font-medium text-muted-foreground mb-1">
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
        className="flex-1 rounded-xl bg-card-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        required
       />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
       3-100 characters, lowercase letters, numbers, and hyphens only
      </p>
     </div>

     {/* Color Picker */}
     <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
       Calendar Color
      </label>
      <div className="flex flex-wrap gap-2">
       {presetColors.map((color) => (
        <button
         key={color}
         type="button"
         onClick={() => setCalendarColor(color)}
         className={`h-8 w-8 rounded-lg transition-all ${
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
        className="h-8 w-8 cursor-pointer rounded-lg"
        title="Custom color"
       />
      </div>
     </div>

     {/* Settings */}
     <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
       Settings
      </label>
      <div className="rounded-xl bg-card-background backdrop-blur-xl px-4 py-1">
       {/* Public Calendar */}
       <div className="flex items-center gap-2.5">
        <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 flex items-center justify-between py-2 border-b border-foreground/10 -mr-4 pr-4">
         <p className="text-sm font-medium text-foreground">Public Calendar</p>
         <button
          type="button"
          onClick={() => setIsPublic(!isPublic)}
          className={`h-5 w-8 rounded-full transition-all ${
           isPublic ? "bg-primary" : "bg-card-secondary-background"
          }`}
         >
          <span
           className={`block h-4 w-4 rounded-full transition-all ${
            isPublic ? "translate-x-3.5 bg-primary-foreground" : "translate-x-0.5 bg-foreground"
           }`}
          />
         </button>
        </div>
       </div>

       {/* Show Subscriber Count */}
       <div className="flex items-center gap-2.5">
        <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 flex items-center justify-between py-2 border-b border-foreground/10 -mr-4 pr-4">
         <p className="text-sm font-medium text-foreground">Show Subscriber Count</p>
         <button
          type="button"
          onClick={() => setShowSubscriberCount(!showSubscriberCount)}
          className={`h-5 w-8 rounded-full transition-all ${
           showSubscriberCount ? "bg-primary" : "bg-card-secondary-background"
          }`}
         >
          <span
           className={`block h-4 w-4 rounded-full transition-all ${
            showSubscriberCount ? "translate-x-3.5 bg-primary-foreground" : "translate-x-0.5 bg-foreground"
           }`}
          />
         </button>
        </div>
       </div>

       {/* Auto-delete past events */}
       <div className="flex items-center gap-2.5">
        <Trash2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 flex items-center justify-between py-2">
         <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Auto-delete Past Events</p>
          <p className="text-xs text-muted-foreground">Remove events after they end</p>
         </div>
         <select
          id="autoDelete"
          value={autoDeletePastEventsAfterDays === null ? "never" : autoDeletePastEventsAfterDays.toString()}
          onChange={(e) => setAutoDeletePastEventsAfterDays(
           e.target.value === "never" ? null : parseInt(e.target.value)
          )}
          className="bg-transparent text-sm text-muted-foreground focus:outline-none cursor-pointer shrink-0"
         >
          <option value="never">Never</option>
          <option value="0">Immediately</option>
          <option value="1">After 1 day</option>
          <option value="7">After 7 days</option>
          <option value="30">After 30 days</option>
         </select>
        </div>
       </div>
      </div>
     </div>

     {/* Submit Button */}
     <div className="flex gap-2 pt-2">
      <button
       type="button"
       onClick={() => router.push("/calendars/me")}
       className="flex-1 rounded-lg border border-white/10 bg-card-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
      >
       Cancel
      </button>
      <button
       type="submit"
       disabled={isSubmitting || uploadingImage || bannerCropper.isUploading}
       className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
       {isSubmitting ? (
        <>
         <Loader2 className="h-4 w-4 animate-spin" />
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
