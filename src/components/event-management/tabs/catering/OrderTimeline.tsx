"use client";

import { CateringOrder } from "@/types/catering";
import { Circle, CheckCircle2, Package, Truck } from "lucide-react";

interface OrderTimelineProps {
  status: CateringOrder["status"];
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  const timelineSteps = [
    { key: "pending_review", label: "Order Placed", shortLabel: "", icon: Circle },
    { key: "restaurant_reviewed", label: "Confirmed", shortLabel: "", icon: CheckCircle2 },
    { key: "paid", label: "Preparing", shortLabel: "", icon: Package },
    { key: "ready", label: "Delivery", shortLabel: "", icon: Truck },
    { key: "completed", label: "Delivered", shortLabel: "", icon: CheckCircle2  },
  ];
  console.log("status", status)
  const statusIndex = timelineSteps.findIndex((step) => step.key === status);
  const isCancelled = status === "cancelled";

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {timelineSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= statusIndex;
          const isCurrent = index === statusIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className="relative flex items-center w-full">
                {index > 0 && (
                  <div
                    className={`flex-1 h-1 ${
                      isCompleted && !isCancelled ? "bg-primary" : "bg-white/10"
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                    isCancelled
                      ? "border-red-500 bg-red-500/10"
                      : isCompleted
                        ? "border-primary bg-primary/20"
                        : "border-white/20 bg-card-secondary-background"
                  } ${isCurrent && !isCancelled ? "ring-2 sm:ring-4 ring-primary/20" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      isCancelled
                        ? "text-red-500"
                        : isCompleted
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  />
                </div>
                {index < timelineSteps.length - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      isCompleted && !isCancelled ? "bg-primary" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
              <div className="mt-2 text-center px-1">
                <p
                  className={`text-xs font-medium ${
                    isCancelled
                      ? "text-red-500"
                      : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {isCancelled && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-500">
            Order Cancelled
          </span>
        </div>
      )}
    </div>
  );
}
