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
      <div className="rounded-2xl border border-white/10 bg-card-background p-12 sm:p-16 shadow-xl">
        <div className="flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Loading Catering</h3>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your catering information...</p>
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Catering Management
              </h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create meal sessions and select catering bundles for your event
            </p>
          </div>
          <button
            onClick={addMealSession}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Add Meal Session</span>
            <span className="sm:hidden">Add Session</span>
          </button>
        </div>

        {/* Event Info Summary - Enhanced cards */}
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-xl bg-card-background border border-white/5 p-4 hover:border-primary/30 transition-all hover:shadow-lg">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Delivery Address
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {eventData.address?.addressLine1 || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl bg-card-background border border-white/5 p-4 hover:border-primary/30 transition-all hover:shadow-lg">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Contact Email
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {eventData.owner?.user?.email || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl bg-card-background border border-white/5 p-4 hover:border-primary/30 transition-all hover:shadow-lg">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Contact Name
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {[eventData.owner?.user?.firstName, eventData.owner?.user?.lastName]
                      .filter(Boolean)
                      .join(" ") || eventData.owner?.user?.username || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl bg-card-background border border-white/5 p-4 hover:border-primary/30 transition-all hover:shadow-lg">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Available Bundles
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {bundles.length} {bundles.length === 1 ? 'bundle' : 'bundles'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Phone Input - Enhanced */}
          <div className="rounded-xl bg-card-background border border-white/5 p-5 hover:border-primary/20 transition-all">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              Contact Phone Number
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number for order updates"
              className="w-full rounded-lg border border-white/10 bg-card-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>
        </div>
      </div>

      {/* Meal Sessions */}
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card-background p-12 sm:p-16 shadow-lg">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 text-4xl sm:text-5xl">
              🍽️
            </div>
            <h3 className="mb-3 text-xl sm:text-2xl font-bold text-foreground">
              No meal sessions yet
            </h3>
            <p className="mb-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Create your first meal session to start planning the perfect catering experience for your event
            </p>
            <button
              onClick={addMealSession}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" />
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

      {/* Order Summary & Submit - Enhanced */}
      {sessions.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-card-background p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-primary/10 p-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              Order Summary
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            {sessions.map((session) => {
              const total = calculateSessionTotal(session);
              const selectedBundles = bundles.filter((b) =>
                session.selectedBundleIds.includes(b.id)
              );

              return (
                <div
                  key={session.id}
                  className="group rounded-xl border border-white/10 bg-card-secondary-background p-4 sm:p-5 hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary group-hover:animate-pulse"></div>
                        <p className="font-semibold text-foreground text-base sm:text-lg">{session.sessionName}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {session.sessionDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {session.eventTime}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBundles.map((b) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                          >
                            <Package className="h-3 w-3" />
                            {b.name} ({b.baseGuestCount} ppl)
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 self-end sm:self-auto">
                      <div className="rounded-xl bg-primary/10 px-4 py-2 border border-primary/20">
                        <p className="text-xl sm:text-2xl font-bold text-primary">
                          ${total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-t border-white/10 pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Total Amount
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-foreground">
                ${calculateGrandTotal().toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Place Order
                </span>
              )}
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
              ${(order.finalTotal || order.estimatedTotal || 0).toFixed(2)}
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Name</p>
              <p className="text-base text-foreground font-semibold break-words">{order.customerName}</p>
            </div>
            <div className="rounded-lg bg-card-secondary-background border border-white/5 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Email</p>
              <p className="text-base text-foreground font-semibold break-all">{order.customerEmail}</p>
            </div>
            <div className="rounded-lg bg-card-secondary-background border border-white/5 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Phone</p>
              <p className="text-base text-foreground font-semibold">{order.customerPhone}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card-background p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Delivery Information
            </h3>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg bg-card-secondary-background border border-white/5 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Address</p>
              <p className="text-base text-foreground font-semibold break-words leading-relaxed">{order.deliveryAddress}</p>
            </div>
            {order.specialRequirements && (
              <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-4">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 uppercase tracking-wide mb-2">
                      Special Requirements
                    </p>
                    <p className="text-sm text-foreground font-medium break-words leading-relaxed">{order.specialRequirements}</p>
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
              <div className="bg-primary/5 border-b border-white/10 p-5 sm:p-8">
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
                        <span className="text-sm font-semibold text-foreground">{formatDate(session.sessionDate)}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-lg bg-card-secondary-background border border-white/5 px-3 py-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{formatTime(session.eventTime)}</span>
                      </span>
                      {session.guestCount && (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-primary">{session.guestCount} guests</span>
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
                          <p className="text-sm text-foreground leading-relaxed">{session.specialRequirements}</p>
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

      {/* Payment Status - Enhanced */}
      {order.paymentStatus && (
        <div className="rounded-2xl border border-white/10 bg-card-background p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">Payment Information</h3>
          </div>
          <div className="rounded-xl bg-card-secondary-background border border-white/5 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Payment Status
              </span>
              <span className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wide w-fit border-2 ${
                order.paymentStatus === 'paid'
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : order.paymentStatus === 'failed' || order.paymentStatus === 'refunded'
                    ? 'bg-red-500/10 text-red-500 border-red-500/30'
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
              }`}>
                {order.paymentStatus === 'paid' && <CheckCircle2 className="h-4 w-4" />}
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
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
    <div className="rounded-2xl border border-white/10 bg-card-background overflow-hidden shadow-lg hover:shadow-xl transition-all">
      {/* Session Header - Enhanced */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 sm:p-5 border-b border-white/10 bg-primary/5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => onToggleExpanded(session.id)}
            className="flex-shrink-0 rounded-lg p-2 hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
          >
            {session.expanded ? (
              <ChevronUp className="h-5 w-5 text-primary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-primary" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={session.sessionName}
              onChange={(e) => onUpdate(session.id, { sessionName: e.target.value })}
              className="w-full bg-transparent border-none text-lg sm:text-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-3 py-2 hover:bg-white/5 transition-all"
              placeholder="Session name"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="rounded-xl bg-primary/10 px-4 py-2 border border-primary/20">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              ${sessionTotal.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => onRemove(session.id)}
            className="flex-shrink-0 rounded-lg p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all hover:scale-110 active:scale-95"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Session Content */}
      {session.expanded && (
        <div className="p-5 sm:p-6 lg:p-8 space-y-6">
          {/* Session Details Form - Enhanced */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="rounded-lg bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                Session Date
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={session.sessionDate}
                onChange={(e) => onUpdate(session.id, { sessionDate: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-card-secondary-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary/30"
                required
              />
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="rounded-lg bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                Event Time
                <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={session.eventTime}
                onChange={(e) => onUpdate(session.id, { eventTime: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-card-secondary-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary/30"
                required
              />
            </div>
          </div>

          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <div className="rounded-lg bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              Special Requirements
            </label>
            <textarea
              value={session.specialRequirements}
              onChange={(e) =>
                onUpdate(session.id, { specialRequirements: e.target.value })
              }
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-card-secondary-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary/30 resize-none"
              placeholder="Any dietary restrictions, allergies, or special instructions..."
            />
          </div>

          {/* Bundle Selection - Enhanced */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-primary/10 p-2">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-foreground">
                  Select Catering Bundles
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Each bundle has a fixed price and serves a specific number of guests
                </p>
              </div>
            </div>
            {bundles.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-card-secondary-background border border-white/5">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No bundles available</p>
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
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
