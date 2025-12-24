"use client";

import { CateringBundle } from "@/types/catering";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";

interface BundleCardProps {
  bundle: CateringBundle;
  isSelected: boolean;
  onClick: () => void;
}

export function BundleCard({ bundle, isSelected, onClick }: BundleCardProps) {
  const bundleFixedPrice = bundle.pricePerPerson * bundle.baseGuestCount;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border-2 transition-all hover:shadow-xl overflow-hidden ${
        isSelected
          ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
          : "border-white/10 bg-card-secondary-background hover:border-primary/30 hover:scale-[1.02]"
      }`}
    >
      {bundle.imageUrl && (
        <div className="relative h-40 w-full overflow-hidden">
          <Image
            src={bundle.imageUrl}
            alt={bundle.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {isSelected && (
            <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-primary shadow-lg flex items-center justify-center animate-in zoom-in">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h5 className="font-bold text-foreground text-base leading-tight flex-1">
            {bundle.name}
          </h5>
          {isSelected && !bundle.imageUrl && (
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>
        {bundle.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {bundle.description}
          </p>
        )}
        <div className="space-y-2 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-primary">
              ${bundleFixedPrice.toFixed(2)}
            </p>
            <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1">
              <ShoppingCart className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {bundle.items.length} items
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">${bundle.pricePerPerson}/person</span>
            <span className="text-primary">•</span>
            <span className="font-medium">Serves {bundle.baseGuestCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
