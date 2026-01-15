"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Plus,
  Home,
  Calendar,
  Compass,
  HelpCircle,
  ExternalLink,
  Ticket,
} from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure modal is rendered, helps trigger keyboard on mobile
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Handle click outside to close
  const handleBackdropClick = () => {
    onClose();
  };

  const handleShortcutClick = (item: ShortcutItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      if (item.external) {
        window.open(item.href, "_blank");
      } else {
        router.push(item.href);
      }
    }
    onClose();
  };

  const shortcuts: ShortcutItem[] = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: "Create Event",
      href: "/event-creation",
    },
    {
      icon: <Home className="h-4 w-4" />,
      label: "Open Home",
      href: "/",
    },
    {
      icon: <Ticket className="h-4 w-4" />,
      label: "My Tickets",
      href: "/my-tickets",
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "Manage Events",
      href: "/event-management",
    },
    {
      icon: <Compass className="h-4 w-4" />,
      label: "Open Discover",
      href: "/",
    },
    {
      icon: <HelpCircle className="h-4 w-4" />,
      label: "Open Help",
      href: "/help",
      external: true,
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="min-h-screen px-4 pt-4 sm:pt-[15vh]">
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="relative mx-auto w-full max-w-xl rounded-xl border border-foreground/10 bg-card-background shadow-2xl animate-in fade-in duration-200"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/10">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for events, calendars and more..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-md hover:bg-foreground/10 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Shortcuts Section */}
          <div className="p-2">
            <div className="px-2 py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Shortcuts
              </span>
            </div>
            <div className="space-y-0.5">
              {shortcuts.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleShortcutClick(item)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-foreground hover:bg-foreground/5 transition-colors group"
                >
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.icon}
                  </span>
                  <span className="text-sm flex-1 text-left">{item.label}</span>
                  {item.external && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcut Hint - hidden on mobile */}
          <div className="hidden sm:flex px-4 py-3 border-t border-foreground/10 items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/70 font-mono text-xs">ESC</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
