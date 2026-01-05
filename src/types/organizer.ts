export interface OrganizerProfile {
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
