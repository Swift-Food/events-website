"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import NotificationItem from "./NotificationItem";

interface NotificationDropdownProps {
  isLandingPage?: boolean;
}

export default function NotificationDropdown({ isLandingPage = false }: NotificationDropdownProps) {
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

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number | undefined; left: number | undefined }>({ top: 0, right: 0, left: undefined });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
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
    // Calculate dropdown position from the trigger button
    if (newState && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      setDropdownPos({
        top: isMobile ? 64 : rect.bottom + 8, // 64px = navbar height on mobile
        right: isMobile ? undefined : window.innerWidth - rect.right,
        left: isMobile ? 16 : undefined,
      });
    }
    setIsDropdownOpen(newState);
    if (newState && notifications.length === 0) {
      fetchNotifications(true);
    }
  };

  return (
    <>
      <div className="relative">
        {/* Bell button */}
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          className={`relative flex h-9 w-9 items-center justify-center rounded-full ${isLandingPage ? "text-zinc-900 hover:bg-zinc-900/10" : "text-foreground hover:bg-foreground/10"} transition-colors cursor-pointer`}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown panel - portaled outside header to allow backdrop-blur */}
      {isDropdownOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[60] w-[calc(100%-2rem)] sm:w-96 rounded-xl border border-white/10 bg-[#1a1a1a]/70 backdrop-blur-sm shadow-2xl shadow-black/50"
          style={{ top: dropdownPos.top, right: dropdownPos.right, left: dropdownPos.left }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-medium text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs text-[#d9ccff] transition-colors"
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
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="h-10 w-10 text-white/20 mb-3" />
                <p className="text-sm text-white/60">No notifications</p>
                <p className="text-xs text-white/40 mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                  </div>
                )}
                {!hasMore && notifications.length > 0 && (
                  <div className="text-center py-4 text-xs text-white/40">
                    No more notifications
                  </div>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
