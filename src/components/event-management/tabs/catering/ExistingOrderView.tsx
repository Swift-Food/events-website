"use client";

import { useState } from "react";
import { CateringOrder } from "@/types/catering";
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  ShoppingCart,
  CheckCircle2,
  Package,
  Truck,
  Edit,
} from "lucide-react";
import { OrderTimeline } from "./OrderTimeline";
import { EditPickupContactModal } from "./EditPickupContactModal";
import { cateringService } from "@/services/catering.service";
import { toast } from "sonner";

interface ExistingOrderViewProps {
  order: CateringOrder;
}

export function ExistingOrderView({ order: initialOrder }: ExistingOrderViewProps) {
  const [order, setOrder] = useState<CateringOrder>(initialOrder);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  const handleSavePickupContact = async (data: {
    pickupContactName: string;
    pickupContactPhone: string;
  }) => {
    try {
      const updatedOrder = await cateringService.updatePickupContact({
        orderId: order.id,
        pickupContactName: data.pickupContactName,
        pickupContactPhone: data.pickupContactPhone,
      });
      setOrder(updatedOrder);
      toast.success("Pickup contact updated successfully!");
    } catch (error: any) {
      console.error("Error updating pickup contact:", error);
      toast.error(error.response?.data?.message || "Failed to update pickup contact");
      throw error;
    }
  };

  console.log("order data", JSON.stringify(order));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header - Enhanced */}
      <div className="rounded-2xl border border-white/10 bg-card-background p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Catering Order
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Placed on {formatDate(order.createdAt)}</span>
            </div>
          </div>
          <div className="rounded-xl bg-primary/10 px-6 py-4 border-2 border-primary/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Order Total
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-primary">
              £{(order.finalTotal || order.estimatedTotal || 0)}
            </p>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div className="rounded-xl bg-card-secondary-background border border-white/5 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="rounded-lg bg-primary/10 p-2">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">Order Status</h3>
          </div>
          <OrderTimeline status={order.status} />
        </div>
      </div>

      {/* Customer & Delivery Information - Enhanced */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-card-background p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Customer Information
            </h3>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg bg-card-secondary-background border border-white/5 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Name
              </p>
              <p className="text-base text-foreground font-semibold break-words">
                {order.customerName}
              </p>
            </div>
            <div className="rounded-lg bg-card-secondary-background border border-white/5 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Email
              </p>
              <p className="text-base text-foreground font-semibold break-all">
                {order.customerEmail}
              </p>
            </div>
            <div className="rounded-lg bg-card-secondary-background border border-white/5 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Phone
              </p>
              <p className="text-base text-foreground font-semibold">{order.customerPhone}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card-background p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Delivery Information
              </h3>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 px-3 py-2 text-sm font-medium text-primary transition-all"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Pickup</span>
            </button>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg bg-card-secondary-background border border-white/5 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Address
              </p>
              <p className="text-base text-foreground font-semibold break-words leading-relaxed">
                {order.deliveryAddress}
              </p>
            </div>

            {/* Pickup Contact Information */}
            {(order.pickupContactName || order.pickupContactPhone || order.pickupContactEmail) && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-start gap-2 mb-3">
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">
                    Pickup Contact Information
                  </p>
                </div>
                <div className="space-y-3 ml-8">
                  {order.pickupContactName && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="text-sm text-foreground font-semibold">
                        {order.pickupContactName}
                      </p>
                    </div>
                  )}
                  {order.pickupContactPhone && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <p className="text-sm text-foreground font-semibold">
                        {order.pickupContactPhone}
                      </p>
                    </div>
                  )}
                  {order.pickupContactEmail && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="text-sm text-foreground font-semibold break-all">
                        {order.pickupContactEmail}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.specialRequirements && (
              <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-4">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 uppercase tracking-wide mb-2">
                      Special Requirements
                    </p>
                    <p className="text-sm text-foreground font-medium break-words leading-relaxed">
                      {order.specialRequirements}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meal Sessions - Enhanced */}
      {order.mealSessions && order.mealSessions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="rounded-xl bg-primary/10 p-2">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">Meal Sessions</h3>
          </div>
          {order.mealSessions.map((session, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-card-background overflow-hidden shadow-lg hover:shadow-xl transition-all"
            >
              {/* Session Header - Enhanced */}
              <div className="bg-primary/10 border-b border-white/10 p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 border border-primary/30">
                        <span className="text-lg font-bold text-primary">{index + 1}</span>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-bold text-foreground">
                        {session.sessionName || `Meal Session ${index + 1}`}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <span className="inline-flex items-center gap-2 rounded-lg bg-card-secondary-background border border-white/5 px-3 py-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          {formatDate(session.sessionDate)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-lg bg-card-secondary-background border border-white/5 px-3 py-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          {formatTime(session.eventTime)}
                        </span>
                      </span>
                      {session.guestCount && (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-primary">
                            {session.guestCount} guests
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {session.specialRequirements && (
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-yellow-500/10 p-2">
                          <Mail className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wide mb-2">
                            Special Requirements
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {session.specialRequirements}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              {session.orderItems && session.orderItems.length > 0 && (
                <div className="p-4 sm:p-6">
                  <div className="space-y-6">
                    {session.orderItems.map((restaurant, rIndex) => (
                      <div key={rIndex} className="space-y-3">
                        {/* Restaurant Header */}
                        <div className="flex items-center justify-between pb-2 border-b-2 border-primary/20">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-primary/10 p-2">
                              <ShoppingCart className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-base font-bold text-foreground">
                                {restaurant.restaurantName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {restaurant.menuItems.length}{" "}
                                {restaurant.menuItems.length === 1 ? "item" : "items"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items List */}
                        <div className="space-y-3">
                          {restaurant.menuItems.map((item, iIndex) => (
                            <div
                              key={iIndex}
                              className="group relative rounded-lg border border-white/10 bg-card-secondary-background p-4 hover:border-primary/30 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                      {iIndex + 1}
                                    </span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-foreground">
                                          {item.menuItemName}
                                        </p>
                                        {item.groupTitle && (
                                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                            {item.groupTitle}
                                          </span>
                                        )}
                                      </div>

                                      {/* Add-ons */}
                                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            Add-ons
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {item.selectedAddons.map((addon, aIndex) => (
                                              <div
                                                key={aIndex}
                                                className="flex items-center gap-1.5 rounded-md bg-card-background px-2 py-1 text-xs"
                                              >
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                <span className="text-foreground font-medium">
                                                  {addon.name}
                                                </span>
                                                {addon.quantity > 1 && (
                                                  <span className="text-muted-foreground">
                                                    ×{addon.quantity}
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Quantity Badge */}
                                <div className="flex-shrink-0">
                                  <div className="rounded-lg bg-primary/10 px-1 py-1 border border-primary/20">
                                    <span className="text-sm font-bold text-primary">
                                      ×{item.quantity}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Restaurant Special Instructions */}
                        {restaurant.specialInstructions && (
                          <div className="mt-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
                            <div className="flex items-start gap-2">
                              <div className="rounded-md bg-yellow-500/10 p-1">
                                <Mail className="h-3.5 w-3.5 text-yellow-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 mb-1">
                                  Special Instructions
                                </p>
                                <p className="text-xs text-foreground/80">
                                  {restaurant.specialInstructions}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Status - Enhanced */}
      {order.paymentStatus && (
        <div className="rounded-2xl border border-white/10 bg-card-background p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Payment Information
            </h3>
          </div>
          <div className="rounded-xl bg-card-secondary-background border border-white/5 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Payment Status
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wide w-fit border-2 ${
                  order.paymentStatus === "paid"
                    ? "bg-green-500/10 text-green-500 border-green-500/30"
                    : order.paymentStatus === "failed" || order.paymentStatus === "refunded"
                      ? "bg-red-500/10 text-red-500 border-red-500/30"
                      : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                }`}
              >
                {order.paymentStatus === "paid" && <CheckCircle2 className="h-4 w-4" />}
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pickup Contact Modal */}
      <EditPickupContactModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSavePickupContact}
        initialData={{
          pickupContactName: order.pickupContactName,
          pickupContactPhone: order.pickupContactPhone,
        }}
      />
    </div>
  );
}
