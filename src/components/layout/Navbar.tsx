"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  User,
  LogOut,
  UserCircle,
  Users,
  Settings,
  Ticket,
  CalendarPlus,
  ChartNoAxesGantt,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { useSearchModal } from "@/components/search/SearchModalContext";
import { NotificationDropdown } from "@/components/notifications";

const navLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/my-tickets", label: "Tickets", requiresAuth: true },
  { href: "/event-management", label: "Manage", requiresAuth: true },
];

export default function Navbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, logout, user, eventUser, refreshProfile } = useAuth();
  const { openSearchModal } = useSearchModal();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const router = useRouter();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const hasSolidBackground = false;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const handleUserIconClick = async () => {
    // Calculate dropdown position from the trigger button
    if (!isUserMenuOpen && userMenuRef.current) {
      const rect = userMenuRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsUserMenuOpen(!isUserMenuOpen);
    if (!isUserMenuOpen) {
      try {
        await refreshProfile();
      } catch (error) {
        console.error("Failed to refresh profile:", error);
      }
    }
  };

  const handleSearchIconClick = () => {
    openSearchModal();
  };

  const handleProtectedNavClick = (
    e: React.MouseEvent,
    href: string,
    requiresAuth?: boolean
  ) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      router.push(`/auth?redirect=${encodeURIComponent(href)}`);
    }
  };

  // Dynamic classes based on landing page
  const textColor = isLandingPage ? "text-zinc-900" : "text-foreground";
  const hoverBg = isLandingPage ? "hover:bg-zinc-900/10" : "hover:bg-foreground/10";
  const logoStyle = isLandingPage
    ? {}
    : { WebkitMaskImage: "url(/logo.svg)", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", maskImage: "url(/logo.svg)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center" } as React.CSSProperties;
  const buttonBg = isLandingPage ? "bg-zinc-900 text-white" : "bg-primary text-primary-foreground";
  const borderColor = isLandingPage ? "border-zinc-900/20 hover:border-zinc-900/40" : "border-foreground/20 hover:border-foreground/40";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Mobile logo links to /discover, desktop logo links to / */}
            {!isLandingPage && (
              <Link
                href="/discover"
                className={`flex sm:hidden items-center gap-1 text-lg font-semibold tracking-tight hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-transform duration-200`}
              >
                <div
                  className="w-6 h-6 shrink-0 self-center bg-foreground"
                  style={logoStyle}
                  role="img"
                  aria-label="Prismo logo"
                />
              </Link>
            )}
            <Link
              href="/"
              className={`flex items-center gap-1 text-lg font-semibold tracking-tight hover:scale-105 ${isLandingPage ? "hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.3)]" : "hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"} transition-transform duration-200 ${!isLandingPage ? "hidden sm:flex" : ""}`}
            >
              {isLandingPage ? (
                <Image
                  src="/logo.svg"
                  alt="Prismo logo"
                  width={24}
                  height={24}
                  className="shrink-0"
                />
              ) : (
                <div
                  className="w-6 h-6 shrink-0 self-center bg-foreground"
                  style={logoStyle}
                  role="img"
                  aria-label="Prismo logo"
                />
              )}
              <span
                className={`hidden sm:inline font-normal ${textColor}`}
                style={{ fontFamily: "var(--font-satoshi), sans-serif" }}
              >
                PRISMO
              </span>
            </Link>

            {/* Mobile Icon Navigation */}
            <nav className="flex gap-1 sm:hidden">
              <Link
                href="/my-tickets"
                onClick={(e) => handleProtectedNavClick(e, "/my-tickets", true)}
                className={`flex h-9 w-9 items-center justify-center rounded-full ${textColor} transition-colors ${hoverBg}`}
                aria-label="Tickets"
              >
                <Ticket className="h-5 w-5" />
              </Link>
              <Link
                href="/event-management"
                onClick={(e) =>
                  handleProtectedNavClick(e, "/event-management", true)
                }
                className={`flex h-9 w-9 items-center justify-center rounded-full ${textColor} transition-colors ${hoverBg}`}
                aria-label="Manage"
              >
                <ChartNoAxesGantt className="h-5 w-5" />
              </Link>
            </nav>

            {/* Desktop Navigation */}
            <nav className={`ml-8 hidden gap-6 text-sm font-medium ${textColor} sm:flex`}>
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) =>
                      handleProtectedNavClick(e, link.href, link.requiresAuth)
                    }
                    className={`relative py-1 transition-colors hover:opacity-100 ${isActive ? "opacity-100" : "opacity-70"} group`}
                  >
                    {link.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-current transition-all duration-300 ease-out ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isAuthenticated && (
              <button
                onClick={handleSearchIconClick}
                className={`flex h-9 w-9 items-center justify-center rounded-full ${textColor} transition-colors ${hoverBg} cursor-pointer`}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
            <Link
              href="/event-creation"
              className={`flex lg:hidden h-9 w-9 items-center justify-center rounded-full ${textColor} transition-colors ${hoverBg}`}
              aria-label="Create Event"
            >
              <CalendarPlus className="h-5 w-5" />
            </Link>
            <Link
              href="/event-creation"
              className={`hidden lg:inline-flex rounded-full ${buttonBg} px-5 py-2 text-sm font-semibold transition-colors hover:opacity-90`}
            >
              Create Event
            </Link>
            {isAuthenticated && (
              <button
                onClick={handleSearchIconClick}
                className={`flex h-9 w-9 items-center justify-center rounded-full ${textColor} transition-colors ${hoverBg} cursor-pointer`}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <div className="flex flex-row space-x-2">
                  <NotificationDropdown isLandingPage={isLandingPage} />
                  <button
                    onClick={handleUserIconClick}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${textColor} transition-colors ${hoverBg} cursor-pointer`}
                    aria-label="User profile"
                  >
                    <User className="h-5 w-5" />
                  </button>
                </div>

                {/* User Dropdown Menu - rendered via portal to escape header's backdrop-filter */}
              </div>
            ) : (
              <Link
                className={`rounded-full border ${borderColor} px-3 py-1.5 text-xs font-semibold ${textColor} transition-colors ${isLandingPage ? "hover:bg-zinc-900/5" : "hover:bg-foreground/5"} cursor-pointer sm:px-5 sm:py-2 sm:text-sm`}
                aria-label="Sign in"
                href={"/auth"}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* User Dropdown Menu - portaled outside header to allow backdrop-blur */}
      {isUserMenuOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[60] w-56 rounded-xl border border-white/10 bg-[#1a1a1a]/70 backdrop-blur-sm shadow-2xl shadow-black/50"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          {/* User Info Section */}
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium text-white truncate">
              {user?.email}
            </p>
            <p className="text-xs text-white/60 mt-0.5">
              Signed in
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/5"
              onClick={() => {
                if (eventUser?.id) {
                  router.push(`/user/${eventUser.id}`);
                }
                setIsUserMenuOpen(false);
              }}
            >
              <UserCircle className="h-4 w-4" />
              Profile
            </button>
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/5"
              onClick={() => {
                router.push("/friends");
                setIsUserMenuOpen(false);
              }}
            >
              <Users className="h-4 w-4" />
              Friends
            </button>
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/5"
              onClick={() => {
                router.push("/profile/edit");
                setIsUserMenuOpen(false);
              }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/5 hover:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
