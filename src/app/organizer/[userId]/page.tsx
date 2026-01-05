import { Metadata } from "next";
import { notFound } from "next/navigation";
import OrganizerProfileClient from "./OrganizerProfileClient";

interface PageProps {
  params: Promise<{ userId: string }>;
}

interface OrganizerProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  bio?: string;
  website?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  totalEventsCreated: number;
  totalEventsAttended: number;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  user?: {
    id: string;
    email: string;
    username?: string;
    profilePicture?: string;
  };
}

async function getOrganizerProfile(eventUserId: string): Promise<OrganizerProfile | null> {
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
      throw new Error("Failed to fetch organizer profile");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching organizer profile:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getOrganizerProfile(userId);

  if (!profile) {
    return {
      title: "Organizer Not Found",
    };
  }

  const displayName = profile.organizationName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.user?.username ||
    "Organizer";

  const profileImage = profile.profilePicture || profile.user?.profilePicture;
  const description = `View events by ${displayName}. ${profile.totalEventsCreated} events created.`;

  return {
    title: `${displayName} | Organizer Profile`,
    description,
    openGraph: {
      title: `${displayName} | Organizer Profile`,
      description,
      images: profileImage ? [profileImage] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${displayName} | Organizer Profile`,
      description,
      images: profileImage ? [profileImage] : [],
    },
  };
}

export default async function OrganizerProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const profile = await getOrganizerProfile(userId);

  if (!profile) {
    notFound();
  }

  const displayName = profile.organizationName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.user?.username ||
    "Organizer";

  const profileImage = profile.profilePicture || profile.user?.profilePicture;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    image: profileImage || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OrganizerProfileClient initialProfile={profile} userId={userId} />
    </>
  );
}
