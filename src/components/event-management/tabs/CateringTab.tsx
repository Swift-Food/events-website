"use client";

import { useState, useEffect } from "react";
import { EventResponseDto } from "@/types";
import { cateringService } from "@/services/catering.service";
import {
  CateringBundle,
  MealSession,
  MinimalRestaurantOrder,
  MinimalMenuItem,
  CreateCateringOrderDto,
  CateringOrder,
} from "@/types/catering";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Package,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { BundleDetailsModal } from "../BundleDetailsModal";

interface CateringTabProps {
  eventData: EventResponseDto;
}

interface MealSessionFormData {
  id: string; // Temporary ID for UI management
  sessionName: string;
  sessionDate: string;
  eventTime: string;
  collectionTime: string;

  specialRequirements: string;
  selectedBundleIds: string[];
  expanded: boolean;
}

export function CateringTab({ eventData }: CateringTabProps) {
  const [bundles, setBundles] = useState<CateringBundle[]>([]);
  const [sessions, setSessions] = useState<MealSessionFormData[]>([]);
  const [isLoadingBundles, setIsLoadingBundles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<CateringBundle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [existingOrder, setExistingOrder] = useState<CateringOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);

  // Fetch bundles on mount
  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setIsLoadingBundles(true);
        const data = await cateringService.getActiveBundles();
        setBundles(data);
      } catch (error: any) {
        console.error("Error fetching bundles:", error);
        toast.error(error.response?.data?.message || "Failed to load catering bundles");
      } finally {
        setIsLoadingBundles(false);
      }
    };

    fetchBundles();
  }, []);

  // Fetch existing catering order on mount
  useEffect(() => {
    const fetchExistingOrder = async () => {
      try {
        setIsLoadingOrder(true);
        const order = await cateringService.getCateringOrderForEvent(eventData.id);
        setExistingOrder(order);
      } catch (error: any) {
        console.error("Error fetching catering order:", error);
        // Don't show error toast if it's just a 404 (no order exists)
        if (error.response?.status !== 404) {
          toast.error(error.response?.data?.message || "Failed to load catering order");
        }
      } finally {
        setIsLoadingOrder(false);
      }
    };

    fetchExistingOrder();
  }, [eventData.id]);

  const addMealSession = () => {
    const newSession: MealSessionFormData = {
      id: `session-${Date.now()}`,
      sessionName: `Meal Session ${sessions.length + 1}`,
      sessionDate: "",
      eventTime: "",
      collectionTime: "",
      specialRequirements: "",
      selectedBundleIds: [],
      expanded: true,
    };
    setSessions([...sessions, newSession]);
  };

  const removeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
  };

  const updateSession = (sessionId: string, updates: Partial<MealSessionFormData>) => {
    setSessions(
      sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
    );
  };

  const toggleSessionExpanded = (sessionId: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, expanded: !s.expanded } : s
      )
    );
  };

  const toggleBundleSelection = (sessionId: string, bundleId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const isSelected = session.selectedBundleIds.includes(bundleId);
    const updatedBundleIds = isSelected
      ? session.selectedBundleIds.filter((id) => id !== bundleId)
      : [...session.selectedBundleIds, bundleId];

    updateSession(sessionId, { selectedBundleIds: updatedBundleIds });
  };

  const openBundleModal = (sessionId: string, bundle: CateringBundle) => {
    setCurrentSessionId(sessionId);
    setSelectedBundle(bundle);
    setIsModalOpen(true);
  };

  const closeBundleModal = () => {
    setIsModalOpen(false);
    setSelectedBundle(null);
    setCurrentSessionId(null);
  };

  const handleAddBundle = (bundleId: string) => {
    if (currentSessionId) {
      toggleBundleSelection(currentSessionId, bundleId);
    }
  };

  const calculateSessionTotal = (session: MealSessionFormData): number => {
    const selectedBundles = bundles.filter((b) =>
      session.selectedBundleIds.includes(b.id)
    );

    // Each bundle has a fixed price based on its baseGuestCount
    return selectedBundles.reduce(
      (sum, bundle) => sum + (bundle.pricePerPerson * bundle.baseGuestCount),
      0
    );
  };

  const calculateGrandTotal = (): number => {
    return sessions.reduce((total, session) => total + calculateSessionTotal(session), 0);
  };

  const transformSessionToMealSession = (session: MealSessionFormData): MealSession => {
    // Get all selected bundles for this session
    const selectedBundles = bundles.filter((b) =>
      session.selectedBundleIds.includes(b.id)
    );

    // Group items by restaurant
    const restaurantMap = new Map<string, MinimalRestaurantOrder>();

    selectedBundles.forEach((bundle) => {
      bundle.items.forEach((item) => {
        if (!restaurantMap.has(item.restaurantId)) {
          restaurantMap.set(item.restaurantId, {
            restaurantName: item.restaurantName,
            restaurantId: item.restaurantId,
            menuItems: [],
          });
        }

        const restaurant = restaurantMap.get(item.restaurantId)!;

        // Use the bundle's fixed quantity (already designed for baseGuestCount)
        const menuItem: MinimalMenuItem = {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          selectedAddons: item.selectedAddons,
          menuItemName: item.menuItemName,
        };

        restaurant.menuItems.push(menuItem);
      });
    });

    return {
      sessionName: session.sessionName,
      sessionDate: session.sessionDate,
      eventTime: session.eventTime,
      collectionTime: session.collectionTime || undefined,
      specialRequirements: session.specialRequirements || undefined,
      orderItems: Array.from(restaurantMap.values()),
    };
  };

  const handleSubmitOrder = async () => {
    // Validation
    if (sessions.length === 0) {
      toast.error("Please add at least one meal session");
      return;
    }

    if (!customerPhone || customerPhone.trim() === "") {
      toast.error("Please provide a contact phone number");
      return;
    }

    for (const session of sessions) {
      if (!session.sessionDate) {
        toast.error(`Please set a date for ${session.sessionName}`);
        return;
      }
      if (!session.eventTime) {
        toast.error(`Please set a time for ${session.sessionName}`);
        return;
      }
      if (session.selectedBundleIds.length === 0) {
        toast.error(`Please select at least one bundle for ${session.sessionName}`);
        return;
      }
    }

    if (!eventData.address) {
      toast.error("Event address is required for catering orders");
      return;
    }

    if (!eventData.owner?.user) {
      toast.error("Event owner information is missing");
      return;
    }

    try {
      setIsSubmitting(true);

      const deliveryAddress = [
        eventData.address.addressLine1,
        eventData.address.addressLine2,
        eventData.address.city,
        eventData.address.zipcode,
      ]
        .filter(Boolean)
        .join(", ");

      const customerName = [
        eventData.owner.user.firstName,
        eventData.owner.user.lastName,
      ]
        .filter(Boolean)
        .join(" ") || eventData.name;

      const orderData: CreateCateringOrderDto = {
        userId: eventData.owner.user.id,
        customerName,
        customerEmail: eventData.owner.user.email,
        customerPhone: customerPhone.trim(),
        deliveryAddress,
        eventId: eventData.id,
        mealSessions: sessions.map(transformSessionToMealSession),
        estimatedTotal: calculateGrandTotal(),
      };

      await cateringService.createOrder(orderData);
      toast.success("Catering order created successfully!");

      // Fetch the updated order
      const updatedOrder = await cateringService.getCateringOrderForEvent(eventData.id);
      setExistingOrder(updatedOrder);

      // Reset form after successful order
      setSessions([]);
      setCustomerPhone("");
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.message || "Failed to create catering order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingBundles || isLoadingOrder) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card-background p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading catering information...</p>
          </div>
        </div>
      </div>
    );
  }

  // If an order already exists, show the order details instead of the form
  if (existingOrder) {
    return <ExistingOrderView order={existingOrder} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-card-background p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Catering Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Add meal sessions and select catering bundles for your event
            </p>
          </div>
          <button
            onClick={addMealSession}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Meal Session
          </button>
        </div>

        {/* Event Info Summary */}
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-lg bg-card-secondary-background p-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Delivery Address</p>
                <p className="text-sm text-foreground">
                  {eventData.address?.addressLine1 || "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Contact Email</p>
                <p className="text-sm text-foreground">
                  {eventData.owner?.user?.email || "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Contact Name</p>
                <p className="text-sm text-foreground">
                  {[eventData.owner?.user?.firstName, eventData.owner?.user?.lastName]
                    .filter(Boolean)
                    .join(" ") || eventData.owner?.user?.username || "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShoppingCart className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Available Bundles</p>
                <p className="text-sm text-foreground">{bundles.length} bundles</p>
              </div>
            </div>
          </div>

          {/* Contact Phone Input */}
          <div className="rounded-lg bg-card-secondary-background p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              Contact Phone Number *
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number for order updates"
              className="w-full rounded-lg border border-white/10 bg-card-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>
      </div>

      {/* Meal Sessions */}
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card-background p-12">
          <div className="text-center">
            <div className="mb-4 text-4xl">🍽️</div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              No meal sessions yet
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Add a meal session to start planning your catering
            </p>
            <button
              onClick={addMealSession}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add First Meal Session
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <MealSessionCard
              key={session.id}
              session={session}
              bundles={bundles}
              onUpdate={updateSession}
              onRemove={removeSession}
              onToggleExpanded={toggleSessionExpanded}
              onOpenBundleModal={openBundleModal}
              sessionTotal={calculateSessionTotal(session)}
            />
          ))}
        </div>
      )}

      {/* Order Summary & Submit */}
      {sessions.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-card-background p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Order Summary
          </h3>

          <div className="space-y-3 mb-6">
            {sessions.map((session) => {
              const total = calculateSessionTotal(session);
              const selectedBundles = bundles.filter((b) =>
                session.selectedBundleIds.includes(b.id)
              );

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg bg-card-secondary-background p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{session.sessionName}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.sessionDate} at {session.eventTime}
                     
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedBundles.map((b) => `${b.name} (${b.baseGuestCount} ppl)`).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">
                      ${total.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-foreground">
                ${calculateGrandTotal().toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding Order..." : "Add Order"}
            </button>
          </div>
        </div>
      )}

      {/* Bundle Details Modal */}
      <BundleDetailsModal
        bundle={selectedBundle}
        isOpen={isModalOpen}
        onClose={closeBundleModal}
        onAdd={handleAddBundle}
        isSelected={
          selectedBundle && currentSessionId
            ? sessions
                .find((s) => s.id === currentSessionId)
                ?.selectedBundleIds.includes(selectedBundle.id) || false
            : false
        }
      />
    </div>
  );
}

// Timeline component for order status
interface OrderTimelineProps {
  status: CateringOrder['status'];
}

function OrderTimeline({ status }: OrderTimelineProps) {
  const timelineSteps = [
    { key: 'pending', label: 'Order Placed', shortLabel: 'Placed', icon: Circle },
    { key: 'confirmed', label: 'Confirmed', shortLabel: 'Confirmed', icon: CheckCircle2 },
    { key: 'preparing', label: 'Preparing', shortLabel: 'Preparing', icon: Package },
    { key: 'ready', label: 'Ready', shortLabel: 'Ready', icon: CheckCircle2 },
    { key: 'delivered', label: 'Delivered', shortLabel: 'Delivered', icon: Truck },
  ];

  const statusIndex = timelineSteps.findIndex(step => step.key === status);
  const isCancelled = status === 'cancelled';

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
                      isCompleted && !isCancelled ? 'bg-primary' : 'bg-white/10'
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                    isCancelled
                      ? 'border-red-500 bg-red-500/10'
                      : isCompleted
                        ? 'border-primary bg-primary/20'
                        : 'border-white/20 bg-card-secondary-background'
                  } ${isCurrent && !isCancelled ? 'ring-2 sm:ring-4 ring-primary/20' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      isCancelled
                        ? 'text-red-500'
                        : isCompleted
                          ? 'text-primary'
                          : 'text-muted-foreground'
                    }`}
                  />
                </div>
                {index < timelineSteps.length - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      isCompleted && !isCancelled ? 'bg-primary' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
              <div className="mt-2 text-center px-1">
                <p
                  className={`text-xs font-medium ${
                    isCancelled
                      ? 'text-red-500'
                      : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
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

// Existing Order View Component
interface ExistingOrderViewProps {
  order: CateringOrder;
}

function ExistingOrderView({ order }: ExistingOrderViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };
  console.log("order data", JSON.stringify(order))

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-card-background p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Catering Order Details
            </h2>
            <p className="text-sm text-muted-foreground">
              Order placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-muted-foreground mb-1">Order Total</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              ${(order.finalTotal || order.estimatedTotal || 0)}
            </p>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div className="rounded-lg bg-card-secondary-background p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-6">Order Status</h3>
          <OrderTimeline status={order.status} />
        </div>
      </div>

      {/* Customer & Delivery Information */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-card-background p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary flex-shrink-0" />
            Customer Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="text-sm text-foreground font-medium break-words">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <p className="text-sm text-foreground font-medium break-all">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="text-sm text-foreground font-medium">{order.customerPhone}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card-background p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            Delivery Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <p className="text-sm text-foreground font-medium break-words">{order.deliveryAddress}</p>
            </div>
            {order.specialRequirements && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Special Requirements</p>
                <p className="text-sm text-foreground font-medium break-words">{order.specialRequirements}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meal Sessions */}
      {order.mealSessions && order.mealSessions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg sm:text-xl font-bold text-foreground px-2">Meal Sessions</h3>
          {order.mealSessions.map((session, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-card-background overflow-hidden"
            >
              {/* Session Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-white/10 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                      {session.sessionName || `Meal Session ${index + 1}`}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="font-medium">{formatDate(session.sessionDate)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="font-medium">{formatTime(session.eventTime)}</span>
                      </span>
                      {session.guestCount && (
                        <span className="flex items-center gap-1.5">
                          <ShoppingCart className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="font-medium">{session.guestCount} guests</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {session.specialRequirements && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-start gap-2">
                      <div className="rounded-md bg-primary/10 p-1.5">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-primary mb-1">Special Requirements</p>
                        <p className="text-sm text-foreground">{session.specialRequirements}</p>
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
                                {restaurant.menuItems.length} {restaurant.menuItems.length === 1 ? 'item' : 'items'}
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

      {/* Payment Status */}
      {order.paymentStatus && (
        <div className="rounded-2xl border border-white/10 bg-card-background p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Payment Information</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm text-muted-foreground">Payment Status:</span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold w-fit ${
              order.paymentStatus === 'paid'
                ? 'bg-green-500/10 text-green-500'
                : order.paymentStatus === 'failed' || order.paymentStatus === 'refunded'
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-yellow-500/10 text-yellow-500'
            }`}>
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface MealSessionCardProps {
  session: MealSessionFormData;
  bundles: CateringBundle[];
  onUpdate: (sessionId: string, updates: Partial<MealSessionFormData>) => void;
  onRemove: (sessionId: string) => void;
  onToggleExpanded: (sessionId: string) => void;
  onOpenBundleModal: (sessionId: string, bundle: CateringBundle) => void;
  sessionTotal: number;
}

function MealSessionCard({
  session,
  bundles,
  onUpdate,
  onRemove,
  onToggleExpanded,
  onOpenBundleModal,
  sessionTotal,
}: MealSessionCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card-background overflow-hidden">
      {/* Session Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => onToggleExpanded(session.id)}
            className="rounded-lg p-1 hover:bg-white/5 transition-colors"
          >
            {session.expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <input
            type="text"
            value={session.sessionName}
            onChange={(e) => onUpdate(session.id, { sessionName: e.target.value })}
            className="bg-transparent border-none text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            placeholder="Session name"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-semibold text-foreground">
              ${sessionTotal.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => onRemove(session.id)}
            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Session Content */}
      {session.expanded && (
        <div className="p-6 space-y-6">
          {/* Session Details Form */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={session.sessionDate}
                onChange={(e) => onUpdate(session.id, { sessionDate: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-card-secondary-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Event Time *
              </label>
              <input
                type="time"
                value={session.eventTime}
                onChange={(e) => onUpdate(session.id, { eventTime: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-card-secondary-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>


          </div>


          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Special Requirements
            </label>
            <textarea
              value={session.specialRequirements}
              onChange={(e) =>
                onUpdate(session.id, { specialRequirements: e.target.value })
              }
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-card-secondary-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Any dietary restrictions, allergies, or special instructions..."
            />
          </div>

          {/* Bundle Selection */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Select Catering Bundles
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Each bundle has a fixed price and serves a specific number of guests
                </p>
              </div>
            </div>
            {bundles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bundles available
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bundles.map((bundle) => {
                  const isSelected = session.selectedBundleIds.includes(bundle.id);
                  const bundleFixedPrice = bundle.pricePerPerson * bundle.baseGuestCount;

                  return (
                    <div
                      key={bundle.id}
                      onClick={() => onOpenBundleModal(session.id, bundle)}
                      className={`cursor-pointer rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-white/10 bg-card-secondary-background hover:border-white/20"
                      }`}
                    >
                      {bundle.imageUrl && (
                        <div className="relative h-32 w-full">
                          <Image
                            src={bundle.imageUrl}
                            alt={bundle.name}
                            fill
                            className="object-cover rounded-t-lg"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-foreground">
                            {bundle.name}
                          </h5>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                              <svg
                                className="h-3 w-3 text-white"
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
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {bundle.description}
                          </p>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-between">
                            <p className="text-lg font-bold text-primary">
                              ${bundleFixedPrice}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {bundle.items.length} items
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ${bundle.pricePerPerson}/person • Serves {bundle.baseGuestCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
