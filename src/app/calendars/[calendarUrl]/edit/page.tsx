"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { calendarService } from "@/services/calendar.service";
import { imageService } from "@/services/image.service";
import { highlightService } from "@/services/highlight.service";
import { useAuth } from "@/lib/auth/authContext";
import { Calendar, CalendarType, CalendarRole } from "@/types/calendar";
import { HighlightResponseDto } from "@/types/highlight";
import {
 ArrowLeft,
 Upload,
 Loader2,
 Image as ImageIcon,
 X,
 Trash2,
 Edit3,
 Clock,
 Sparkles,
 Plus,
 Camera,
 Calendar as CalendarIcon,
 Globe,
 Eye,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { AddHighlightModal, HighlightViewer } from "@/components/highlights";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useImageCropper } from "@/components/event-form/hooks/useImageCropper";
import ImageCropModal from "@/components/event-form/ImageCropModal";

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
 const [calendarBannerImageUrl, setCalendarBannerImageUrl] = useState("");
 const [calendarColor, setCalendarColor] = useState("#6366f1");
 const [calendarType, setCalendarType] = useState<CalendarType>(CalendarType.PERSONAL);
 const [isPublic, setIsPublic] = useState(true);
 const [showSubscriberCount, setShowSubscriberCount] = useState(true);
 const [autoDeletePastEventsAfterDays, setAutoDeletePastEventsAfterDays] = useState<number | null>(null);

 // UI state
 const [loading, setLoading] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [uploadingImage, setUploadingImage] = useState(false);
 const [canEdit, setCanEdit] = useState(false);

 // Banner image cropper
 const bannerCropper = useImageCropper({
  aspect: 4,
  onCropComplete: (imageUrl) => {
   setCalendarBannerImageUrl(imageUrl);
  },
 });

 // Highlights state
 const [highlights, setHighlights] = useState<HighlightResponseDto[]>([]);
 const [loadingHighlights, setLoadingHighlights] = useState(false);
 const [showAddHighlightModal, setShowAddHighlightModal] = useState(false);
 const [showHighlightViewer, setShowHighlightViewer] = useState(false);
 const [selectedHighlightIndex, setSelectedHighlightIndex] = useState(0);
 const [highlightToDelete, setHighlightToDelete] = useState<HighlightResponseDto | null>(null);
 const [deletingHighlight, setDeletingHighlight] = useState(false);
 const [editingCaption, setEditingCaption] = useState<string | null>(null);
 const [captionValue, setCaptionValue] = useState("");
 const [savingCaption, setSavingCaption] = useState(false);

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
    setCalendarBannerImageUrl(cal.calendarBannerImageUrl || "");
    setCalendarColor(cal.calendarColor || "#6366f1");
    setCalendarType(cal.calendarType);
    setIsPublic(cal.isPublic);
    setShowSubscriberCount(cal.showSubscriberCount ?? true);
    setAutoDeletePastEventsAfterDays(cal.autoDeletePastEventsAfterDays ?? null);

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

 // Fetch highlights when calendar is loaded
 useEffect(() => {
  const fetchHighlights = async () => {
   if (!calendar?.ownerEventUserId) return;

   try {
    setLoadingHighlights(true);
    const response = await highlightService.getUserHighlights(
     calendar.ownerEventUserId,
     { calendarId: calendar.id }
    );
        console.log("console", JSON.stringify(response))
    setHighlights(response.highlights);
   } catch (err) {
    console.error("Failed to fetch highlights:", err);
   } finally {
    setLoadingHighlights(false);
   }
  };

  fetchHighlights();
 }, [calendar?.id, calendar?.ownerEventUserId]);

 // Refresh highlights
 const refreshHighlights = async () => {
  if (!calendar?.ownerEventUserId) return;

  try {
   const response = await highlightService.getUserHighlights(
    calendar.ownerEventUserId,
    { calendarId: calendar.id }
   );
      console.log("console", JSON.stringify(response))
   setHighlights(response.highlights);
  } catch (err) {
   console.error("Failed to refresh highlights:", err);
  }
 };

 // Delete highlight
 const handleDeleteHighlight = async () => {
  if (!highlightToDelete) return;

  try {
   setDeletingHighlight(true);
   await highlightService.deleteHighlight(highlightToDelete.id);
   toast.success("Highlight deleted");
   setHighlights((prev) => prev.filter((h) => h.id !== highlightToDelete.id));
   setHighlightToDelete(null);
  } catch (error: any) {
   console.error("Failed to delete highlight:", error);
   toast.error(error.response?.data?.message || "Failed to delete highlight");
  } finally {
   setDeletingHighlight(false);
  }
 };

 // Update highlight caption
 const handleSaveCaption = async (highlightId: string) => {
  try {
   setSavingCaption(true);
   await highlightService.updateHighlight(highlightId, {
    caption: captionValue.trim() || undefined,
   });
   toast.success("Caption updated");
   setHighlights((prev) =>
    prev.map((h) =>
     h.id === highlightId ? { ...h, caption: captionValue.trim() || undefined } : h
    )
   );
   setEditingCaption(null);
   setCaptionValue("");
  } catch (error: any) {
   console.error("Failed to update caption:", error);
   toast.error(error.response?.data?.message || "Failed to update caption");
  } finally {
   setSavingCaption(false);
  }
 };

 // Get time remaining for highlight
 const getTimeRemaining = (expiresAt: string) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) return "Expired";

  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);

  if (hours < 1) return `${mins}m remaining`;
  if (hours < 24) return `${hours}h ${mins}m remaining`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
 };

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
    calendarBannerImageUrl: calendarBannerImageUrl || undefined,
    calendarColor,
    calendarType,
    isPublic,
    showSubscriberCount,
    autoDeletePastEventsAfterDays,
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
   <div className="flex min-h-screen items-center justify-center ">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
   </div>
  );
 }

 // If not authenticated or can't edit, return null
 if (!isAuthenticated || !canEdit) {
  return null;
 }

 return (
  <div className="min-h-screen ">
   <div className="mx-auto max-w-2xl px-3 md:px-6 pb-16 pt-6">
    {/* Back Button */}
    <button
     onClick={() => router.push(`/calendars/${calendarUrl}`)}
     className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
     <ArrowLeft className="h-4 w-4" />
     Back to Calendar
    </button>

    {/* Header */}
    <div className="mb-5">
     <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
      Edit Calendar
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      Update your calendar details
     </p>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-3">
     {/* Banner & Calendar Image Preview */}
     <div>
      <div className="relative -mx-6 sm:mx-0">
       {/* Banner Image */}
       <button
        type="button"
        onClick={calendarBannerImageUrl ? undefined : bannerCropper.triggerFileInput}
        className="relative aspect-[4/1] w-full overflow-hidden sm:rounded-2xl group"
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
         <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-white/20 sm:rounded-2xl hover:border-white/30 transition-colors">
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
         htmlFor="image-upload-edit"
         className="relative block h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-xl border-2 border-[var(--background)] shadow-lg cursor-pointer group"
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
          id="image-upload-edit"
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
        value={newCalendarUrl}
        onChange={(e) => setNewCalendarUrl(e.target.value.toLowerCase())}
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

     {/* Color Picker - hidden for now */}
     {/* <div>
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
     </div> */}

     {/* Settings */}
     <div className="mt-6">
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
       onClick={() => router.push(`/calendars/${calendarUrl}`)}
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
         Saving...
        </>
       ) : (
        "Save Changes"
       )}
      </button>
     </div>
    </form>

    {/* Highlights Management Section */}
    <div className="mt-12 border-t border-white/10 pt-8">
     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 shrink-0">
        <Sparkles className="h-5 w-5 text-white" />
       </div>
       <div>
        <h2 className="text-xl font-semibold text-foreground">Highlights</h2>
        <p className="text-sm text-muted-foreground">
         Stories-style content that appears on your calendar page
        </p>
       </div>
      </div>
      <button
       onClick={() => setShowAddHighlightModal(true)}
       className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 shrink-0"
      >
       <Plus className="h-4 w-4" />
       Add Highlight
      </button>
     </div>

          {loadingHighlights ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : highlights.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-card-background p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-orange-500/20">
                <Sparkles className="h-8 w-8 text-pink-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">No highlights yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create highlights to share temporary content with your subscribers
              </p>
              <button
                onClick={() => setShowAddHighlightModal(true)}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Create First Highlight
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((highlight, index) => {
                const firstMedia = highlight.mediaItems[0];
                const thumbnailUrl =
                  firstMedia?.type === "video"
                    ? firstMedia?.thumbnailUrl
                    : firstMedia?.url;
                const isEditingThis = editingCaption === highlight.id;

                return (
                  <div
                    key={highlight.id}
                    className="rounded-xl border border-white/10 bg-card-background overflow-hidden group"
                  >
                    {/* Thumbnail */}
                    <button
                      onClick={() => {
                        setSelectedHighlightIndex(index);
                        setShowHighlightViewer(true);
                      }}
                      className="relative aspect-video w-full overflow-hidden"
                    >
                      {firstMedia?.type === "video" && !thumbnailUrl ? (
                        <video
                          src={firstMedia.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt=""
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-card-secondary-background">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

           {/* Media count badge */}
           {highlight.mediaItems.length > 1 && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
             <ImageIcon className="h-3 w-3" />
             {highlight.mediaItems.length}
            </div>
           )}

           {/* Play overlay for video */}
           {highlight.mediaType === "video" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
              <div className="ml-1 h-0 w-0 border-b-8 border-l-12 border-t-8 border-solid border-b-transparent border-l-black border-t-transparent" />
             </div>
            </div>
           )}
          </button>

          {/* Info */}
          <div className="p-4">
           {/* Expiration */}
           <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Clock className="h-3.5 w-3.5" />
            {getTimeRemaining(highlight.expiresAt)}
           </div>

           {/* Caption */}
           {isEditingThis ? (
            <div className="space-y-2">
             <textarea
              value={captionValue}
              onChange={(e) => setCaptionValue(e.target.value.slice(0, 500))}
              placeholder="Add a caption..."
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-card-secondary-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
             />
             <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
               {captionValue.length}/500
              </span>
              <div className="flex gap-2">
               <button
                onClick={() => {
                 setEditingCaption(null);
                 setCaptionValue("");
                }}
                className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
               >
                Cancel
               </button>
               <button
                onClick={() => handleSaveCaption(highlight.id)}
                disabled={savingCaption}
                className="px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
               >
                {savingCaption ? "Saving..." : "Save"}
               </button>
              </div>
             </div>
            </div>
           ) : (
            <p className="text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
             {highlight.caption || (
              <span className="text-muted-foreground italic">No caption</span>
             )}
            </p>
           )}

           {/* Actions */}
           {!isEditingThis && (
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/5">
             <button
              onClick={() => {
               setEditingCaption(highlight.id);
               setCaptionValue(highlight.caption || "");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-white/5"
             >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Caption
             </button>
             <button
              onClick={() => setHighlightToDelete(highlight)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 transition-colors rounded-md hover:bg-red-500/10"
             >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
             </button>
            </div>
           )}
          </div>
         </div>
        );
       })}
      </div>
     )}
    </div>
   </div>

   {/* Add Highlight Modal */}
   <AddHighlightModal
    isOpen={showAddHighlightModal}
    onClose={() => setShowAddHighlightModal(false)}
    onSuccess={refreshHighlights}
    calendarId={calendar?.id}
   />

   {/* Highlight Viewer */}
   {showHighlightViewer && highlights.length > 0 && (
    <HighlightViewer
     highlights={highlights}
     initialHighlightIndex={selectedHighlightIndex}
     onClose={() => setShowHighlightViewer(false)}
    />
   )}

   {/* Delete Confirmation Modal */}
   <ConfirmModal
    isOpen={!!highlightToDelete}
    onClose={() => setHighlightToDelete(null)}
    onConfirm={handleDeleteHighlight}
    title="Delete Highlight"
    message="Are you sure you want to delete this highlight? This action cannot be undone."
    confirmText="Delete"
    cancelText="Cancel"
    isLoading={deletingHighlight}
    variant="danger"
   />
  </div>
 );
}
