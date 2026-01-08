"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { eventUserService, UpdateEventUserDto } from "@/services/event-user.service";
import { ArrowLeft, Loader2, User, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, eventUser, isAuthenticated, isLoading: authLoading, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    organizationName: "",
    bio: "",
    website: "",
    twitterHandle: "",
    linkedinUrl: "",
    instagramUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load existing profile data
  useEffect(() => {
    if (user && eventUser) {
      setFormData({
        firstName: eventUser.firstName || "",
        lastName: eventUser.lastName || "",
        username: user.username || "",
        organizationName: eventUser.organizationName || "",
        bio: eventUser.bio || "",
        website: eventUser.website || "",
        twitterHandle: eventUser.twitterHandle || "",
        linkedinUrl: eventUser.linkedinUrl || "",
        instagramUrl: eventUser.instagramUrl || "",
      });
    }
  }, [user, eventUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Build update payload - send all editable fields
      const updateData: UpdateEventUserDto = {
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        username: formData.username.trim() || undefined,
        organizationName: formData.organizationName.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        website: formData.website.trim() || undefined,
        twitterHandle: formData.twitterHandle.trim() || undefined,
        linkedinUrl: formData.linkedinUrl.trim() || undefined,
        instagramUrl: formData.instagramUrl.trim() || undefined,
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
      router.push("/profile");
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
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
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
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-primary/20">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profile Picture</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Profile picture uploads coming soon
                </p>
              </div>
            </div>
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourwebsite.com"
                className="w-full rounded-xl border border-white/10 bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Twitter Handle
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <input
                  type="text"
                  name="twitterHandle"
                  value={formData.twitterHandle}
                  onChange={handleChange}
                  placeholder="username"
                  className="w-full rounded-xl border border-white/10 bg-input-background pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full rounded-xl border border-white/10 bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Instagram URL
              </label>
              <input
                type="url"
                name="instagramUrl"
                value={formData.instagramUrl}
                onChange={handleChange}
                placeholder="https://instagram.com/yourprofile"
                className="w-full rounded-xl border border-white/10 bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
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
