import { useState } from "react";
import { X, Mail, Link as LinkIcon, Shield, User, Check, Copy } from "lucide-react";
import { CollaboratorRole } from "@/types/event-collaborator";
import { toast } from "sonner";

interface AddCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteByEmail: (email: string, role: CollaboratorRole) => Promise<void>;
  onGenerateLink: (role: CollaboratorRole) => Promise<string>;
}

type InviteMethod = "email" | "link";

export const AddCollaboratorModal = ({
  isOpen,
  onClose,
  onInviteByEmail,
  onGenerateLink,
}: AddCollaboratorModalProps) => {
  const [method, setMethod] = useState<InviteMethod>("email");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>(CollaboratorRole.COLLABORATOR);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleInviteByEmail = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await onInviteByEmail(email, role);
      toast.success("Invitation sent successfully");
      setEmail("");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsLoading(true);
    try {
      const link = await onGenerateLink(role);
      setGeneratedLink(link);
      toast.success("Invite link generated");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopiedLink(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleClose = () => {
    setEmail("");
    setGeneratedLink(null);
    setCopiedLink(false);
    setMethod("email");
    setRole(CollaboratorRole.COLLABORATOR);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold text-foreground">
            Add Collaborator
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-card-secondary-background hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Method Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setMethod("email");
                setGeneratedLink(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                method === "email"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card-secondary-background text-foreground hover:bg-white/15"
              }`}
            >
              <Mail className="h-4 w-4" />
              Send Email
            </button>
            <button
              onClick={() => {
                setMethod("link");
                setGeneratedLink(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                method === "link"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card-secondary-background text-foreground hover:bg-white/15"
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              Copy Link
            </button>
          </div>

          {/* Role Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Access Level
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => setRole(CollaboratorRole.COLLABORATOR)}
                className={`flex items-start gap-3 rounded-xl p-4 text-left transition-all ${
                  role === CollaboratorRole.COLLABORATOR
                    ? "bg-blue-500/10 ring-2 ring-blue-500"
                    : "bg-card-secondary-background hover:bg-white/15"
                }`}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Scanner
                    </h4>
                    {role === CollaboratorRole.COLLABORATOR && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                  Can scan QR codes and check in attendees at event entry.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setRole(CollaboratorRole.COLLABORATOR_ADMIN)}
                className={`flex items-start gap-3 rounded-xl p-4 text-left transition-all ${
                  role === CollaboratorRole.COLLABORATOR_ADMIN
                    ? "bg-purple-500/10 ring-2 ring-purple-500"
                    : "bg-card-secondary-background hover:bg-white/15"
                }`}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Admin
                    </h4>
                    {role === CollaboratorRole.COLLABORATOR_ADMIN && (
                      <Check className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                  Can manage collaborators, view and edit event details.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Email Input (for email method) */}
          {method === "email" && !generatedLink && (
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full rounded-xl bg-card-secondary-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleInviteByEmail();
                  }
                }}
              />
            </div>
          )}

          {/* Generated Link Display */}
          {method === "link" && generatedLink && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Share this link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 rounded-xl bg-card-secondary-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Anyone with this link can accept the invitation to collaborate on this event.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background"
          >
            Cancel
          </button>
          {method === "email" ? (
            <button
              onClick={handleInviteByEmail}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invite
                </>
              )}
            </button>
          ) : (
            !generatedLink && (
              <button
                onClick={handleGenerateLink}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    Generate Link
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
