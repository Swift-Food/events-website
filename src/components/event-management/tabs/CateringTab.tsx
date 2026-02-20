"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { EventResponseDto, EventStatus } from "@/types";
import { cateringService } from "@/services/catering.service";
import {
  CateringBundle,
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
  Clock,
  User,
  Search,
} from "lucide-react";
import { BundleDetailsModal } from "../BundleDetailsModal";
import { ExistingOrderView, MealSessionCard } from "./catering";
import { GOOGLE_MAPS_CONFIG } from "@/constants/google-maps";
import { loadGoogleMapsScript } from "@/utils/google-maps-loader";

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

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

  // Editable customer fields (autofilled from event data)
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);

  // Google Maps autocomplete state
  const [addressInput, setAddressInput] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);

  // Autofill customer fields from event data
  useEffect(() => {
    const name = [eventData.owner?.user?.firstName, eventData.owner?.user?.lastName]
      .filter(Boolean)
      .join(" ");
    if (name) setCustomerName(name);
    if (eventData.owner?.user?.email) setCustomerEmail(eventData.owner.user.email);

    if (eventData.address) {
      const addr = [
        eventData.address.addressLine1,
        eventData.address.addressLine2,
        eventData.address.city,
        eventData.address.zipcode,
      ]
        .filter(Boolean)
        .join(", ");
      setDeliveryAddress(addr);
      setAddressInput(addr);
      if (eventData.address.location) {
        setDeliveryLatitude(eventData.address.location.latitude);
        setDeliveryLongitude(eventData.address.location.longitude);
      }
    }
  }, [eventData]);

  // Initialize Google Maps Places services
  useEffect(() => {
    const initializeServices = async () => {
      await loadGoogleMapsScript();
      if (window.google?.maps?.places) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        const dummyDiv = document.createElement("div");
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
      }
    };
    initializeServices();
  }, []);

  // Fetch predictions when address input changes (debounced)
  useEffect(() => {
    if (!addressInput.trim() || addressInput === deliveryAddress) {
      setPredictions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (autocompleteServiceRef.current && sessionTokenRef.current) {
        setIsLoadingPredictions(true);
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: addressInput,
            componentRestrictions: { country: GOOGLE_MAPS_CONFIG.COUNTRY_RESTRICTION },
            sessionToken: sessionTokenRef.current,
          },
          (results, status) => {
            setIsLoadingPredictions(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results as PlacePrediction[]);
              setShowPredictions(true);
            } else {
              setPredictions([]);
            }
          }
        );
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [addressInput, deliveryAddress]);

  // Close predictions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(event.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlace = useCallback((prediction: PlacePrediction) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "formatted_address", "geometry", "name"],
        sessionToken: sessionTokenRef.current!,
      },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return;

        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

        const lat = place.geometry?.location?.lat() ?? null;
        const lng = place.geometry?.location?.lng() ?? null;

        const formatted = place.formatted_address || prediction.description;
        setDeliveryAddress(formatted);
        setAddressInput(formatted);
        setDeliveryLatitude(lat);
        setDeliveryLongitude(lng);
        setPredictions([]);
        setShowPredictions(false);
      }
    );
  }, []);

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && highlightedIndex >= 0 && predictions[highlightedIndex]) {
      e.preventDefault();
      handleSelectPlace(predictions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowPredictions(false);
    }
  };

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

  const calculateGrandTotal = useCallback(() => {
    return sessions.reduce((total, session) => {
      return total + Object.entries(session.bundleQuantities).reduce(
        (sessionTotal, [bundleId, quantity]) => {
          const bundle = bundles.find((b) => b.id === bundleId);
          if (!bundle) return sessionTotal;
          // Use bundle pricePerPerson
          return sessionTotal + (bundle.pricePerPerson * bundle.baseGuestCount * quantity);
        },
        0
      );
    }, 0);
  }, [sessions, bundles]);

  // Transform session to pricing API request format
  const transformSessionToPricingRequest = useCallback(
    (session: MealSessionFormData): MealSessionRequest | null => {
      const bundleSelections = Object.entries(session.bundleQuantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([bundleId, quantity]) => ({ bundleId, quantity }));

      if (bundleSelections.length === 0) return null;

      return {
        sessionName: session.sessionName || "Meal Session",
        sessionDate: session.sessionDate || new Date().toISOString().split("T")[0],
        eventTime: session.eventTime || "12:00",
        specialRequirements: session.specialRequirements || undefined,
        bundleSelections, // Send bundle selections, not expanded orderItems
        orderItems: [], // Empty - backend will expand from bundleSelections
      };
    },
    []
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

      // Get delivery location from editable delivery coordinates
      const deliveryLocation = deliveryLatitude && deliveryLongitude
        ? { latitude: deliveryLatitude, longitude: deliveryLongitude }
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
      } catch (error: any) {
        console.error("Error fetching pricing:", error);
        setPricing(null);

        // Check for London delivery validation error
        if (error.response?.status === 400 && error.response?.data?.message === "We only deliver within London currently") {
          toast.error("We only deliver within London currently");
        }
      } finally {
        setIsLoadingPricing(false);
      }
    };

    // Debounce the pricing fetch
    const timeoutId = setTimeout(fetchPricing, 500);
    return () => clearTimeout(timeoutId);
  }, [sessions, bundles, deliveryLatitude, deliveryLongitude, transformSessionToPricingRequest]);

  const handleSubmitOrder = async () => {
    // Validation
    if (sessions.length === 0) {
      toast.error("Please add at least one meal session");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please provide a contact name");
      return;
    }

    if (!customerEmail.trim()) {
      toast.error("Please provide a contact email");
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error("Please provide a delivery address");
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

    if (!eventData.owner?.user) {
      toast.error("Event owner information is missing");
      return;
    }

    try {
      setIsSubmitting(true);

      const orderData: CreateCateringOrderDto = {
        userId: eventData.owner.user.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        eventId: eventData.id,
        mealSessions: sessions.map((session) => ({
          sessionName: session.sessionName,
          sessionDate: session.sessionDate,
          eventTime: session.eventTime,
          collectionTime: session.collectionTime || undefined,
          specialRequirements: session.specialRequirements || undefined,
          // Send bundle selections instead of expanded items
          bundleSelections: Object.entries(session.bundleQuantities)
            .filter(([_, quantity]) => quantity > 0)
            .map(([bundleId, quantity]) => ({ bundleId, quantity })),
        })),
        estimatedTotal: calculateGrandTotal(),
      };

      await cateringService.createOrder(orderData);
      toast.success("Catering order created successfully!");

      const updatedOrder = await cateringService.getCateringOrderForEvent(eventData.id);
      setExistingOrder(updatedOrder);

      // Reset form after successful order
      setSessions([]);
      setCustomerPhone("");
      setCustomerName("");
      setCustomerEmail("");
      setDeliveryAddress("");
      setAddressInput("");
      setDeliveryLatitude(null);
      setDeliveryLongitude(null);
    } catch (error: any) {
      console.error("Error creating order:", error);

      // Check for specific validation errors
      if (error.response?.status === 400 && error.response?.data?.message?.includes("catering portions limit")) {
        toast.error("A restaurant in your order has reached its catering capacity. Please adjust your order or try again later.", { duration: 8000 });
      } else if (error.response?.status === 400 && error.response?.data?.message === "We only deliver within London currently") {
        toast.error("We only deliver within London currently. Please update your event address to a London location.");
      } else {
        toast.error(error.response?.data?.message || "Failed to create catering order");
      }
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

  if (eventData.status === EventStatus.EXPIRED) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Event has expired</h3>
        <p className="text-sm text-muted-foreground">Catering orders cannot be placed on expired events.</p>
      </div>
    );
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

        {/* Customer Details */}
        <div className="mt-6 space-y-4">
          {/* Delivery Address with Google Maps Autocomplete */}
          <div className="rounded-xl bg-gradient-to-br from-card-secondary-background to-card-background border border-white/5 p-5 hover:border-primary/20 transition-all">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              Delivery Address
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={addressInputRef}
                  type="text"
                  value={addressInput}
                  onChange={(e) => {
                    setAddressInput(e.target.value);
                    if (e.target.value !== deliveryAddress) {
                      setDeliveryLatitude(null);
                      setDeliveryLongitude(null);
                    }
                  }}
                  onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                  onKeyDown={handleAddressKeyDown}
                  placeholder="Search for delivery address..."
                  className="w-full rounded-lg border border-white/10 bg-card-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              {showPredictions && predictions.length > 0 && (
                <div
                  ref={predictionsRef}
                  className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-card-background shadow-xl overflow-hidden"
                >
                  {predictions.map((prediction, idx) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handleSelectPlace(prediction)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        highlightedIndex === idx
                          ? "bg-primary/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {prediction.structured_formatting.main_text}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {prediction.structured_formatting.secondary_text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {isLoadingPredictions && addressInput.trim() && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-card-background shadow-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground">Searching...</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Contact Name */}
            <div className="rounded-xl bg-gradient-to-br from-card-secondary-background to-card-background border border-white/5 p-5 hover:border-primary/20 transition-all">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <User className="h-4 w-4 text-primary" />
                </div>
                Contact Name
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter contact name"
                className="w-full rounded-lg border border-white/10 bg-card-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Contact Email */}
            <div className="rounded-xl bg-gradient-to-br from-card-secondary-background to-card-background border border-white/5 p-5 hover:border-primary/20 transition-all">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                Contact Email
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter contact email"
                className="w-full rounded-lg border border-white/10 bg-card-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
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
                        £{total}
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
                £{pricing?.subtotal ?? calculateGrandTotal()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              {isLoadingPricing ? (
                <span className="text-muted-foreground">Calculating...</span>
              ) : pricing?.deliveryFee !== undefined ? (
                <span className="text-foreground">£{pricing.deliveryFee.toFixed(2)}</span>
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </div>
            {pricing &&(pricing.totalDiscount ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-400">Discount</span>
                <span className="text-green-400">-£{pricing.totalDiscount}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="font-semibold text-foreground">Total</span>
              {isLoadingPricing ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              ) : (
                <span className="text-xl font-bold text-primary">
                  £{pricing?.total ?? calculateGrandTotal()}
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
