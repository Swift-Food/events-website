"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { useAuth } from "@/lib/auth/authContext";
import { notificationService } from "@/services/notification.service";
import {
  EventNotificationResponse,
  NotificationActionType,
} from "@/types/notification";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NotificationContextType {
  notifications: EventNotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  handleAction: (
    notification: EventNotificationResponse,
    action: NotificationActionType
  ) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const POLLING_INTERVAL = 30000; // 30 seconds
const PAGE_SIZE = 20;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    EventNotificationResponse[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const newSkip = reset ? 0 : skip;
        const response = await notificationService.getNotifications({
          skip: newSkip,
          take: PAGE_SIZE,
        });

        if (reset) {
          setNotifications(response.notifications);
          setSkip(PAGE_SIZE);
        } else {
          setNotifications((prev) => [...prev, ...response.notifications]);
          setSkip((prev) => prev + PAGE_SIZE);
        }

        setHasMore(response.notifications.length === PAGE_SIZE);
        setUnreadCount(response.unreadCount);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, skip]
  );

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    await fetchNotifications(false);
  }, [isLoading, hasMore, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notification dismissed");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to dismiss notification");
    }
  }, []);

  const handleAction = useCallback(
    async (
      notification: EventNotificationResponse,
      action: NotificationActionType
    ) => {
      try {
        switch (action) {
          // Follow actions
          case NotificationActionType.ACCEPT_FOLLOW:
            if (notification.relatedUserId) {
              await notificationService.acceptFollowRequest(
                notification.relatedUserId
              );
              toast.success("Follow request accepted");
              // Remove the notification after action
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
              );
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            break;

          case NotificationActionType.REJECT_FOLLOW:
            if (notification.relatedUserId) {
              await notificationService.rejectFollowRequest(
                notification.relatedUserId
              );
              toast.success("Follow request rejected");
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
              );
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            break;

          // Collaborator actions
          case NotificationActionType.ACCEPT_COLLAB:
            if (notification.relatedCollaboratorId) {
              await notificationService.acceptCollaboratorInvite(
                notification.relatedCollaboratorId
              );
              toast.success("Collaborator invite accepted");
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
              );
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            break;

          case NotificationActionType.REJECT_COLLAB:
            if (notification.relatedCollaboratorId) {
              await notificationService.rejectCollaboratorInvite(
                notification.relatedCollaboratorId
              );
              toast.success("Collaborator invite rejected");
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
              );
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            break;

          // Navigation actions
          case NotificationActionType.VIEW_PROFILE:
            if (notification.relatedUserId) {
              router.push(`/user/${notification.relatedUserId}`);
              setIsDropdownOpen(false);
            }
            break;

          case NotificationActionType.VIEW_EVENT:
            if (notification.relatedEventId) {
              router.push(`/events/${notification.relatedEventId}`);
              setIsDropdownOpen(false);
            }
            break;

          case NotificationActionType.VIEW_TICKET:
            if (notification.relatedTicketId) {
              router.push(`/my-tickets?ticketId=${notification.relatedTicketId}`);
              setIsDropdownOpen(false);
            }
            break;

          case NotificationActionType.VIEW_DASHBOARD:
            if (notification.relatedEventId) {
              router.push(`/event-management/${notification.relatedEventId}`);
              setIsDropdownOpen(false);
            }
            break;

          case NotificationActionType.VIEW_ATTENDEE:
            if (notification.relatedEventId) {
              router.push(`/event-management/${notification.relatedEventId}`);
              setIsDropdownOpen(false);
            }
            break;

          case NotificationActionType.VIEW_COLLABORATORS:
            if (notification.relatedEventId) {
              router.push(`/event-management/${notification.relatedEventId}`);
              setIsDropdownOpen(false);
            }
            break;

          case NotificationActionType.COMPLETE_PAYMENT:
            if (notification.relatedTicketId) {
              router.push(`/my-tickets?ticketId=${notification.relatedTicketId}`);
              setIsDropdownOpen(false);
            }
            break;
        }

        // Mark as read after action (for navigation actions)
        if (
          action !== NotificationActionType.ACCEPT_FOLLOW &&
          action !== NotificationActionType.REJECT_FOLLOW &&
          action !== NotificationActionType.ACCEPT_COLLAB &&
          action !== NotificationActionType.REJECT_COLLAB
        ) {
          if (!notification.readAt) {
            await markAsRead(notification.id);
          }
        }
      } catch (error) {
        console.error("Failed to handle notification action:", error);
        toast.error("Failed to perform action");
      }
    },
    [router, markAsRead]
  );

  // Start polling when authenticated
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      // Initial fetch
      refreshUnreadCount();

      // Start polling
      pollingIntervalRef.current = setInterval(() => {
        refreshUnreadCount();
      }, POLLING_INTERVAL);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, authLoading, refreshUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && isAuthenticated && notifications.length === 0) {
      fetchNotifications(true);
    }
  }, [isDropdownOpen, isAuthenticated, notifications.length, fetchNotifications]);

  // Clear notifications on logout
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setNotifications([]);
      setUnreadCount(0);
      setSkip(0);
      setHasMore(true);
    }
  }, [isAuthenticated, authLoading]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    isDropdownOpen,
    setIsDropdownOpen,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleAction,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export { NotificationContext };
