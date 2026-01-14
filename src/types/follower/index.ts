// Follower types

export type FollowStatusType = 'following' | 'pending' | 'not_following';

// User info displayed in follower/following lists
export interface FollowerResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  profilePicture: string | null;
  username: string;
  followerCount: number;
  followingCount: number;
  followStatus: FollowStatusType;
  followedAt: string;
}

// Paginated followers list
export interface FollowersListResponse {
  followers: FollowerResponse[];
  total: number;
  skip: number;
  take: number;
}

// Paginated following list
export interface FollowingListResponse {
  following: FollowerResponse[];
  total: number;
  skip: number;
  take: number;
}

// Pending follow request
export interface FollowRequestResponse {
  id: string;
  follower: FollowerResponse;
  requestedAt: string;
}

// List of pending requests
export interface FollowRequestsListResponse {
  requests: FollowRequestResponse[];
  total: number;
}

// Response for follow/unfollow/accept/reject actions
export interface FollowActionResponse {
  success: boolean;
  status: FollowStatusType;
  message?: string;
}

// Response for is-following check
export interface IsFollowingResponse {
  isFollowing: boolean;
  status: FollowStatusType;
}

// Friend attending an event
export interface FriendAttendingResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  username: string;
  ticketName: string;
}

// List of friends attending
export interface FriendsAttendingListResponse {
  friends: FriendAttendingResponse[];
  total: number;
  skip: number;
  take: number;
}
