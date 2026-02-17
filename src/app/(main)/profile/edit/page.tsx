"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { eventUserService, UpdateEventUserDto } from "@/services/event-user.service";
import { imageService } from "@/services/image.service";
import { ArrowLeft, Loader2, User, Save, Instagram, Linkedin, Globe, Upload, X, Camera } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// X (Twitter) icon - not available in lucide-react
const XIcon = ({ className }: { className?: string }) => (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
 </svg>
);

// Social media URL configurations
const SOCIAL_PREFIXES = {
 instagram: "instagram.com/",
 twitter: "x.com/",
 linkedin: "linkedin.com/in/",
};

// Extract username from a social URL
function extractUsername(url: string, platform: keyof typeof SOCIAL_PREFIXES): string {
 if (!url) return "";
 const prefix = SOCIAL_PREFIXES[platform];

 // Handle various URL formats
 const patterns = [
  new RegExp(`https?://(www\\.)?${prefix.replace("/", "\\/")}(.+?)\\/?$`, "i"),
  new RegExp(`^${prefix.replace("/", "\\/")}(.+?)\\/?$`, "i"),
  new RegExp(`^@?(.+)$`), // Just a username
 ];

 for (const pattern of patterns) {
  const match = url.match(pattern);
  if (match) {
   const extracted = match[match.length - 1];
   // Don't return if it looks like a full URL that didn't match
   if (!extracted.includes("http") && !extracted.includes(".com")) {
    return extracted.replace(/^@/, ""); // Remove leading @ if present
   }
  }
 }

 return url;
}

// Build full URL from username
function buildSocialUrl(username: string, platform: keyof typeof SOCIAL_PREFIXES): string {
 if (!username) return "";
 const cleanUsername = username.replace(/^@/, "").trim();
 if (!cleanUsername) return "";
 return `https://${SOCIAL_PREFIXES[platform]}${cleanUsername}`;
}

export default function EditProfilePage() {
 const router = useRouter();
 const { user, eventUser, isAuthenticated, isLoading: authLoading, refreshProfile } = useAuth();

 const [formData, setFormData] = useState({
  firstName: "",
  lastName: "",
  username: "",
  organizationName: "",
  bio: "",
  profileBannerImageUrl: "",
  website: "",
  twitterHandle: "",
  linkedinUrl: "",
  instagramUrl: "",
  isProfilePublic: true,
  autoAcceptFollowers: true,
  // Email notification preferences
  allowEmailNotifications: true,
  allowTicketReminders: true,
  allowEventUpdateEmails: true,
  allowWaitlistEmails: true,
  allowCollaboratorEmails: true,
  notifyFollowedUserEvents: true,
 });
 const [isLoading, setIsLoading] = useState(false);
 const [isSaving, setIsSaving] = useState(false);

 // Profile picture upload state
 const [profilePicture, setProfilePicture] = useState<string>("");
 const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
 const avatarInputRef = useRef<HTMLInputElement>(null);

 // Banner upload state
 const [isDraggingBanner, setIsDraggingBanner] = useState(false);
 const [isUploadingBanner, setIsUploadingBanner] = useState(false);
 const bannerInputRef = useRef<HTMLInputElement>(null);

 // Redirect if not authenticated
 useEffect(() => {
  if (!authLoading && !isAuthenticated) {
   router.push("/auth");
  }
 }, [authLoading, isAuthenticated, router]);

 // Load existing profile data
 useEffect(() => {
  if (user && eventUser) {
   setProfilePicture(user.profilePicture || "");
   setFormData({
    firstName: eventUser.firstName || "",
    lastName: eventUser.lastName || "",
    username: user.username || "",
    organizationName: eventUser.organizationName || "",
    bio: eventUser.bio || "",
    profileBannerImageUrl: eventUser.profileBannerImageUrl || "",
    website: eventUser.website || "",
    // Extract usernames from stored URLs
    twitterHandle: extractUsername(eventUser.twitterHandle || "", "twitter"),
    linkedinUrl: extractUsername(eventUser.linkedinUrl || "", "linkedin"),
    instagramUrl: extractUsername(eventUser.instagramUrl || "", "instagram"),
    isProfilePublic: eventUser.isProfilePublic !== false,
    autoAcceptFollowers: eventUser.autoAcceptFollowers !== false,
    // Email notification preferences
    allowEmailNotifications: eventUser.allowEmailNotifications !== false,
    allowTicketReminders: eventUser.allowTicketReminders !== false,
    allowEventUpdateEmails: eventUser.allowEventUpdateEmails !== false,
    allowWaitlistEmails: eventUser.allowWaitlistEmails !== false,
    allowCollaboratorEmails: eventUser.allowCollaboratorEmails !== false,
    notifyFollowedUserEvents: eventUser.notifyFollowedUserEvents !== false,
   });
  }
 }, [user, eventUser]);

 const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
 ) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
 };

 // Profile picture upload handler
 const handleAvatarUpload = useCallback(async (file: File) => {
  if (!file.type.startsWith("image/")) {
   toast.error("Please upload an image file");
   return;
  }
  if (file.size > 5 * 1024 * 1024) {
   toast.error("Image must be less than 5MB");
   return;
  }
  setIsUploadingAvatar(true);
  try {
   const uploadedUrl = await imageService.uploadImage(file);
   setProfilePicture(uploadedUrl);
   toast.success("Profile picture uploaded!");
  } catch (error) {
   console.error("Failed to upload profile picture:", error);
   toast.error("Failed to upload profile picture");
  } finally {
   setIsUploadingAvatar(false);
  }
 }, []);

 const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) handleAvatarUpload(file);
 };

 // Banner upload handlers
 const handleBannerUpload = useCallback(async (file: File) => {
  if (!file.type.startsWith("image/")) {
   toast.error("Please upload an image file");
   return;
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
   toast.error("Image must be less than 5MB");
   return;
  }

  setIsUploadingBanner(true);
  try {
   // TODO: Add cropping modal here before upload (see EventForm.tsx for pattern)
   // For now, upload directly - frontend dev can add crop modal later
   const uploadedUrl = await imageService.uploadImage(file);
   setFormData((prev) => ({ ...prev, profileBannerImageUrl: uploadedUrl }));
   toast.success("Banner uploaded!");
  } catch (error) {
   console.error("Failed to upload banner:", error);
   toast.error("Failed to upload banner");
  } finally {
   setIsUploadingBanner(false);
  }
 }, []);

 const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   handleBannerUpload(file);
  }
 };

 const handleBannerDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setIsDraggingBanner(false);
  const file = e.dataTransfer.files?.[0];
  if (file) {
   handleBannerUpload(file);
  }
 }, [handleBannerUpload]);

 const handleBannerDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setIsDraggingBanner(true);
 }, []);

 const handleBannerDragLeave = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setIsDraggingBanner(false);
 }, []);

 const removeBanner = () => {
  setFormData((prev) => ({ ...prev, profileBannerImageUrl: "" }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);

  try {
   // Build update payload - send all editable fields
   // Build full URLs from usernames for social fields
   const updateData: UpdateEventUserDto = {
    firstName: formData.firstName.trim() || undefined,
    lastName: formData.lastName.trim() || undefined,
    username: formData.username.trim() || undefined,
    organizationName: formData.organizationName.trim() || undefined,
    bio: formData.bio.trim() || undefined,
    profilePicture: profilePicture.trim() || null,
    profileBannerImageUrl: formData.profileBannerImageUrl.trim() || undefined,
    website: formData.website.trim() || undefined,
    twitterHandle: buildSocialUrl(formData.twitterHandle, "twitter") || undefined,
    linkedinUrl: buildSocialUrl(formData.linkedinUrl, "linkedin") || undefined,
    instagramUrl: buildSocialUrl(formData.instagramUrl, "instagram") || undefined,
    isProfilePublic: formData.isProfilePublic,
    autoAcceptFollowers: formData.autoAcceptFollowers,
    // Email notification preferences
    allowEmailNotifications: formData.allowEmailNotifications,
    allowTicketReminders: formData.allowTicketReminders,
    allowEventUpdateEmails: formData.allowEventUpdateEmails,
    allowWaitlistEmails: formData.allowWaitlistEmails,
    allowCollaboratorEmails: formData.allowCollaboratorEmails,
    notifyFollowedUserEvents: formData.notifyFollowedUserEvents,
   };

   // Remove undefined values for cleaner payload
   Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof UpdateEventUserDto] === undefined) {
     delete updateData[key as keyof UpdateEventUserDto];
    }
   });

   const result = await eventUserService.updateMyProfile(updateData);

   // Refresh user data in context
   await refreshProfile();

   toast.success("Profile updated successfully");
  } catch (error: any) {
   console.error("Failed to update profile:", error);
   toast.error(error.response?.data?.message || "Failed to update profile");
  } finally {
   setIsSaving(false);
  }
 };

 // Loading state
 if (authLoading) {
  return (
   <div className="flex min-h-[calc(100vh-64px)] items-center justify-center ">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
   </div>
  );
 }

 // Not authenticated
 if (!isAuthenticated || !user) {
  return null;
 }

 return (
  <div className="min-h-[calc(100vh-64px)] ">
   <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
    {/* Header */}
    <div className="mb-8">
     <Link
      href="/profile"
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
     >
      <ArrowLeft className="h-4 w-4" />
      Back to Profile
     </Link>
     <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
      Edit Profile
     </h1>
     <p className="text-muted-foreground mt-2">
      Update your personal information and profile details
     </p>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-6">
     {/* Avatar Section */}
     <div className="rounded-2xl bg-card-background backdrop-blur-xl p-6 space-y-6">
      <div className="flex items-center gap-5">
       <button
        type="button"
        onClick={() => avatarInputRef.current?.click()}
        disabled={isUploadingAvatar}
        className="relative h-24 w-24 rounded-full ring-4 ring-primary/20 overflow-hidden group flex-shrink-0 cursor-pointer"
       >
        {profilePicture ? (
         <img
          src={profilePicture}
          alt="Profile"
          className="h-full w-full object-cover"
         />
        ) : (
         <div className="h-full w-full bg-primary/10 flex items-center justify-center">
          <User className="h-10 w-10 text-primary/60" />
         </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1">
         {isUploadingAvatar ? (
          <Loader2 className="h-5 w-5 text-white animate-spin" />
         ) : (
          <>
           <Camera className="h-5 w-5 text-white" />
           <span className="text-[10px] font-medium text-white/90">
            {profilePicture ? "Change" : "Upload"}
           </span>
          </>
         )}
        </div>
       </button>
       <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Profile Picture</p>
        <p className="text-xs text-muted-foreground/60">
         JPG, PNG or GIF. Max 5MB.
        </p>
        <div className="flex items-center gap-2 pt-0.5">
         <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
         >
          {isUploadingAvatar ? "Uploading..." : profilePicture ? "Change photo" : "Upload photo"}
         </button>
         {profilePicture && (
          <>
           <span className="text-muted-foreground/30">|</span>
           <button
            type="button"
            onClick={() => setProfilePicture("")}
            className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
           >
            Remove
           </button>
          </>
         )}
        </div>
       </div>
       <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileChange}
        className="hidden"
       />
      </div>

      {/* Profile Banner - temporarily hidden */}
      {false && (
      <div>
       <label className="block text-sm font-medium text-foreground mb-2">
        Profile Banner
       </label>

       {formData.profileBannerImageUrl ? (
        // Banner preview with remove button
        <div className="relative rounded-xl overflow-hidden border border-white/10">
         <img
          src={formData.profileBannerImageUrl}
          alt="Profile banner"
          className="w-full h-32 object-cover"
         />
         <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
           type="button"
           onClick={() => bannerInputRef.current?.click()}
           className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-colors"
          >
           Change
          </button>
          <button
           type="button"
           onClick={removeBanner}
           className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-red-500 transition-colors"
          >
           <X className="h-4 w-4" />
          </button>
         </div>
        </div>
       ) : (
        // Upload drop zone
        <div
         onDrop={handleBannerDrop}
         onDragOver={handleBannerDragOver}
         onDragLeave={handleBannerDragLeave}
         onClick={() => bannerInputRef.current?.click()}
         className={`
          relative rounded-xl border-2 border-dashed transition-all cursor-pointer
          h-32 flex flex-col items-center justify-center gap-2
          ${isDraggingBanner
           ? "border-primary bg-primary/10"
           : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
          }
          ${isUploadingBanner ? "pointer-events-none opacity-60" : ""}
         `}
        >
         {isUploadingBanner ? (
          <>
           <Loader2 className="h-8 w-8 text-primary animate-spin" />
           <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
         ) : (
          <>
           <Upload className="h-8 w-8 text-muted-foreground" />
           <p className="text-sm text-muted-foreground">
            {isDraggingBanner ? "Drop image here" : "Click or drag image to upload"}
           </p>
           <p className="text-xs text-muted-foreground/60">
            Recommended: 1500 x 500px (3:1 ratio)
           </p>
          </>
         )}
        </div>
       )}

       <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        onChange={handleBannerFileChange}
        className="hidden"
       />

       {/* TODO: Add crop modal here - see EventForm.tsx for react-easy-crop pattern */}
      </div>
      )}
     </div>

     {/* Personal Info */}
     <div className="rounded-2xl bg-card-background backdrop-blur-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">
       Personal Information
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       <div>
        <label className="block text-sm font-medium text-foreground mb-2">
         First Name
        </label>
        <input
         type="text"
         name="firstName"
         value={formData.firstName}
         onChange={handleChange}
         placeholder="Enter your first name"
         className="w-full rounded-xl border border-white/10 bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
       </div>

       <div>
        <label className="block text-sm font-medium text-foreground mb-2">
         Last Name
        </label>
        <input
         type="text"
         name="lastName"
         value={formData.lastName}
         onChange={handleChange}
         placeholder="Enter your last name"
         className="w-full rounded-xl border border-white/10 bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
       </div>
      </div>

      <div>
       <label className="block text-sm font-medium text-foreground mb-2">
        Username
       </label>
       <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
         @
        </span>
        <input
         type="text"
         name="username"
         value={formData.username}
         onChange={handleChange}
         placeholder="username"
         className="w-full rounded-xl border border-white/10 bg-input-background pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
       </div>
       <p className="text-xs text-muted-foreground mt-1">
        This is your unique identifier on the platform
       </p>
      </div>

      <div>
       <label className="block text-sm font-medium text-foreground mb-2">
        Email
       </label>
       <input
        type="email"
        value={user.email}
        disabled
        className="w-full rounded-xl border border-white/10 bg-input-background/50 px-4 py-3 text-muted-foreground cursor-not-allowed"
       />
       <p className="text-xs text-muted-foreground mt-1">
        Email cannot be changed
       </p>
      </div>

      <div>
       <label className="block text-sm font-medium text-foreground mb-2">
        Bio
       </label>
       <textarea
        name="bio"
        value={formData.bio}
        onChange={handleChange}
        placeholder="Tell us about yourself..."
        rows={3}
        className="w-full rounded-xl border border-white/10 bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
       />
      </div>
     </div>

     {/* Organization Info */}
     <div className="rounded-2xl bg-card-background backdrop-blur-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">
       Organization Details
      </h2>

      <div>
       <label className="block text-sm font-medium text-foreground mb-2">
        Organization Name
       </label>
       <input
        type="text"
        name="organizationName"
        value={formData.organizationName}
        onChange={handleChange}
        placeholder="Your organization or company name"
        className="w-full rounded-xl border border-white/10 bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
       />
      </div>
     </div>

     {/* Social Links */}
     <div className="rounded-2xl bg-card-background backdrop-blur-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">
       Social Links
      </h2>

      <div className="space-y-4">
       {/* Instagram */}
       <div>
        <label className="block text-sm font-medium text-foreground mb-2">
         Instagram
        </label>
        <div className="flex rounded-xl border border-white/10 bg-input-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
         <span className="flex items-center gap-2 px-3 bg-white/5 text-muted-foreground text-sm border-r border-white/10 whitespace-nowrap">
          <Instagram className="h-4 w-4" />
          instagram.com/
         </span>
         <input
          type="text"
          name="instagramUrl"
          value={formData.instagramUrl}
          onChange={handleChange}
          placeholder="username"
          className="flex-1 bg-transparent px-3 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-w-0"
         />
        </div>
       </div>

       {/* X (Twitter) */}
       <div>
        <label className="block text-sm font-medium text-foreground mb-2">
         X (Twitter)
        </label>
        <div className="flex rounded-xl border border-white/10 bg-input-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
         <span className="flex items-center gap-2 px-3 bg-white/5 text-muted-foreground text-sm border-r border-white/10 whitespace-nowrap">
          <XIcon className="h-4 w-4" />
          x.com/
         </span>
         <input
          type="text"
          name="twitterHandle"
          value={formData.twitterHandle}
          onChange={handleChange}
          placeholder="username"
          className="flex-1 bg-transparent px-3 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-w-0"
         />
        </div>
       </div>

       {/* LinkedIn */}
       <div>
        <label className="block text-sm font-medium text-foreground mb-2">
         LinkedIn
        </label>
        <div className="flex rounded-xl border border-white/10 bg-input-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
         <span className="flex items-center gap-2 px-3 bg-white/5 text-muted-foreground text-sm border-r border-white/10 whitespace-nowrap">
          <Linkedin className="h-4 w-4" />
          linkedin.com/in/
         </span>
         <input
          type="text"
          name="linkedinUrl"
          value={formData.linkedinUrl}
          onChange={handleChange}
          placeholder="username"
          className="flex-1 bg-transparent px-3 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-w-0"
         />
        </div>
       </div>

       {/* Website */}
       <div>
        <label className="block text-sm font-medium text-foreground mb-2">
         Website
        </label>
        <div className="flex rounded-xl border border-white/10 bg-input-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
         <span className="flex items-center px-3 bg-white/5 text-muted-foreground border-r border-white/10">
          <Globe className="h-4 w-4" />
         </span>
         <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://yourwebsite.com"
          className="flex-1 bg-transparent px-3 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-w-0"
         />
        </div>
       </div>
      </div>
     </div>

     {/* Privacy Settings */}
     <div className="rounded-2xl bg-card-background backdrop-blur-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">
       Privacy Settings
      </h2>

      <div className="flex items-center gap-4">
       <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-foreground">
         Public Profile
        </label>
        <p className="text-xs text-muted-foreground mt-1">
         When enabled, anyone can see your full profile, events, and activity
        </p>
       </div>
       <button
        type="button"
        role="switch"
        aria-checked={formData.isProfilePublic}
        onClick={() =>
         setFormData((prev) => ({
          ...prev,
          isProfilePublic: !prev.isProfilePublic,
         }))
        }
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
         formData.isProfilePublic ? "bg-primary" : "bg-white/20"
        }`}
       >
        <span
         className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          formData.isProfilePublic ? "translate-x-6" : "translate-x-1"
         }`}
        />
       </button>
      </div>

      <div className="flex items-center gap-4">
       <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-foreground">
         Auto-Accept Followers
        </label>
        <p className="text-xs text-muted-foreground mt-1">
         When enabled, new followers are automatically accepted without requiring approval
        </p>
       </div>
       <button
        type="button"
        role="switch"
        aria-checked={formData.autoAcceptFollowers}
        onClick={() =>
         setFormData((prev) => ({
          ...prev,
          autoAcceptFollowers: !prev.autoAcceptFollowers,
         }))
        }
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
         formData.autoAcceptFollowers ? "bg-primary" : "bg-white/20"
        }`}
       >
        <span
         className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          formData.autoAcceptFollowers ? "translate-x-6" : "translate-x-1"
         }`}
        />
       </button>
      </div>
     </div>

     {/* Email Notifications */}
     <div className="rounded-2xl bg-card-background backdrop-blur-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">
       Email Notifications
      </h2>

      {/* Master toggle */}
      <div className="flex items-center gap-4 pb-4 border-b border-white/10">
       <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-foreground">
         Email Notifications
        </label>
        <p className="text-xs text-muted-foreground mt-1">
         Master toggle for all email notifications
        </p>
       </div>
       <button
        type="button"
        role="switch"
        aria-checked={formData.allowEmailNotifications}
        onClick={() =>
         setFormData((prev) => ({
          ...prev,
          allowEmailNotifications: !prev.allowEmailNotifications,
         }))
        }
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
         formData.allowEmailNotifications ? "bg-primary" : "bg-white/20"
        }`}
       >
        <span
         className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          formData.allowEmailNotifications ? "translate-x-6" : "translate-x-1"
         }`}
        />
       </button>
      </div>

      {/* Sub-toggles - Events section */}
      <div className={`space-y-4 ${!formData.allowEmailNotifications ? "opacity-50 pointer-events-none" : ""}`}>
       <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Events
       </p>

       <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
         <label className="block text-sm font-medium text-foreground">
          Event Reminders
         </label>
         <p className="text-xs text-muted-foreground mt-1">
          Get reminded about upcoming events you&apos;re attending
         </p>
        </div>
        <button
         type="button"
         role="switch"
         aria-checked={formData.allowTicketReminders}
         onClick={() =>
          setFormData((prev) => ({
           ...prev,
           allowTicketReminders: !prev.allowTicketReminders,
          }))
         }
         disabled={!formData.allowEmailNotifications}
         className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          formData.allowTicketReminders ? "bg-primary" : "bg-white/20"
         }`}
        >
         <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
           formData.allowTicketReminders ? "translate-x-6" : "translate-x-1"
          }`}
         />
        </button>
       </div>

       <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
         <label className="block text-sm font-medium text-foreground">
          Event Updates
         </label>
         <p className="text-xs text-muted-foreground mt-1">
          Notifications when event details change (date, time, location)
         </p>
        </div>
        <button
         type="button"
         role="switch"
         aria-checked={formData.allowEventUpdateEmails}
         onClick={() =>
          setFormData((prev) => ({
           ...prev,
           allowEventUpdateEmails: !prev.allowEventUpdateEmails,
          }))
         }
         disabled={!formData.allowEmailNotifications}
         className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          formData.allowEventUpdateEmails ? "bg-primary" : "bg-white/20"
         }`}
        >
         <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
           formData.allowEventUpdateEmails ? "translate-x-6" : "translate-x-1"
          }`}
         />
        </button>
       </div>

       <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
         <label className="block text-sm font-medium text-foreground">
          Waitlist Notifications
         </label>
         <p className="text-xs text-muted-foreground mt-1">
          Get notified when you&apos;re promoted from a waitlist
         </p>
        </div>
        <button
         type="button"
         role="switch"
         aria-checked={formData.allowWaitlistEmails}
         onClick={() =>
          setFormData((prev) => ({
           ...prev,
           allowWaitlistEmails: !prev.allowWaitlistEmails,
          }))
         }
         disabled={!formData.allowEmailNotifications}
         className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          formData.allowWaitlistEmails ? "bg-primary" : "bg-white/20"
         }`}
        >
         <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
           formData.allowWaitlistEmails ? "translate-x-6" : "translate-x-1"
          }`}
         />
        </button>
       </div>

       {/* Social section */}
       <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-4">
        Social
       </p>

       <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
         <label className="block text-sm font-medium text-foreground">
          Followed Users&apos; Events
         </label>
         <p className="text-xs text-muted-foreground mt-1">
          Get notified when people you follow create new events
         </p>
        </div>
        <button
         type="button"
         role="switch"
         aria-checked={formData.notifyFollowedUserEvents}
         onClick={() =>
          setFormData((prev) => ({
           ...prev,
           notifyFollowedUserEvents: !prev.notifyFollowedUserEvents,
          }))
         }
         disabled={!formData.allowEmailNotifications}
         className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          formData.notifyFollowedUserEvents ? "bg-primary" : "bg-white/20"
         }`}
        >
         <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
           formData.notifyFollowedUserEvents ? "translate-x-6" : "translate-x-1"
          }`}
         />
        </button>
       </div>

       {/* Organizer section */}
       <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-4">
        Organizer
       </p>

       <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
         <label className="block text-sm font-medium text-foreground">
          Collaborator Invites
         </label>
         <p className="text-xs text-muted-foreground mt-1">
          Receive emails when you&apos;re invited to collaborate on events
         </p>
        </div>
        <button
         type="button"
         role="switch"
         aria-checked={formData.allowCollaboratorEmails}
         onClick={() =>
          setFormData((prev) => ({
           ...prev,
           allowCollaboratorEmails: !prev.allowCollaboratorEmails,
          }))
         }
         disabled={!formData.allowEmailNotifications}
         className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          formData.allowCollaboratorEmails ? "bg-primary" : "bg-white/20"
         }`}
        >
         <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
           formData.allowCollaboratorEmails ? "translate-x-6" : "translate-x-1"
          }`}
         />
        </button>
       </div>
      </div>
     </div>

     {/* Action Buttons */}
     <div className="flex items-center justify-end gap-3">
      <Link
       href="/profile"
       className="rounded-xl px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
       Cancel
      </Link>
      <button
       type="submit"
       disabled={isSaving}
       className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
       {isSaving ? (
        <>
         <Loader2 className="h-4 w-4 animate-spin" />
         Saving...
        </>
       ) : (
        <>
         <Save className="h-4 w-4" />
         Save Changes
        </>
       )}
      </button>
     </div>
    </form>
   </div>
  </div>
 );
}
