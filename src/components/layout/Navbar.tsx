"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // TODO: Replace with actual auth state

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

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
            {isLoggedIn ? (
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                aria-label="User profile"
              >
                <User className="h-5 w-5" />
              </button>
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
