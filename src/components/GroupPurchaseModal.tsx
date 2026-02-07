"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  Loader2,
  X,
  Search,
  Users,
  UserPlus,
  Clock,
  Check,
  AlertCircle,
} from "lucide-react";
import { EventResponseDto } from "@/types/event";
import { EventTicketResponseDto } from "@/types/event-ticket/response/ticket.dto";
import { MutualFollowUser } from "@/types/group-purchase";
import { eventUserService } from "@/services/event-user.service";
import { groupPurchaseService } from "@/services/group-purchase.service";
import { toast } from "sonner";

interface GroupPurchaseModalProps {
  isOpen: boolean;
  event: EventResponseDto;
  ticket: EventTicketResponseDto;
  onClose: () => void;
  onSessionCreated: (sessionId: string) => void;
}

export default function GroupPurchaseModal({
  isOpen,
  event,
  ticket,
  onClose,
  onSessionCreated,
}: GroupPurchaseModalProps) {
  const [step, setStep] = useState<'quantity' | 'invite' | 'confirm'>('quantity');
  const [quantity, setQuantity] = useState(2); // Minimum 2 for group
  const [searchQuery, setSearchQuery] = useState("");
  const [mutualFollows, setMutualFollows] = useState<MutualFollowUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<MutualFollowUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const maxGroupSize = ticket.maxGroupSize || 1;
  const pricePerTicket = Number(ticket.price) || 0;
  const totalPrice = pricePerTicket * quantity;
  const slotsToFill = quantity - 1; // Leader is one slot

  // Filtered mutual follows (exclude already selected)
  const filteredFollows = useMemo(() => {
    const selectedIds = new Set(selectedUsers.map(u => u.id));
    return mutualFollows.filter(u => !selectedIds.has(u.id));
  }, [mutualFollows, selectedUsers]);

  // Load mutual follows on search
  useEffect(() => {
    const searchMutualFollows = async () => {
      if (!isOpen) return;

      setIsSearching(true);
      try {
        const response = await eventUserService.getMutualFollows(searchQuery || undefined);
        setMutualFollows(response.mutualFollows);
      } catch (error) {
        console.error("Failed to fetch mutual follows:", error);
        toast.error("Failed to load friends list");
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchMutualFollows, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, isOpen]);

  const handleSelectUser = (user: MutualFollowUser) => {
    if (selectedUsers.length >= slotsToFill) {
      toast.error(`You can only invite ${slotsToFill} people for ${quantity} tickets`);
      return;
    }
    setSelectedUsers([...selectedUsers, user]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateSession = async () => {
    if (selectedUsers.length !== slotsToFill) {
      toast.error(`Please invite ${slotsToFill} people to fill all slots`);
      return;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setIsCreating(true);
    try {
      const response = await groupPurchaseService.createSession({
        eventTicketId: ticket.id,
        totalSlots: quantity,
        invitedEventUserIds: selectedUsers.map(u => u.id),
      });

      if (response.success) {
        toast.success("Group session created! Invites sent to your friends.");
        onSessionCreated(response.sessionId);
      } else {
        throw new Error(response.message || "Failed to create group session");
      }
    } catch (error: any) {
      console.error("Failed to create group session:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to create group session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep('quantity');
    setQuantity(2);
    setSelectedUsers([]);
    setSearchQuery("");
    setAcceptedTerms(false);
    onClose();
  };

  const handleBack = () => {
    if (step === 'invite') {
      setStep('quantity');
    } else if (step === 'confirm') {
      setStep('invite');
    }
  };

  const handleNext = () => {
    if (step === 'quantity') {
      setStep('invite');
    } else if (step === 'invite') {
      if (selectedUsers.length !== slotsToFill) {
        toast.error(`Please invite ${slotsToFill} people to fill all slots`);
        return;
      }
      setStep('confirm');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[85vh] rounded-2xl border border-neutral-700 bg-card-background shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {step !== 'quantity' && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {step === 'quantity' && 'Group Tickets'}
                {step === 'invite' && 'Invite Friends'}
                {step === 'confirm' && 'Confirm Group'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === 'quantity' && 'Select how many tickets for your group'}
                {step === 'invite' && `Invite ${slotsToFill} friend${slotsToFill > 1 ? 's' : ''} to join`}
                {step === 'confirm' && 'Review and create your group'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'quantity' && (
            <div className="p-5 space-y-6">
              {/* Event Info */}
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-card-secondary-background shrink-0">
                  {event.eventImage ? (
                    <Image
                      src={event.eventImage}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center"
                      style={{ backgroundColor: event.eventColor || "#3b82f6" }}
                    >
                      <Calendar className="h-6 w-6 text-white/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">{ticket.name}</p>
                  <p className="text-sm font-medium text-primary">
                    {pricePerTicket === 0 ? "Free" : `£${pricePerTicket.toFixed(2)}`} per ticket
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  How many tickets?
                </label>
                <div className="flex items-center justify-center gap-4 py-4">
                  <button
                    onClick={() => setQuantity(Math.max(2, quantity - 1))}
                    disabled={quantity <= 2}
                    className="h-12 w-12 rounded-full border border-white/20 bg-white/5 text-xl font-semibold text-foreground transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <div className="text-center">
                    <span className="text-4xl font-bold text-foreground">{quantity}</span>
                    <p className="text-xs text-muted-foreground mt-1">tickets</p>
                  </div>
                  <button
                    onClick={() => setQuantity(Math.min(maxGroupSize, quantity + 1))}
                    disabled={quantity >= maxGroupSize}
                    className="h-12 w-12 rounded-full border border-white/20 bg-white/5 text-xl font-semibold text-foreground transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Maximum {maxGroupSize} tickets per group
                </p>
              </div>

              {/* How it works */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  How group tickets work
                </h4>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">1.</span>
                    You'll invite friends who mutually follow you
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">2.</span>
                    They have 2 hours to accept or decline
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">3.</span>
                    Once all accept, you can complete payment
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">4.</span>
                    Each person gets their own ticket with QR code
                  </li>
                </ul>
              </div>

              {/* Price Summary */}
              {pricePerTicket > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {quantity} tickets × £{pricePerTicket.toFixed(2)}
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      £{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'invite' && (
            <div className="p-5 space-y-4">
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Selected ({selectedUsers.length}/{slotsToFill})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 pl-1 pr-2 py-1"
                      >
                        {user.profilePicture ? (
                          <Image
                            src={user.profilePicture}
                            alt={user.username}
                            width={24}
                            height={24}
                            className="rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-primary/30 flex items-center justify-center">
                            <span className="text-xs text-primary font-medium">
                              {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-foreground">
                          {user.firstName || user.username}
                        </span>
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="h-4 w-4 rounded-full hover:bg-white/20 flex items-center justify-center"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search friends by name or username..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Mutual Follows List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredFollows.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No matching friends found" : "No mutual follows yet"}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      You can only invite people who mutually follow you
                    </p>
                  </div>
                ) : (
                  filteredFollows.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      disabled={selectedUsers.length >= slotsToFill}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {user.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt={user.username}
                          width={40}
                          height={40}
                          className="rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm text-primary font-medium">
                            {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                      </div>
                      <UserPlus className="h-5 w-5 text-primary shrink-0" />
                    </button>
                  ))
                )}
              </div>

              {/* Slots Remaining */}
              {selectedUsers.length < slotsToFill && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-300">
                    Invite {slotsToFill - selectedUsers.length} more friend{slotsToFill - selectedUsers.length > 1 ? 's' : ''} to continue
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="p-5 space-y-4">
              {/* Event & Ticket Summary */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-card-secondary-background shrink-0">
                    {event.eventImage ? (
                      <Image
                        src={event.eventImage}
                        alt={event.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center"
                        style={{ backgroundColor: event.eventColor || "#3b82f6" }}
                      >
                        <Calendar className="h-4 w-4 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{event.name}</h4>
                    <p className="text-sm text-muted-foreground">{ticket.name}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-sm text-muted-foreground">{quantity} tickets</span>
                  <span className="font-bold text-foreground">
                    {totalPrice === 0 ? "Free" : `£${totalPrice.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Group Members */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Group Members ({quantity})
                </h4>
                <div className="space-y-2">
                  {/* Leader (You) */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center">
                      <span className="text-sm text-primary font-medium">You</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">You (Leader)</p>
                      <p className="text-xs text-muted-foreground">Will pay for the group</p>
                    </div>
                    <Check className="h-5 w-5 text-primary" />
                  </div>

                  {/* Invited Members */}
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
                    >
                      {user.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt={user.username}
                          width={40}
                          height={40}
                          className="rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground font-medium">
                            {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">Will receive invite</p>
                      </div>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Info */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">2 hour time limit</p>
                    <p className="text-xs text-amber-300/70 mt-1">
                      Your friends have 2 hours to accept. Once everyone accepts, you can complete payment. If time runs out or someone declines, you can invite someone else.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-white/20 bg-card-secondary-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <a
                    href="/terms/ticket"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ticket Sales Terms and Conditions
                  </a>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            {step === 'confirm' ? (
              <button
                onClick={handleCreateSession}
                disabled={!acceptedTerms || isCreating}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    Create Group & Send Invites
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={step === 'invite' && selectedUsers.length !== slotsToFill}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
