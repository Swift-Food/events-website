"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Ticket,
  UserPlus,
  Users,
  CreditCard,
  AlertCircle,
  X,
} from "lucide-react";
import {
  EventNotificationResponse,
  EventNotificationType,
  NotificationActionType,
} from "@/types/notification";
import { useNotifications } from "@/context/NotificationContext";

interface NotificationItemProps {
  notification: EventNotificationResponse;
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const { handleAction, deleteNotification } = useNotifications();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case EventNotificationType.FOLLOW_REQUEST:
      case EventNotificationType.NEW_FOLLOWER:
      case EventNotificationType.FOLLOW_ACCEPTED:
        return <UserPlus className="h-5 w-5" />;
      case EventNotificationType.FOLLOWED_USER_ATTENDING:
      case EventNotificationType.FOLLOWED_USER_NEW_EVENT:
        return <Users className="h-5 w-5" />;
      case EventNotificationType.TICKET_CONFIRMED:
      case EventNotificationType.WAITLIST_PROMOTED:
        return <Ticket className="h-5 w-5" />;
      case EventNotificationType.EVENT_CANCELLED:
      case EventNotificationType.EVENT_DETAILS_CHANGED:
        return <Calendar className="h-5 w-5" />;
      case EventNotificationType.NEW_REGISTRATION:
      case EventNotificationType.REGISTRATION_SUMMARY:
        return <UserPlus className="h-5 w-5" />;
      case EventNotificationType.COLLABORATOR_INVITE:
      case EventNotificationType.COLLABORATOR_ACCEPTED:
        return <Users className="h-5 w-5" />;
      case EventNotificationType.COLLABORATOR_MAJOR_CHANGE:
        return <AlertCircle className="h-5 w-5" />;
      case EventNotificationType.PENDING_PAYMENT_REMINDER:
        return <CreditCard className="h-5 w-5" />;
      case EventNotificationType.WAITLIST_PRESSURE_ALERT:
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getAvatarContent = () => {
    if (notification.relatedUser?.profilePicture) {
      return (
        <img
          src={notification.relatedUser.profilePicture}
          alt={
            notification.relatedUser.firstName ||
            notification.relatedUser.username
          }
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
      );
    }
    if (notification.relatedEvent?.eventImage) {
      return (
        <img
          src={notification.relatedEvent.eventImage}
          alt={notification.relatedEvent.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
      );
    }
    return null;
  };

  const getActionButton = (action: NotificationActionType) => {
    const baseClasses =
      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors";

    switch (action) {
      case NotificationActionType.ACCEPT_FOLLOW:
      case NotificationActionType.ACCEPT_COLLAB:
        return (
          <button
            onClick={() => handleAction(notification, action)}
            className={`${baseClasses} bg-amber-600 text-white hover:bg-amber-500`}
          >
            Accept
          </button>
        );
      case NotificationActionType.REJECT_FOLLOW:
      case NotificationActionType.REJECT_COLLAB:
        return (
          <button
            onClick={() => handleAction(notification, action)}
            className={`${baseClasses} bg-white/10 text-white hover:bg-white/20`}
          >
            Reject
          </button>
        );
      case NotificationActionType.VIEW_PROFILE:
        return (
          <button
            onClick={() => handleAction(notification, action)}
            className={`${baseClasses} text-amber-500 hover:bg-amber-500/10`}
          >
            View Profile
          </button>
        );
      case NotificationActionType.VIEW_EVENT:
        return (
          <button
            onClick={() => handleAction(notification, action)}
            className={`${baseClasses} text-amber-500 hover:bg-amber-500/10`}
          >
            View Event
          </button>
        );
      case NotificationActionType.VIEW_TICKET:
        return (
          <button
            onClick={() => handleAction(notification, action)}
            className={`${baseClasses} text-amber-500 hover:bg-amber-500/10`}
          >
            View Ticket
          </button>
        );
      case NotificationActionType.VIEW_DASHBOARD:
        return (
          <button
            onClick={() => handleAction(notification, action)}
            className={`${baseClasses} text-amber-500 hover:bg-amber-500/10`}
          >
            View Dashboard
          </button>
        );
      case NotificationActionType.VIEW_ATTENDEE:
        return (
          <button
            onClick={() => handleAction(notification, action)}
            className={`${baseClasses} text-amber-500 hover:bg-amber-500/10`}
          >
            View Attendee
          </button>
        );
      case NotificationActionType.VIEW_COLLABORATORS:
        return (
          <button
            onClick={() => handleAction(notification, action)}
            className={`${baseClasses} text-amber-500 hover:bg-amber-500/10`}
          >
            View Team
          </button>
        );
      case NotificationActionType.COMPLETE_PAYMENT:
        return (
          <button
            onClick={() => handleAction(notification, action)}
            className={`${baseClasses} bg-amber-600 text-white hover:bg-amber-500`}
          >
            Complete Payment
          </button>
        );
      default:
        return null;
    }
  };

  const getPrimaryAction = (): NotificationActionType | null => {
    const actions = notification.availableActions;
    if (actions.includes(NotificationActionType.VIEW_PROFILE))
      return NotificationActionType.VIEW_PROFILE;
    if (actions.includes(NotificationActionType.VIEW_EVENT))
      return NotificationActionType.VIEW_EVENT;
    if (actions.includes(NotificationActionType.VIEW_TICKET))
      return NotificationActionType.VIEW_TICKET;
    if (actions.includes(NotificationActionType.VIEW_DASHBOARD))
      return NotificationActionType.VIEW_DASHBOARD;
    return null;
  };

  const primaryAction = getPrimaryAction();
  const isUnread = !notification.readAt;
  const avatarContent = getAvatarContent();

  const relativeTime = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  // Separate actions into primary (accept/reject/complete payment) and secondary (view)
  const primaryActions = notification.availableActions.filter((a) =>
    [
      NotificationActionType.ACCEPT_FOLLOW,
      NotificationActionType.REJECT_FOLLOW,
      NotificationActionType.ACCEPT_COLLAB,
      NotificationActionType.REJECT_COLLAB,
      NotificationActionType.COMPLETE_PAYMENT,
    ].includes(a)
  );

  const secondaryActions = notification.availableActions.filter(
    (a) => !primaryActions.includes(a)
  );

  return (
    <div
      className={`relative flex gap-3 p-4 transition-colors hover:bg-white/5 ${
        isUnread ? "bg-amber-500/5" : ""
      }`}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-amber-500" />
      )}

      {/* Avatar */}
      <div
        className="relative flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-white/10 cursor-pointer"
        onClick={() => primaryAction && handleAction(notification, primaryAction)}
      >
        {avatarContent}
        <div
          className={`absolute inset-0 flex items-center justify-center text-white/60 ${
            avatarContent ? "hidden" : ""
          }`}
        >
          {getNotificationIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title and time */}
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm cursor-pointer hover:text-amber-500 ${
              isUnread ? "font-medium text-white" : "text-white/80"
            }`}
            onClick={() =>
              primaryAction && handleAction(notification, primaryAction)
            }
          >
            {notification.title}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-white/50">{relativeTime}</span>
            <button
              onClick={() => deleteNotification(notification.id)}
              className="p-1 text-white/40 hover:text-white/60 transition-colors"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {notification.body && (
          <p className="text-sm text-white/60 mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}

        {/* Actions */}
        {notification.availableActions.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Primary actions first (Accept/Reject buttons) */}
            {primaryActions.map((action) => (
              <div key={action}>{getActionButton(action)}</div>
            ))}
            {/* Secondary actions (View links) */}
            {secondaryActions.map((action) => (
              <div key={action}>{getActionButton(action)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
