"use client";

import { useEffect, useState } from "react";
import { X, Check, Settings, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { CateringBundle } from "@/types/catering";

interface BundleDetailsModalProps {
  bundle: CateringBundle | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bundleId: string, quantity: number) => void;
  currentQuantity: number;
  eventId: string;
  sessionDate?: string;
  sessionTime?: string;
}

export function BundleDetailsModal({
  bundle,
  isOpen,
  onClose,
  onAdd,
  currentQuantity,
  eventId,
  sessionDate,
  sessionTime,
}: BundleDetailsModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Handle animation state and reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setQuantity(currentQuantity > 0 ? currentQuantity : 1);
    }
  }, [isOpen, currentQuantity]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAnimating(false);
        setTimeout(() => {
          onClose();
        }, 300);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  if (!isOpen || !bundle) return null;

  const bundleFixedPrice = bundle.pricePerPerson * bundle.baseGuestCount;

  // Group items by restaurant
  const itemsByRestaurant = bundle.items.reduce((acc, item) => {
    if (!acc[item.restaurantName]) {
      acc[item.restaurantName] = [];
    }
    acc[item.restaurantName].push(item);
    return acc;
  }, {} as Record<string, typeof bundle.items>);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal Container - Slides from right on desktop, centered on mobile */}
      <div
        className={`
          fixed z-50

          /* Mobile: centered modal */
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[calc(100%-2rem)] max-w-md max-h-[85vh]
          rounded-2xl

          /* Desktop: slide from right */
          md:top-0 md:right-0 md:left-auto md:translate-x-0 md:translate-y-0
          md:h-full md:max-h-full md:max-w-lg md:rounded-none md:rounded-l-2xl
          md:w-full

          bg-card-background border border-white/10
          shadow-2xl
          overflow-hidden
          flex flex-col

          /* Animations */
          transition-all duration-300 ease-out

          ${
            isAnimating
              ? "md:translate-x-0 opacity-100 scale-100"
              : "md:translate-x-full opacity-0 scale-95"
          }
        `}
      >
        {/* Header */}
        <div className="relative flex-shrink-0 border-b border-white/10">
          {bundle.imageUrl && (
            <div className="relative h-48 w-full">
              <Image
                src={bundle.imageUrl}
                alt={bundle.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          <div className={bundle.imageUrl ? "absolute bottom-0 left-0 right-0 p-6" : "p-6"}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className={`text-2xl font-bold mb-2 ${bundle.imageUrl ? "text-white" : "text-foreground"}`}>
                  {bundle.name}
                </h2>
                {bundle.description && (
                  <p className={`text-sm ${bundle.imageUrl ? "text-white/90" : "text-muted-foreground"}`}>
                    {bundle.description}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className={`
                  flex-shrink-0 rounded-lg p-2 transition-colors
                  ${bundle.imageUrl
                    ? "bg-black/20 hover:bg-black/40 text-white"
                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Price Info */}
        <div className="flex-shrink-0 bg-card-secondary-background p-4 border-b border-white/10">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-3xl font-bold text-primary">
                £{bundleFixedPrice}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                £{bundle.pricePerPerson}/person • Serves {bundle.baseGuestCount} people
              </p>
            </div>
 
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              What's Included
            </h3>

            <div className="space-y-6">
              {Object.entries(itemsByRestaurant).map(([restaurantName, items]) => (
                <div key={restaurantName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {restaurantName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground">{restaurantName}</h4>
                  </div>

                  <div className="space-y-2 ml-10">
                    {items
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg bg-card-secondary-background p-3 border border-white/5"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {item.menuItemName}
                              </p>
                              {item.selectedAddons && item.selectedAddons.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {item.selectedAddons.map((addon) => (
                                    <p
                                      key={addon.addonId}
                                      className="text-xs text-muted-foreground"
                                    >
                                      + {addon.name} {addon.quantity > 1 && `(×${addon.quantity})`}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 ml-3">
                              <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                ×{item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer - Compact Layout */}
        <div className="flex-shrink-0 border-t border-white/10 p-4 bg-card-background space-y-3">
          {/* Quantity & Total Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-card-secondary-background text-foreground transition-colors hover:bg-white/5 hover:border-primary/30"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-base font-semibold text-foreground">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-card-secondary-background text-foreground transition-colors hover:bg-white/5 hover:border-primary/30"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs text-muted-foreground ml-1">
                ({bundle.baseGuestCount * quantity} ppl)
              </span>
            </div>
            {/* Total */}
            <span className="text-xl font-bold text-primary">
              ${bundleFixedPrice * quantity}
            </span>
          </div>

          {/* Buttons Row */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                onAdd(bundle.id, quantity);
                handleClose();
              }}
              className={`
                flex-1 rounded-lg px-4 py-2.5 font-semibold text-sm
                transition-all flex items-center justify-center gap-2
                ${
                  currentQuantity > 0
                    ? "bg-primary/10 text-primary border-2 border-primary"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }
              `}
            >
              {currentQuantity > 0 ? (
                quantity === 0 ? "Remove" : (
                  <>
                    <Check className="h-4 w-4" />
                    Update
                  </>
                )
              ) : (
                "Add to Session"
              )}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  eventId,
                  bundleId: bundle.id,
                  ...(sessionDate && { sessionDate }),
                  ...(sessionTime && { sessionTime }),
                });
                window.location.href = `https://swiftfood.uk/event-order?${params.toString()}`;
              }}
              className="rounded-lg px-4 py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-card-secondary-background text-foreground border border-white/10 hover:bg-white/5 hover:border-primary/30"
            >
              <Settings className="h-4 w-4" />
              Customize
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
