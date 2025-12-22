"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { User, LogOut, UserCircle, Ticket, Calendar, ChartNoAxesGantt } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";

const navLinks = [
  // { href: "/", label: "Home" },
  { href: "/my-tickets", label: "Tickets", requiresAuth: true },
  { href: "/event-management", label: "Manage", requiresAuth: true },
  // { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, logout, user, refreshProfile } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleProtectedNavClick = (e: React.MouseEvent, href: string, requiresAuth?: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      router.push(`/auth?redirect=${encodeURIComponent(href)}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1 text-lg font-semibold tracking-tight">
              <Image
                src="/logo.svg"
                alt="Prismo logo"
                width={24}
                height={24}
                className="invert"
              />
              <span className="hidden sm:inline font-normal">PRISMO</span>
            </Link>

            {/* Mobile Icon Navigation */}
            <nav className="flex gap-1 sm:hidden">
              <Link
                href="/my-tickets"
                onClick={(e) => handleProtectedNavClick(e, "/my-tickets", true)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Tickets"
              >
                <Ticket className="h-5 w-5" />
              </Link>
              <Link
                href="/event-management"
                onClick={(e) => handleProtectedNavClick(e, "/event-management", true)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Manage"
              >
                <ChartNoAxesGantt className="h-5 w-5" />
              </Link>
            </nav>

            {/* Desktop Navigation */}
            <nav className="ml-8 hidden gap-6 text-sm font-medium text-zinc-300 sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleProtectedNavClick(e, link.href, link.requiresAuth)}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/event-creation"
              className={`rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-zinc-100 hover:text-black sm:px-5 sm:py-2 sm:text-sm ${!isAuthenticated ? 'hidden sm:inline-flex' : ''}`}
            >
              Create Event
            </Link>
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={handleUserIconClick}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                  aria-label="User profile"
                >
                  <User className="h-5 w-5" />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-card-background shadow-2xl backdrop-blur-xl">
                    {/* User Info Section */}
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Signed in
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                        onClick={() => {
                          router.push("/profile");
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <UserCircle className="h-4 w-4" />
                        Profile
                      </button>
                      {/* <button
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                        onClick={() => {
                          router.push("/my-tickets");
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <Ticket className="h-4 w-4" />
                        My Tickets
                      </button> */}
                      <button
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-red-400"
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
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white cursor-pointer sm:px-5 sm:py-2 sm:text-sm"
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
