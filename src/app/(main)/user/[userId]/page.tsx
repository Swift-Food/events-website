import { Metadata } from "next";
import { notFound } from "next/navigation";
import UserProfileClient from "./UserProfileClient";
import { OrganizerProfile } from "@/types/organizer";
import { getDefaultProfilePic } from "@/utils/defaultProfilePic";

interface PageProps {
 params: Promise<{ userId: string }>;
}

async function getUserProfile(eventUserId: string): Promise<OrganizerProfile | null> {
 try {
  const res = await fetch(
   `${process.env.NEXT_PUBLIC_API_URL}/event-users/${eventUserId}`,
   {
    cache: "no-store",
   }
  );

  if (!res.ok) {
   if (res.status === 404) {
    return null;
   }
   throw new Error("Failed to fetch user profile");
  }

  return res.json();
 } catch (error) {
  console.error("Error fetching user profile:", error);
  return null;
 }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
 const { userId } = await params;
 const profile = await getUserProfile(userId);

 if (!profile) {
  return {
   title: "User Not Found",
  };
 }

 // Priority: personal name > username > organization name > fallback
 const personalName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
 const displayName = personalName || profile.user?.username || profile.organizationName || "User";

 const profileImage = profile.profilePicture || profile.user?.profilePicture ||
  `${process.env.NEXT_PUBLIC_APP_URL}${getDefaultProfilePic(userId)}`;
 const description = `View events by ${displayName}. ${profile.totalEventsCreated} events created.`;

 return {
  title: `${displayName} | Profile`,
  description,
  openGraph: {
   title: `${displayName} | Profile`,
   description,
   images: [profileImage],
   type: "profile",
  },
  twitter: {
   card: "summary",
   title: `${displayName} | Profile`,
   description,
   images: [profileImage],
  },
 };
}

export default async function UserProfilePage({ params }: PageProps) {
 const { userId } = await params;
 const profile = await getUserProfile(userId);
 // console.log("User profile data:", profile);

 if (!profile) {
  notFound();
 }

 // Priority: personal name > username > organization name > fallback
 const personalName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
 const displayName = personalName || profile.user?.username || profile.organizationName || "User";

 const profileImage = profile.profilePicture || profile.user?.profilePicture ||
  `${process.env.NEXT_PUBLIC_APP_URL}${getDefaultProfilePic(userId)}`;

 const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: displayName,
  image: profileImage,
 };

 return (
  <>
   <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
   />
   <UserProfileClient initialProfile={profile} userId={userId} />
  </>
 );
}
