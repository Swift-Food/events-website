"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
// import { useZxing } from "react-zxing"; // Alternative library
import { eventsApi } from "@/services/events";
import { guestTicketService } from "@/services/guest-ticket.service";
import { useAuth } from "@/lib/auth/authContext";
import { EventResponseDto } from "@/types/event";
import { GuestTicketResponseDto } from "@/types/guest-ticket";
import {
  Camera,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  RotateCcw,
  Keyboard,
  X,
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
 * Extract guest display name from EventUser with proper fallbacks
 */
function getGuestDisplayName(guest: GuestTicketResponseDto['guest'] | undefined): string {
  if (!guest) return "Guest";

  // Try EventUser firstName/lastName first
  const eventUserName = `${guest.firstName || ""} ${guest.lastName || ""}`.trim();
  if (eventUserName) return eventUserName;

  // Fallback to User username
  if (guest.user?.username) return guest.user.username;

  // Last resort: email (before @)
  if (guest.user?.email) {
    return guest.user.email.split("@")[0];
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
  const [viewfinderSize, setViewfinderSize] = useState(200);
  const viewfinderSizeRef = useRef(viewfinderSize); // Ref to avoid stale closures
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ startY: number; startSize: number } | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    viewfinderSizeRef.current = viewfinderSize;
  }, [viewfinderSize]);

  // Recent check-ins
  const [recentCheckIns, setRecentCheckIns] = useState<ScanResult[]>([]);

  // Manual code entry
  const [manualCode, setManualCode] = useState("");
  const [isManualProcessing, setIsManualProcessing] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      if (scanner) {
        (async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
            await scanner.clear();
          } catch {
            // Ignore cleanup errors
          }
        })();
      }
    };
  }, [scanner]);

  // Stop scanner when page loses visibility (tab switch, minimize, etc.)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
          await scanner.clear();
        } catch {
          // Ignore cleanup errors
        }
        setScanner(null);
        setIsScanning(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
      // Clean up existing scanner if it exists
      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
          await scanner.clear();
        } catch {
          // Ignore cleanup errors
        }
        setScanner(null);
      }

      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create a fresh scanner instance
      const qrScanner = new Html5Qrcode("qr-scanner-container");

      // Get container dimensions to calculate safe qrbox size
      const container = document.getElementById("qr-scanner-container");
      const containerWidth = container?.clientWidth || 300;
      const containerHeight = container?.clientHeight || 300;
      const minDimension = Math.min(containerWidth, containerHeight);
      const maxAllowedSize = Math.floor(minDimension * 0.95);

      // Use viewfinderSize but cap it to safe maximum
      let qrboxSize = Math.min(viewfinderSizeRef.current, maxAllowedSize);
      qrboxSize = Math.max(qrboxSize, 100); // Minimum 100px

      // Sync the visual viewfinder with actual qrbox
      if (viewfinderSizeRef.current !== qrboxSize) {
        setViewfinderSize(qrboxSize);
        viewfinderSizeRef.current = qrboxSize;
      }

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: qrboxSize, height: qrboxSize },
        },
        (qrCodeMessage) => {
          handleCheckIn(qrCodeMessage);
        },
        () => {
          // Ignore scan errors (no QR in view)
        }
      );
      setScanner(qrScanner);
      setIsScanning(true);
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      // Clean up the scanner on failure
      if (scanner) {
        try {
          await scanner.clear();
        } catch {
          // Ignore
        }
        setScanner(null);
      }

      if (err?.name === "NotReadableError") {
        toast.error("Camera is in use by another app. Please close other apps using the camera and try again.");
      } else if (err?.name === "NotAllowedError") {
        toast.error("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        toast.error("Failed to access camera. Please check permissions and try again.");
      }
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {
        // Ignore cleanup errors
      }
      setScanner(null);
      setIsScanning(false);
    }
  };

  // Viewfinder resize handlers
  const handleResizeStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeStartRef.current = { startY: clientY, startSize: viewfinderSize };
    setIsResizing(true);
  }, [viewfinderSize]);

  const handleResizeMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!resizeStartRef.current || !isResizing) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    // Drag down = expand, drag up = shrink (handle is at bottom)
    const deltaY = clientY - resizeStartRef.current.startY;
    // Min 100px, max 500px (startScanning will cap to 95% of container)
    const newSize = Math.max(100, Math.min(500, resizeStartRef.current.startSize + deltaY * 2));
    setViewfinderSize(newSize);
  }, [isResizing]);

  const handleResizeEnd = useCallback(async () => {
    resizeStartRef.current = null;
    setIsResizing(false);

    // Restart scanner with new viewfinder size if currently scanning
    if (scanner && isScanning) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {
        // Ignore cleanup errors
      }
      setScanner(null);
      // Small delay to ensure cleanup, then restart
      setTimeout(() => {
        startScanning();
      }, 100);
    }
  }, [scanner, isScanning]);

  // Add resize event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResizeMove);
      window.addEventListener('touchend', handleResizeEnd);

      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
        window.removeEventListener('touchmove', handleResizeMove);
        window.removeEventListener('touchend', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const refreshStats = async () => {
    try {
      const statsData = await guestTicketService.getCheckInStats(eventId);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to refresh stats:", err);
    }
  };

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    // Start scanning after modal opens and DOM is ready
    setTimeout(() => {
      startScanning();
    }, 150);
  }, []);

  const closeModal = useCallback(async () => {
    await stopScanning();
    setIsModalOpen(false);
  }, []);

  const handleManualCheckIn = async () => {
    const code = manualCode.trim();
    if (!code || isManualProcessing) return;

    setIsManualProcessing(true);
    setLastScanResult(null);

    try {
      const result = await guestTicketService.checkInByCode(code);
      const guestName = getGuestDisplayName(result.guest);

      const scanResult: ScanResult = {
        success: true,
        ticket: result,
        message: "Check-in successful!",
        guestName,
      };

      setLastScanResult(scanResult);
      setRecentCheckIns(prev => [scanResult, ...prev].slice(0, 5));
      setManualCode("");

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

      toast.success(`${guestName} checked in!`);
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
      setIsManualProcessing(false);
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
      <div className="mx-auto max-w-4xl px-4 py-6">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl bg-card-background border border-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Checked In</p>
                <p className="text-2xl font-bold text-foreground">{stats.checkedIn}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="rounded-xl bg-card-background border border-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Users className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="col-span-2 rounded-xl bg-card-background border border-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-lg font-bold text-primary">{stats.percentageCheckedIn.toFixed(0)}%</p>
              </div>
              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, stats.percentageCheckedIn)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.checkedIn} of {stats.totalTickets} guests checked in
              </p>
            </div>
          </div>
        )}

        {/* Open Scanner Button */}
        <button
          onClick={openModal}
          className="w-full mb-6 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
        >
          <Camera className="h-6 w-6" />
          Open QR Scanner
        </button>

        {/* Scanner Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg mx-4 bg-card-background rounded-2xl border border-white/10 overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">QR Scanner</span>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scanner Container */}
              <div className="relative bg-black overflow-hidden aspect-square">
                <div id="qr-scanner-container" className="w-full h-full" />

                {/* Custom viewfinder overlay */}
                {isScanning && (
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ width: viewfinderSize, height: viewfinderSize }}
                    >
                      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
                      <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg pointer-events-none" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg pointer-events-none" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg pointer-events-none" />
                      <div
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-ns-resize touch-none"
                        onMouseDown={handleResizeStart}
                        onTouchStart={handleResizeStart}
                      >
                        <div className="w-10 h-1 bg-white/60 rounded-full" />
                        <span className="text-[10px] text-white/60 select-none">Drag to resize</span>
                      </div>
                    </div>
                  </div>
                )}

                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-card-secondary-background">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Starting camera...</p>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="h-12 w-12 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Manual Entry in Modal */}
              <div className="p-4 border-t border-white/5">
                <p className="text-xs text-muted-foreground mb-2">
                  Or enter the 8-character code manually
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                      const formatted = raw.length > 4
                        ? `${raw.slice(0, 4)}-${raw.slice(4, 8)}`
                        : raw;
                      setManualCode(formatted);
                    }}
                    onFocus={(e) => {
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 200);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleManualCheckIn()}
                    placeholder="XXXX-XXXX"
                    maxLength={9}
                    className="flex-1 rounded-lg bg-card-secondary-background border border-white/10 px-3 py-2 text-center font-mono text-base tracking-wider uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={handleManualCheckIn}
                    disabled={!manualCode.trim() || isManualProcessing}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isManualProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Code Entry */}
        <div className="rounded-xl bg-card-background border border-white/5 overflow-hidden mb-6">
          <div className="px-3 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <Keyboard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Manual Entry</span>
            </div>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Enter the 8-character code from the ticket
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => {
                  // Strip non-alphanumeric, uppercase, auto-insert hyphen after 4 chars
                  const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                  const formatted = raw.length > 4
                    ? `${raw.slice(0, 4)}-${raw.slice(4, 8)}`
                    : raw;
                  setManualCode(formatted);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleManualCheckIn()}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className="flex-1 rounded-lg bg-card-secondary-background border border-white/10 px-3 py-2 text-center font-mono text-base tracking-wider uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleManualCheckIn}
                disabled={!manualCode.trim() || isManualProcessing}
                className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isManualProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Check In</span>
              </button>
            </div>
          </div>
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
                  <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground break-words">{checkIn.guestName}</p>
                    <p className="text-sm text-muted-foreground break-words">
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
