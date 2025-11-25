"use client";

import { useState, useEffect } from "react";
import { X, Ticket } from "lucide-react";
import { TicketType } from "@/types/event";

interface TicketTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: TicketType) => void;
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

  const handleSave = () => {
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

    onSave(ticket);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-3xl bg-background backdrop-blur-2xl p-8 text-foreground shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-3">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">
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

        <div className="space-y-6">
          {/* Ticket Name */}
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 shadow-lg">
            <label className="text-base font-semibold text-foreground block mb-3">
              Ticket Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground text-lg font-semibold outline-none shadow-inner focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="e.g., General Admission, VIP, Early Bird"
            />
          </div>

          {/* Ticket Description */}
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 shadow-lg">
            <label className="text-base font-semibold text-foreground block mb-3">
              Description
            </label>
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none shadow-inner focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder="Optional description of this ticket type..."
            />
          </div>

          {/* Quantity */}
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 shadow-lg">
            <label className="text-base font-semibold text-foreground block mb-3">
              Quantity Available <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100000"
              value={localQuantity}
              onChange={(e) => setLocalQuantity(e.target.value)}
              className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground text-lg font-semibold outline-none shadow-inner focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="100"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Maximum number of tickets available for sale (1 - 100,000)
            </p>
          </div>

          {/* Price Toggle */}
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 shadow-lg">
            <div className={`flex items-center justify-between ${!localIsFree ? "mb-4" : ""}`}>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {localIsFree ? "Free Ticket" : `£${localPrice || "0"}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocalIsFree(true)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    localIsFree
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                      : "bg-card-secondary-background text-muted-foreground hover:bg-white/15"
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setLocalIsFree(false)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    !localIsFree
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                      : "bg-card-secondary-background text-muted-foreground hover:bg-white/15"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>

            {/* Price Input - only shown if paid */}
            {!localIsFree && (
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
                  className="w-full rounded-xl bg-input-background pl-9 pr-4 py-3.5 text-foreground text-lg font-semibold outline-none shadow-inner focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          {/* Single Use Toggle */}
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 shadow-lg">
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
                className={`h-7 w-14 rounded-full transition-all shadow-inner ${
                  localIsSingleUse
                    ? "bg-primary shadow-lg shadow-primary/30"
                    : "bg-card-secondary-background"
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full transition-all shadow-lg ${
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
            className="flex-1 rounded-full bg-white/10 backdrop-blur-md py-4 text-center font-semibold text-foreground transition-all hover:bg-white/15 shadow-lg hover:scale-105"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-full bg-primary py-4 text-center font-bold text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 shadow-xl shadow-primary/30 hover:bg-primary/90"
          >
            {ticketToEdit ? "Update" : "Add"} Ticket
          </button>
        </div>
      </div>
    </div>
  );
}