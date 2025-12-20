"use client";

import { useState, useEffect } from "react";
import { X, Ticket } from "lucide-react";
import { TicketType } from "@/types";

interface TicketTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: TicketType) => void | Promise<void>;
  ticketToEdit?: TicketType | null;
}

export default function TicketTypeModal({
  isOpen,
  onClose,
  onSave,
  ticketToEdit,
}: TicketTypeModalProps) {
  const [localName, setLocalName] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localIsFree, setLocalIsFree] = useState(true);
  const [localPrice, setLocalPrice] = useState("0");
  const [localIsSingleUse, setLocalIsSingleUse] = useState(false);
  const [localQuantity, setLocalQuantity] = useState("100");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Update local state when modal opens or when editing a ticket
  useEffect(() => {
    if (isOpen) {
      if (ticketToEdit) {
        setLocalName(ticketToEdit.name);
        setLocalDescription(ticketToEdit.description);
        setLocalIsFree(ticketToEdit.isFree);
        setLocalPrice(ticketToEdit.price.toString());
        setLocalIsSingleUse(ticketToEdit.isSingleUse);
        setLocalQuantity(ticketToEdit.quantity?.toString() || "100");
      } else {
        // Reset for new ticket
        setLocalName("");
        setLocalDescription("");
        setLocalIsFree(true);
        setLocalPrice("0");
        setLocalIsSingleUse(false);
        setLocalQuantity("100");
      }
    }
  }, [isOpen, ticketToEdit]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Validate
    if (!localName.trim()) {
      alert("Please enter a ticket name");
      return;
    }

    const quantity = parseInt(localQuantity) || 100;
    if (quantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }

    if (quantity > 100000) {
      alert("Quantity cannot exceed 100,000");
      return;
    }

    const ticket: TicketType = {
      id: ticketToEdit?.id || Date.now().toString(),
      name: localName.trim(),
      description: localDescription.trim(),
      isFree: localIsFree,
      price: localIsFree ? 0 : parseFloat(localPrice) || 0,
      quantity: quantity,
      isSingleUse: localIsSingleUse,
    };

    setIsSaving(true);
    try {
      await onSave(ticket);
      onClose();
    } catch (error) {
      // Error is already handled in the parent component
      console.error("Error saving ticket:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleCancel}
      />

      {/* Panel - slides from right on desktop, from bottom on mobile */}
      <div
        className={`absolute bg-background text-foreground border-white/10 overflow-y-auto transition-transform duration-300 ease-out
          left-0 right-0 bottom-0 max-h-[90vh] rounded-t-2xl border-t px-4 py-6
          md:left-auto md:inset-y-0 md:right-0 md:w-full md:max-w-lg md:max-h-none md:rounded-t-none md:rounded-l-2xl md:border-t-0 md:border-l md:px-8 md:py-8
          ${isAnimating ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}
        `}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-3">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {ticketToEdit ? "Edit Ticket" : "Add Ticket Type"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full p-2 transition-all hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Ticket Name */}
          <div className="rounded-xl bg-card-background backdrop-blur-xl p-5">
            <label className="text-base font-semibold text-foreground block mb-3">
              Ticket Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground text-md font-semibold outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="e.g., General Admission, VIP, Early Bird"
            />
          </div>

          {/* Ticket Description */}
          <div className="rounded-xl bg-card-background backdrop-blur-xl p-5">
            <label className="text-base font-semibold text-foreground block mb-3">
              Description
            </label>
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder="Optional description of this ticket type..."
            />
          </div>

          {/* Quantity */}
          <div className="rounded-xl bg-card-background backdrop-blur-xl p-5">
            <label className="text-base font-semibold text-foreground block mb-3">
              Quantity Available <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100000"
              value={localQuantity}
              onChange={(e) => setLocalQuantity(e.target.value)}
              className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="100"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Number of tickets available must be within 1 - 100,000
            </p>
          </div>

          {/* Price Toggle */}
          <div className="rounded-xl bg-card-background backdrop-blur-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                {localIsFree ? (
                  <p className="text-base font-semibold text-foreground">
                    Free Ticket
                  </p>
                ) : (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground text-lg font-semibold">
                      £
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={localPrice}
                      onChange={(e) => setLocalPrice(e.target.value)}
                      className="w-40 rounded-xl bg-input-background pl-9 pr-4 py-2.5 text-foreground text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocalIsFree(true)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                    localIsFree
                      ? "bg-primary text-primary-foreground scale-105"
                      : "bg-card-secondary-background text-muted-foreground hover:bg-white/15"
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setLocalIsFree(false)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                    !localIsFree
                      ? "bg-primary text-primary-foreground scale-105"
                      : "bg-card-secondary-background text-muted-foreground hover:bg-white/15"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>
          </div>

          {/* Single Use Toggle */}
          <div className="rounded-xl bg-card-background backdrop-blur-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Single-Use Ticket
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ticket will be invalidated after first use
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocalIsSingleUse(!localIsSingleUse)}
                className={`h-7 w-14 rounded-full transition-all ${
                  localIsSingleUse
                    ? "bg-primary"
                    : "bg-card-secondary-background"
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full transition-all ${
                    localIsSingleUse
                      ? "translate-x-7 bg-primary-foreground"
                      : "translate-x-0.5 bg-foreground"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-white/10 backdrop-blur-md py-3 text-center font-semibold text-foreground transition-all hover:bg-white/15 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-primary py-3 text-center font-bold text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSaving ? "Saving..." : ticketToEdit ? "Update Ticket" : "Add Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}