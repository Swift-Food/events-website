"use client";

import { useState } from "react";
import { Loader2, X, ArrowLeft, Copy, Check } from "lucide-react";
import { guestTicketService } from "@/services/guest-ticket.service";
import { ReservationMode } from "@/types/guest-ticket";
import { EventTicketResponseDto } from "@/types/event-ticket/response/ticket.dto";
import { toast } from "sonner";

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  eventId: string;
  tickets: EventTicketResponseDto[];
}

export function InviteLinkModal({
  isOpen,
  onClose,
  onBack,
  eventId,
  tickets,
}: InviteLinkModalProps) {
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLink = async (ticketId: string) => {
    try {
      setIsGenerating(true);
      const response = await guestTicketService.generateTicketInviteLink(eventId, {
        eventTicketId: ticketId,
        bypassPayment: false,
        bypassApproval: true,
        reservationMode: ReservationMode.ON_ACCEPTANCE,
        maxUses: 100,
      });
      setGeneratedLink(response.inviteLink);
      toast.success("Invite link generated!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate invite link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleClose = () => {
    setGeneratedLink("");
    setIsCopied(false);
    onClose();
  };

  const handleBack = () => {
    setGeneratedLink("");
    setIsCopied(false);
    onBack();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card-background border border-white/5 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-foreground">Generate Invite Link</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!generatedLink ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a ticket type to generate an invite link
            </p>
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleGenerateLink(ticket.id)}
                  disabled={isGenerating}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 disabled:opacity-50"
                >
                  <div className="font-medium text-foreground">{ticket.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {parseFloat(ticket.price) > 0 ? `£${ticket.price}` : "Free"} •{" "}
                    {ticket.quantityLeft} of {ticket.quantityTotal} available
                  </div>
                </button>
              ))}
            </div>
            {isGenerating && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Share this link with guests
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setGeneratedLink("");
                setIsCopied(false);
              }}
              className="text-sm text-primary hover:underline"
            >
              Generate another link
            </button>
          </div>
        )}
      </div>
    </>
  );
}
