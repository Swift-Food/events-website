"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User, LogOut, UserCircle, Ticket } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  // { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, logout, user, refreshProfile } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

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

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Mobile Drawer Button */}
          <div className="flex gap-4">
            <button
              onClick={toggleDrawer}
              className="text-zinc-300 transition-colors hover:text-white sm:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link href="/" className="text-lg font-semibold tracking-tight">
              Prismo
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden gap-6 text-sm font-medium text-zinc-300 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/event-creation"
              className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-colors hover:bg-zinc-100 hover:text-black"
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
                      <button
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                        onClick={() => {
                          router.push("/my-tickets");
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <Ticket className="h-4 w-4" />
                        My Tickets
                      </button>
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
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white cursor-pointer"
                aria-label="Sign in"
                href={"/auth"}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 transform bg-background transition-transform duration-300 ease-in-out sm:hidden ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col border-r border-white/10">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <span className="text-lg font-semibold tracking-tight">Menu</span>
            <button
              onClick={closeDrawer}
              className="text-zinc-300 transition-colors hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <nav className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeDrawer}
                className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
