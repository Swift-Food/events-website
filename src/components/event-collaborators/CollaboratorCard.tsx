import { CollaboratorResponseDto, CollaboratorRole } from "@/types/event-collaborator";
import { MoreVertical, Mail, Shield, User, Trash2, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface CollaboratorCardProps {
  collaborator: CollaboratorResponseDto;
  isOwner?: boolean;
  onRemove: (collaboratorId: string) => void;
  onUpdateRole: (collaboratorId: string, role: CollaboratorRole) => void;
  onResendInvite: (collaboratorId: string) => void;
}

export const CollaboratorCard = ({
  collaborator,
  isOwner,
  onRemove,
  onUpdateRole,
  onResendInvite,
}: CollaboratorCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const getDisplayName = () => {
    if (collaborator.eventUser) {
      if (collaborator.eventUser.firstName && collaborator.eventUser?.lastName){
        return `${collaborator.eventUser.firstName} ${collaborator.eventUser.lastName}`;
      }
      return `${collaborator.eventUser.email}`;
    }
    return collaborator.pendingEmail || "Unknown";
  };

  const getRoleBadge = () => {
    const isAdmin = collaborator.role === CollaboratorRole.COLLABORATOR_ADMIN;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isAdmin
            ? "bg-purple-100 text-purple-700"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
        {isAdmin ? "Admin" : "Scanner"}
      </span>
    );
  };

  return (
    <div className="group rounded-xl bg-white/5 p-4 transition-all hover:bg-white/15">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-semibold text-white">
            {getInitials(
              collaborator.eventUser?.firstName,
              collaborator.eventUser?.lastName,
              collaborator.pendingEmail ||collaborator.eventUser?.email || undefined
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {getDisplayName()}
              </h3>
              {!collaborator.inviteAccepted && (
                <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Pending
                </span>
              )}
              {isOwner && (
                <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Owner
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-xs text-muted-foreground">
                {collaborator.eventUser?.organizationName ||
                  collaborator.pendingEmail || collaborator.eventUser?.email ||
                  "No email"}
              </p>
            </div>
          </div>
        </div>

        {/* Role Badge & Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {getRoleBadge()}

          {!isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl bg-card-secondary-background shadow-xl ring-1 ring-border">
                  <div className="py-1">
                    {!collaborator.inviteAccepted && (
                      <button
                        onClick={() => {
                          onResendInvite(collaborator.id);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-white/10"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Resend Invite
                      </button>
                    )}

                    {collaborator.role === CollaboratorRole.COLLABORATOR ? (
                      <button
                        onClick={() => {
                          onUpdateRole(collaborator.id, CollaboratorRole.COLLABORATOR_ADMIN);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-purple-600 transition-colors hover:bg-white/10"
                      >
                        <Shield className="h-4 w-4" />
                        Make Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onUpdateRole(collaborator.id, CollaboratorRole.COLLABORATOR);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-blue-600 transition-colors hover:bg-white/10"
                      >
                        <User className="h-4 w-4" />
                        Make Editor
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onRemove(collaborator.id);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-white/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
