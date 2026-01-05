import { Metadata } from "next";
import { notFound } from "next/navigation";
import OrganizerProfileClient from "./OrganizerProfileClient";

interface PageProps {
  params: Promise<{ userId: string }>;
}

interface OrganizerProfile {
  id: string;
  userId: string;
  organizationName: string | null;
  eventsCreated: number;
  eventsAttended: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    profilePicture: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

async function getOrganizerProfile(userId: string): Promise<OrganizerProfile | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/event-users/user/${userId}/profile`,
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
    [profile.user.firstName, profile.user.lastName].filter(Boolean).join(" ") ||
    profile.user.username ||
    "Organizer";

  const description = `View events by ${displayName}. ${profile.eventsCreated} events created.`;

  return {
    title: `${displayName} | Organizer Profile`,
    description,
    openGraph: {
      title: `${displayName} | Organizer Profile`,
      description,
      images: profile.user.profilePicture ? [profile.user.profilePicture] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${displayName} | Organizer Profile`,
      description,
      images: profile.user.profilePicture ? [profile.user.profilePicture] : [],
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
    [profile.user.firstName, profile.user.lastName].filter(Boolean).join(" ") ||
    profile.user.username ||
    "Organizer";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    image: profile.user.profilePicture || undefined,
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
