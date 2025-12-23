"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { eventsApi } from "@/services/events";
import { guestTicketService } from "@/services/guest-ticket.service";
import { useAuth } from "@/lib/auth/authContext";
import { EventResponseDto } from "@/types/event";
import { GuestTicketResponseDto } from "@/types/guest-ticket";
import {
  Camera,
  CameraOff,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  RotateCcw,
  Keyboard,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface CheckInStats {
  totalTickets: number;
  checkedIn: number;
  pending: number;
  percentageCheckedIn: number;
}

/**
 * Extract guest display name with proper fallbacks
 */
function getGuestDisplayName(guest: GuestTicketResponseDto['guest'] | undefined): string {
  if (!guest) return "Guest";

  // Try EventUser firstName/lastName first
  const eventUserName = `${guest.firstName || ""} ${guest.lastName || ""}`.trim();
  if (eventUserName) return eventUserName;

  // Try nested User firstName/lastName
  if (guest.user) {
    const userName = `${guest.user.firstName || ""} ${guest.user.lastName || ""}`.trim();
    if (userName) return userName;

    // Try username
    if (guest.user.username) return guest.user.username;

    // Use email prefix as last resort before "Guest"
    if (guest.user.email) {
      const emailPrefix = guest.user.email.split("@")[0];
      // Capitalize first letter
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
  }

  return "Guest";
}

interface ScanResult {
  success: boolean;
  ticket?: GuestTicketResponseDto;
  message: string;
  guestName?: string;
}

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CheckInStats | null>(null);

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedRef = useRef<string>("");

  // Manual entry state - visible by default
  const [showManualEntry, setShowManualEntry] = useState(true);
  const [manualCode, setManualCode] = useState("");

  // Recent check-ins
  const [recentCheckIns, setRecentCheckIns] = useState<ScanResult[]>([]);

  // Load event and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventData, statsData] = await Promise.all([
          eventsApi.findById(eventId),
          guestTicketService.getCheckInStats(eventId),
        ]);
        setEvent(eventData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load event:", err);
        toast.error("Failed to load event details");
        router.push("/events");
      } finally {
        setLoading(false);
      }
    };

    if (eventId && isAuthenticated) {
      fetchData();
    }
  }, [eventId, isAuthenticated, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scanner?.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, [scanner]);

  const handleCheckIn = useCallback(async (qrCode: string) => {
    // Prevent duplicate scans
    if (qrCode === lastScannedRef.current || isProcessing) {
      return;
    }

    lastScannedRef.current = qrCode;
    setIsProcessing(true);
    setLastScanResult(null);

    try {
      const result = await guestTicketService.checkInTicket(qrCode);
      const guestName = getGuestDisplayName(result.guest);

      const scanResult: ScanResult = {
        success: true,
        ticket: result,
        message: "Check-in successful!",
        guestName,
      };

      setLastScanResult(scanResult);
      setRecentCheckIns(prev => [scanResult, ...prev].slice(0, 5));

      // Update stats
      setStats(prev => prev ? {
        ...prev,
        checkedIn: prev.checkedIn + 1,
        pending: prev.pending - 1,
        percentageCheckedIn: ((prev.checkedIn + 1) / prev.totalTickets) * 100,
      } : null);

      // Vibrate on success
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      toast.success(`${scanResult.guestName} checked in!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to check in";

      const scanResult: ScanResult = {
        success: false,
        message: errorMessage,
      };

      setLastScanResult(scanResult);

      // Vibrate pattern for error
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      // Allow new scan after delay
      setTimeout(() => {
        lastScannedRef.current = "";
      }, 2000);
    }
  }, [isProcessing]);

  const startScanning = async () => {
    try {
      // Initialize scanner lazily on first use
      let qrScanner = scanner;
      if (!qrScanner) {
        qrScanner = new Html5Qrcode("qr-scanner-container");
        setScanner(qrScanner);
      }

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (qrCodeMessage) => {
          handleCheckIn(qrCodeMessage);
        },
        () => {
          // Ignore scan errors (no QR in view)
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      toast.error("Failed to access camera. Please allow camera permissions.");
    }
  };

  const stopScanning = async () => {
    if (scanner && scanner.isScanning) {
      await scanner.stop();
      setIsScanning(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    await handleCheckIn(manualCode.trim());
    setManualCode("");
  };

  const refreshStats = async () => {
    try {
      const statsData = await guestTicketService.getCheckInStats(eventId);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to refresh stats:", err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/event-management/${eventId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Event
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
          <p className="text-muted-foreground">Ticket Check-In</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl bg-card-background border border-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.checkedIn}</p>
              <p className="text-sm text-muted-foreground">Checked In</p>
            </div>
            <div className="rounded-xl bg-card-background border border-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="rounded-xl bg-card-background border border-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.percentageCheckedIn.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Rate</p>
            </div>
          </div>
        )}

        {/* Scanner Area */}
        <div className="rounded-2xl bg-card-background border border-white/5 overflow-hidden mb-6">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">QR Scanner</span>
            </div>
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                showManualEntry
                  ? "text-primary hover:text-primary/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Keyboard className="h-4 w-4" />
              {showManualEntry ? "Hide Manual" : "Manual Entry"}
            </button>
          </div>

          {/* Scanner Container */}
          <div className="relative aspect-square max-h-[400px] bg-black">
            <div id="qr-scanner-container" className="w-full h-full" />

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card-secondary-background">
                <Camera className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <button
                  onClick={startScanning}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Start Scanning
                </button>
                <p className="text-sm text-muted-foreground mt-4">
                  Position QR code within the frame
                </p>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Scanner Controls */}
          {isScanning && (
            <div className="p-4 flex justify-center">
              <button
                onClick={stopScanning}
                className="px-6 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-all flex items-center gap-2"
              >
                <CameraOff className="h-4 w-4" />
                Stop Scanning
              </button>
            </div>
          )}

          {/* Manual Entry */}
          {showManualEntry && (
            <div className="p-4 border-t border-white/5">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter QR code manually..."
                  className="flex-1 px-4 py-2.5 bg-card-secondary-background border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isProcessing}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  Check In
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Last Scan Result */}
        {lastScanResult && (
          <div className={`rounded-2xl border p-4 mb-6 ${
            lastScanResult.success
              ? "bg-green-500/10 border-green-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}>
            <div className="flex items-center gap-3">
              {lastScanResult.success ? (
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              ) : (
                <XCircle className="h-8 w-8 text-red-400" />
              )}
              <div>
                <p className={`font-semibold ${lastScanResult.success ? "text-green-400" : "text-red-400"}`}>
                  {lastScanResult.success ? lastScanResult.guestName : "Check-in Failed"}
                </p>
                <p className="text-sm text-muted-foreground">{lastScanResult.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Check-ins */}
        {recentCheckIns.length > 0 && (
          <div className="rounded-2xl bg-card-background border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Recent Check-ins</span>
              </div>
              <button
                onClick={refreshStats}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {recentCheckIns.filter(r => r.success).map((checkIn, index) => (
                <div key={index} className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="font-medium text-foreground">{checkIn.guestName}</p>
                    <p className="text-sm text-muted-foreground">
                      {checkIn.ticket?.ticketName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
