"use client";

import { useState, useEffect, useCallback } from "react";
import { EventResponseDto } from "@/types";
import { cateringService } from "@/services/catering.service";
import {
  CateringBundle,
  MealSession,
  MinimalRestaurantOrder,
  MinimalMenuItem,
  CreateCateringOrderDto,
  CateringOrder,
  CateringPricingResult,
  MealSessionRequest,
} from "@/types/catering";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ShoppingCart,
  CheckCircle2,
  Package,
  Clock,
} from "lucide-react";
import { BundleDetailsModal } from "../BundleDetailsModal";
import { ExistingOrderView, MealSessionCard } from "./catering";

interface CateringTabProps {
  eventData: EventResponseDto;
}

interface MealSessionFormData {
  id: string;
  sessionName: string;
  sessionDate: string;
  eventTime: string;
  collectionTime: string;
  specialRequirements: string;
  bundleQuantities: Record<string, number>;
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
  const [pricing, setPricing] = useState<CateringPricingResult | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);

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
        if (error.response?.status !== 404) {
          toast.error(error.response?.data?.message || "Failed to load catering order");
        }
      } finally {
        setIsLoadingOrder(false);
      }
    };

    fetchExistingOrder();
  }, [eventData.id]);

  // Auto-add a meal session when there are no sessions and no existing order
  useEffect(() => {
    if (!isLoadingBundles && !isLoadingOrder && !existingOrder && sessions.length === 0) {
      const eventStartDate = new Date(eventData.startDateTime);
      const formattedDate = eventStartDate.toISOString().split("T")[0];

      const newSession: MealSessionFormData = {
        id: `session-${Date.now()}`,
        sessionName: eventData.name,
        sessionDate: formattedDate,
        eventTime: "",
        collectionTime: "",
        specialRequirements: "",
        bundleQuantities: {},
        expanded: true,
      };
      setSessions([newSession]);
    }
  }, [isLoadingBundles, isLoadingOrder, existingOrder, eventData.startDateTime, eventData.name]);

  const addMealSession = () => {
    const newSession: MealSessionFormData = {
      id: `session-${Date.now()}`,
      sessionName: `Meal Session ${sessions.length + 1}`,
      sessionDate: "",
      eventTime: "",
      collectionTime: "",
      specialRequirements: "",
      bundleQuantities: {},
      expanded: true,
    };
    setSessions([...sessions, newSession]);
  };

  const removeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
  };

  const updateSession = (sessionId: string, updates: Partial<MealSessionFormData>) => {
    setSessions(sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)));
  };

  const toggleSessionExpanded = (sessionId: string) => {
    setSessions(sessions.map((s) => (s.id === sessionId ? { ...s, expanded: !s.expanded } : s)));
  };

  const updateBundleQuantity = (sessionId: string, bundleId: string, quantity: number) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const updatedQuantities = { ...session.bundleQuantities };
    if (quantity <= 0) {
      delete updatedQuantities[bundleId];
    } else {
      updatedQuantities[bundleId] = quantity;
    }

    updateSession(sessionId, { bundleQuantities: updatedQuantities });
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

  const handleAddBundle = (bundleId: string, quantity: number) => {
    if (currentSessionId) {
      updateBundleQuantity(currentSessionId, bundleId, quantity);
    }
  };

  const calculateSessionTotal = (session: MealSessionFormData): number => {
    return Object.entries(session.bundleQuantities).reduce((sum, [bundleId, quantity]) => {
      const bundle = bundles.find((b) => b.id === bundleId);
      if (!bundle) return sum;
      return sum + bundle.pricePerPerson * bundle.baseGuestCount * quantity;
    }, 0);
  };

  const calculateGrandTotal = (): number => {
    return sessions.reduce((total, session) => total + calculateSessionTotal(session), 0);
  };

  // Transform session to pricing API request format
  const transformSessionToPricingRequest = useCallback(
    (session: MealSessionFormData): MealSessionRequest | null => {
      if (Object.keys(session.bundleQuantities).length === 0) return null;

      const restaurantMap = new Map<string, { restaurantId: string; menuItems: { menuItemId: string; quantity: number; selectedAddons?: { name: string; quantity: number; groupTitle?: string }[] }[] }>();

      Object.entries(session.bundleQuantities).forEach(([bundleId, bundleQuantity]) => {
        const bundle = bundles.find((b) => b.id === bundleId);
        if (!bundle) return;

        bundle.items.forEach((item) => {
          if (!restaurantMap.has(item.restaurantId)) {
            restaurantMap.set(item.restaurantId, {
              restaurantId: item.restaurantId,
              menuItems: [],
            });
          }

          const restaurant = restaurantMap.get(item.restaurantId)!;
          restaurant.menuItems.push({
            menuItemId: item.menuItemId,
            quantity: item.quantity * bundleQuantity,
            selectedAddons: item.selectedAddons?.map((addon) => ({
              name: addon.name,
              quantity: addon.quantity,
            })),
          });
        });
      });

      return {
        sessionName: session.sessionName || "Meal Session",
        sessionDate: session.sessionDate || new Date().toISOString().split("T")[0],
        eventTime: session.eventTime || "12:00",
        specialRequirements: session.specialRequirements || undefined,
        orderItems: Array.from(restaurantMap.values()),
      };
    },
    [bundles]
  );

  // Fetch pricing when sessions or bundles change
  useEffect(() => {
    const fetchPricing = async () => {
      // Only fetch if there are sessions with bundles selected
      const hasSelectedBundles = sessions.some(
        (s) => Object.keys(s.bundleQuantities).length > 0
      );

      if (!hasSelectedBundles) {
        setPricing(null);
        return;
      }

      const mealSessions = sessions
        .map(transformSessionToPricingRequest)
        .filter((s): s is MealSessionRequest => s !== null);

      if (mealSessions.length === 0) {
        setPricing(null);
        return;
      }

      // Get delivery location from event address if available
      const deliveryLocation = eventData.address?.location?.latitude && eventData.address?.location?.longitude
        ? { latitude: eventData.address.location.latitude, longitude: eventData.address.location.longitude }
        : undefined;

      try {
        setIsLoadingPricing(true);
        const result = await cateringService.calculatePricing({
          mealSessions,
          deliveryLocation,
        });
        console.log("result is", JSON.stringify(result))
        console.log("result is", JSON.stringify(result.totalDiscount))
        console.log("the type is", typeof(pricing?.totalDiscount))
        setPricing(result);
      } catch (error) {
        console.error("Error fetching pricing:", error);
        setPricing(null);
      } finally {
        setIsLoadingPricing(false);
      }
    };

    // Debounce the pricing fetch
    const timeoutId = setTimeout(fetchPricing, 500);
    return () => clearTimeout(timeoutId);
  }, [sessions, bundles, eventData.address, transformSessionToPricingRequest]);

  const transformSessionToMealSession = (session: MealSessionFormData): MealSession => {
    const restaurantMap = new Map<string, MinimalRestaurantOrder>();

    Object.entries(session.bundleQuantities).forEach(([bundleId, bundleQuantity]) => {
      const bundle = bundles.find((b) => b.id === bundleId);
      if (!bundle) return;

      bundle.items.forEach((item) => {
        if (!restaurantMap.has(item.restaurantId)) {
          restaurantMap.set(item.restaurantId, {
            restaurantName: item.restaurantName,
            restaurantId: item.restaurantId,
            menuItems: [],
          });
        }

        const restaurant = restaurantMap.get(item.restaurantId)!;
        const menuItem: MinimalMenuItem = {
          menuItemId: item.menuItemId,
          quantity: item.quantity * bundleQuantity,
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
      if (Object.keys(session.bundleQuantities).length === 0) {
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

      const customerName =
        [eventData.owner.user.firstName, eventData.owner.user.lastName]
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
      <div className="rounded-xl border border-white/10 bg-card-background p-8 sm:p-12">
        <div className="flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Loading Catering</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we fetch your catering information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (existingOrder) {
    return <ExistingOrderView order={existingOrder} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Catering Management
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Create meal sessions and select catering bundles for your event
            </p>
          </div>
          <button
            onClick={addMealSession}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Meal Session</span>
            <span className="sm:hidden">Add Session</span>
          </button>
        </div>

        {/* Event Info Summary */}
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
                      .join(" ") ||
                      eventData.owner?.user?.username ||
                      "Not set"}
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
                    {bundles.length} {bundles.length === 1 ? "bundle" : "bundles"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Phone Input */}
          <div className="rounded-xl bg-gradient-to-br from-card-secondary-background to-card-background border border-white/5 p-5 hover:border-primary/20 transition-all">
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
        <div className="rounded-xl border border-white/10 bg-card-background p-8 sm:p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-2xl">
              🍽️
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              No meal sessions yet
            </h3>
            <p className="mb-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Create your first meal session to start planning the perfect catering experience for
              your event
            </p>
            <button
              onClick={addMealSession}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Meal Session
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
              eventId={eventData.id}
            />
          ))}
        </div>
      )}

      {/* Order Summary & Submit */}
      {sessions.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-card-background p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">Order Summary</h3>
          </div>

          <div className="space-y-2 mb-4">
            {sessions.map((session) => {
              const total = calculateSessionTotal(session);
              const selectedBundlesWithQuantity = Object.entries(session.bundleQuantities)
                .map(([bundleId, quantity]) => ({
                  bundle: bundles.find((b) => b.id === bundleId),
                  quantity,
                }))
                .filter((item) => item.bundle);

              return (
                <div
                  key={session.id}
                  className="rounded-lg border border-white/10 bg-card-secondary-background p-3 sm:p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary group-hover:animate-pulse"></div>
                        <p className="font-semibold text-foreground text-base sm:text-lg">
                          {session.sessionName}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {session.sessionDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.eventTime}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedBundlesWithQuantity.map(({ bundle, quantity }) => (
                          <span
                            key={bundle!.id}
                            className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                          >
                            {quantity}× {bundle!.name} ({bundle!.baseGuestCount * quantity} ppl)
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-base font-semibold text-primary">
                        ${total}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">
                ${pricing?.subtotal ?? calculateGrandTotal()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              {isLoadingPricing ? (
                <span className="text-muted-foreground">Calculating...</span>
              ) : pricing?.deliveryFee !== undefined ? (
                <span className="text-foreground">${pricing.deliveryFee.toFixed(2)}</span>
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </div>
            {pricing &&(pricing.totalDiscount ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-400">Discount</span>
                <span className="text-green-400">-${pricing.totalDiscount}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="font-semibold text-foreground">Total</span>
              {isLoadingPricing ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              ) : (
                <span className="text-xl font-bold text-primary">
                  ${pricing?.total ?? calculateGrandTotal()}
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || isLoadingPricing}
              className="w-full sm:w-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
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
        currentQuantity={
          selectedBundle && currentSessionId
            ? sessions.find((s) => s.id === currentSessionId)?.bundleQuantities[selectedBundle.id] || 0
            : 0
        }
        eventId={eventData.id}
        sessionDate={currentSessionId ? sessions.find((s) => s.id === currentSessionId)?.sessionDate : undefined}
        sessionTime={currentSessionId ? sessions.find((s) => s.id === currentSessionId)?.eventTime : undefined}
      />
    </div>
  );
}
