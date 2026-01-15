"use client";

import { useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import NotificationItem from "./NotificationItem";

export default function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    isDropdownOpen,
    setIsDropdownOpen,
    fetchNotifications,
    loadMore,
    markAllAsRead,
  } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, setIsDropdownOpen]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  }, [isLoading, hasMore, loadMore]);

  const toggleDropdown = () => {
    const newState = !isDropdownOpen;
    setIsDropdownOpen(newState);
    if (newState && notifications.length === 0) {
      fetchNotifications(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggleDropdown}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/10 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-foreground/10 bg-background shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
            <h3 className="text-sm font-medium text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="max-h-[400px] overflow-y-auto"
          >
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="h-10 w-10 text-foreground/20 mb-3" />
                <p className="text-sm text-foreground/60">No notifications</p>
                <p className="text-xs text-foreground/40 mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-foreground/5">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
                  </div>
                )}
                {!hasMore && notifications.length > 0 && (
                  <div className="text-center py-4 text-xs text-foreground/40">
                    No more notifications
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
