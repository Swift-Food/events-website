"use client";

import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";
import Image from "next/image";

interface SmartAppBannerProps {
  currentPath: string;
  appScheme?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

export default function SmartAppBanner({
  currentPath,
  appScheme = "eventsapp",
  appStoreUrl = "https://apps.apple.com/app/prismo", // Update with actual App Store URL
  playStoreUrl = "https://play.google.com/store/apps/details?id=com.prysmo.app", // Update with actual Play Store URL
}: SmartAppBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const userAgent = navigator.userAgent || (navigator as any).vendor || (window as any).opera;
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase()
    );
    const ios = /iphone|ipad|ipod/i.test(userAgent.toLowerCase());

    setIsMobile(mobile);
    setIsIOS(ios);

    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem("smartBannerDismissed");
    setIsVisible(mobile && !dismissed);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("smartBannerDismissed", "true");
  };

  const handleOpenApp = () => {
    // Construct the app URL with the current path
    // Remove leading slash if present for proper URL scheme format
    const cleanPath = currentPath.startsWith("/") ? currentPath : `/${currentPath}`;
    const appUrl = `${appScheme}:/${cleanPath}`;

    // Try to open the app
    window.location.href = appUrl;

    // Fallback to app store if app doesn't open after a delay
    setTimeout(() => {
      // Check if page is still visible (app didn't open)
      if (document.visibilityState === "visible") {
        window.location.href = isIOS ? appStoreUrl : playStoreUrl;
      }
    }, 1500);
  };

  if (!isVisible) return null;

  return (
    <div className="sticky top-[65px] z-40 border-b border-primary/20 bg-primary/10 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Prismo</p>
            <p className="text-xs text-muted-foreground truncate">Open in the Prismo app</p>
          </div>
        </div>
        <button
          onClick={handleOpenApp}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
        >
          Open
        </button>
      </div>
    </div>
  );
}
