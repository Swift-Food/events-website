"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { followService } from "@/services/follow.service";
import { FollowerResponse } from "@/types/follower";
import { User, Loader2 } from "lucide-react";
import Link from "next/link";

type Tab = "followers" | "following";

export default function FriendsClient() {
  const router = useRouter();
  const { eventUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("followers");
  const [followers, setFollowers] = useState<FollowerResponse[]>([]);
  const [following, setFollowing] = useState<FollowerResponse[]>([]);
  const [followersTotal, setFollowersTotal] = useState(0);
  const [followingTotal, setFollowingTotal] = useState(0);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreFollowers, setHasMoreFollowers] = useState(true);
  const [hasMoreFollowing, setHasMoreFollowing] = useState(true);

  const ITEMS_PER_PAGE = 20;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchFollowers = useCallback(async () => {
    if (!eventUser?.id) return;
    setLoadingFollowers(true);
    try {
      const result = await followService.getFollowers(eventUser.id, {
        skip: 0,
        take: ITEMS_PER_PAGE,
      });
      setFollowers(result.followers);
      setFollowersTotal(result.total);
      setHasMoreFollowers(result.followers.length < result.total);
    } catch (err) {
      console.error("Failed to fetch followers:", err);
    } finally {
      setLoadingFollowers(false);
    }
  }, [eventUser?.id]);

  const fetchFollowing = useCallback(async () => {
    if (!eventUser?.id) return;
    setLoadingFollowing(true);
    try {
      const result = await followService.getFollowing(eventUser.id, {
        skip: 0,
        take: ITEMS_PER_PAGE,
      });
      setFollowing(result.following);
      setFollowingTotal(result.total);
      setHasMoreFollowing(result.following.length < result.total);
    } catch (err) {
      console.error("Failed to fetch following:", err);
    } finally {
      setLoadingFollowing(false);
    }
  }, [eventUser?.id]);

  const loadMore = async () => {
    const hasMore = activeTab === "followers" ? hasMoreFollowers : hasMoreFollowing;
    if (!eventUser?.id || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      if (activeTab === "followers") {
        const result = await followService.getFollowers(eventUser.id, {
          skip: followers.length,
          take: ITEMS_PER_PAGE,
        });
        setFollowers((prev) => [...prev, ...result.followers]);
        setHasMoreFollowers(followers.length + result.followers.length < result.total);
      } else {
        const result = await followService.getFollowing(eventUser.id, {
          skip: following.length,
          take: ITEMS_PER_PAGE,
        });
        setFollowing((prev) => [...prev, ...result.following]);
        setHasMoreFollowing(following.length + result.following.length < result.total);
      }
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Fetch both followers and following on mount
  useEffect(() => {
    fetchFollowers();
    fetchFollowing();
  }, [fetchFollowers, fetchFollowing]);

  const currentList = activeTab === "followers" ? followers : following;
  const loading = activeTab === "followers" ? loadingFollowers : loadingFollowing;
  const hasMore = activeTab === "followers" ? hasMoreFollowers : hasMoreFollowing;

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !eventUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Friends
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("followers")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "followers"
                ? "bg-primary text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            Followers ({followersTotal})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "following"
                ? "bg-primary text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            Following ({followingTotal})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && currentList.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
            <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {activeTab === "followers"
                ? "No followers yet"
                : "Not following anyone"}
            </h3>
            <p className="text-muted-foreground">
              {activeTab === "followers"
                ? "When people follow you, they'll appear here."
                : "When you follow people, they'll appear here."}
            </p>
          </div>
        )}

        {/* User List */}
        {!loading && currentList.length > 0 && (
          <div className="space-y-2">
            {currentList.map((user) => (
              <Link
                key={user.id}
                href={`/user/${user.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card-background hover:bg-white/5 transition-colors"
              >
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        );
                      }}
                    />
                  ) : null}
                  <div
                    className={`h-full w-full flex items-center justify-center ${
                      user.profilePicture ? "hidden" : ""
                    }`}
                  >
                    <User className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">
                    {user.organizationName ||
                      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                      user.username}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>

                {/* Follower count */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {user.followerCount} followers
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && currentList.length > 0 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2 rounded-full bg-white/5 text-foreground text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load more"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
