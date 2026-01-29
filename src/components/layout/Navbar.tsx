"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  const router = useRouter();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
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
    // Fetch profile when opening the menu
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
  const logoFilter = isLandingPage ? "" : "invert";
  const buttonBg = isLandingPage ? "bg-zinc-900 text-white" : "bg-foreground text-background";
  const borderColor = isLandingPage ? "border-zinc-900/20 hover:border-zinc-900/40" : "border-foreground/20 hover:border-foreground/40";

  return (
    <>
      <header className={`sticky top-0 z-50 backdrop-blur-sm ${isLandingPage ? "" : "border-b border-zinc-700"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`flex items-center gap-1 text-lg font-semibold tracking-tight hover:scale-105 ${isLandingPage ? "hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.3)]" : "hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"} transition-transform duration-200`}
            >
              <Image
                src="/logo.svg"
                alt="Prismo logo"
                width={24}
                height={24}
                className={logoFilter}
              />
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
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) =>
                    handleProtectedNavClick(e, link.href, link.requiresAuth)
                  }
                  className="transition-colors hover:opacity-80"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <div className="flex flex-row space-x-2">
                  <button
                    onClick={handleSearchIconClick}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${textColor} transition-colors ${hoverBg} cursor-pointer`}
                    aria-label="User profile"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  <NotificationDropdown isLandingPage={isLandingPage} />
                  <button
                    onClick={handleUserIconClick}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${textColor} transition-colors ${hoverBg} cursor-pointer`}
                    aria-label="User profile"
                  >
                    <User className="h-5 w-5" />
                  </button>
                </div>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-foreground/10 bg-card-background shadow-2xl backdrop-blur-xl">
                    {/* User Info Section */}
                    <div className="border-b border-foreground/10 px-4 py-3">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Signed in
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground/5"
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
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground/5"
                        onClick={() => {
                          router.push("/friends");
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <Users className="h-4 w-4" />
                        Friends
                      </button>
                      <button
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground/5"
                        onClick={() => {
                          router.push("/profile/edit");
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                      <button
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground/5 hover:text-red-400"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
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
    </>
  );
}
