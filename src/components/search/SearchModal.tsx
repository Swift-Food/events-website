"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  Plus,
  Home,
  Calendar as CalendarIcon,
  Compass,
  HelpCircle,
  ExternalLink,
  Ticket,
  User,
  Users,
} from "lucide-react";
import HorizontalEventCard from "@/components/HorizontalEventCard";
import SquareCalendarCard from "@/components/SquareCalendarCard";
import { searchService } from "@/services/search.service";
import {
  UnifiedSearchResponse,
  UserSearchResult,
} from "@/types/search";
import { Calendar } from "@/types/calendar";
import { EventResponseDto } from "@/types/event";

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
  keywords?: string[];
}

const DEBOUNCE_MS = 300;

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<UnifiedSearchResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const shortcuts: ShortcutItem[] = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: "Create Event",
      href: "/event-creation",
      keywords: ["create", "new", "event", "add"],
    },
    {
      icon: <Home className="h-4 w-4" />,
      label: "Open Home",
      href: "/",
      keywords: ["home", "main", "start"],
    },
    {
      icon: <Ticket className="h-4 w-4" />,
      label: "My Tickets",
      href: "/my-tickets",
      keywords: ["tickets", "my", "purchased", "booked"],
    },
    {
      icon: <CalendarIcon className="h-4 w-4" />,
      label: "Manage Events",
      href: "/event-management",
      keywords: ["manage", "events", "dashboard", "admin"],
    },
    {
      icon: <Compass className="h-4 w-4" />,
      label: "Open Discover",
      href: "/",
      keywords: ["discover", "explore", "find", "browse"],
    },
    {
      icon: <HelpCircle className="h-4 w-4" />,
      label: "Open Help",
      href: "/help",
      external: true,
      keywords: ["help", "support", "faq", "contact"],
    },
  ];

  // Filter shortcuts based on search query (instant, no debounce)
  const filteredShortcuts = searchQuery.startsWith("@")
    ? [] // Don't show shortcuts when searching for users
    : shortcuts.filter((shortcut) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          shortcut.label.toLowerCase().includes(query) ||
          shortcut.keywords?.some((kw) => kw.includes(query))
        );
      });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
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
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let results: UnifiedSearchResponse;

      // Check if searching for users only (@ prefix)
      if (query.startsWith("@")) {
        const userQuery = query.slice(1).trim();
        if (userQuery.length < 1) {
          setSearchResults(null);
          setIsLoading(false);
          return;
        }
        results = await searchService.searchUsersUnified(userQuery, 0, 10);
      } else {
        results = await searchService.searchAll(query, 0, 10);
      }

      console.log("Search results:", results);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search input change with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search if query is too short (but allow @ prefix)
    const effectiveQuery = searchQuery.startsWith("@")
      ? searchQuery.slice(1).trim()
      : searchQuery.trim();

    if (effectiveQuery.length < 2) {
      setSearchResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, performSearch]);

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

  const handleEventClick = (_e: React.MouseEvent, event: EventResponseDto) => {
    router.push(`/events/${event.id}`);
    onClose();
  };

  const handleUserClick = (user: UserSearchResult) => {
    router.push(`/u/${user.username}`);
    onClose();
  };

  const hasResults = searchResults && (
    (searchResults.events?.items?.length ?? 0) > 0 ||
    (searchResults.calendars?.items?.length ?? 0) > 0 ||
    (searchResults.users?.items?.length ?? 0) > 0
  );

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
          <div className="border-b border-foreground/10">
            <div className="flex items-center gap-3 px-4 py-3">
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
            <div className="px-4 pb-2">
              <span className="text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/70 font-mono text-xs">@</kbd>
                <span className="ml-1.5">to search for users</span>
              </span>
            </div>
          </div>

          {/* Results Container */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
              </div>
            )}

            {/* No Results */}
            {!isLoading && searchQuery.length >= 2 && !hasResults && filteredShortcuts.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No results found for &quot;{searchQuery}&quot;
              </div>
            )}

            {/* Shortcuts Section - instant filtering */}
            {!isLoading && filteredShortcuts.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Shortcuts
                  </span>
                </div>
                <div className="space-y-0.5">
                  {filteredShortcuts.map((item, index) => (
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
            )}

            {/* Calendars Section */}
            {!isLoading && searchResults?.calendars?.items && searchResults.calendars.items.length > 0 && (
              <div className="p-2 border-t border-foreground/10">
                <div className="px-2 py-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Calendars
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 px-2">
                  {searchResults.calendars.items.map((calendar) => (
                    <SquareCalendarCard
                      key={calendar.id}
                      calendar={{
                        id: calendar.id,
                        name: calendar.name,
                        calendarUrl: calendar.id,
                        calendarImage: calendar.coverImage ?? undefined,
                        calendarColor: "#6366f1",
                        description: calendar.description ?? undefined,
                        isPublic: !calendar.isPrivate,
                      } as Calendar}
                      size={140}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Events Section */}
            {!isLoading && searchResults?.events?.items && searchResults.events.items.length > 0 && (
              <div className="p-2 border-t border-foreground/10">
                <div className="px-2 py-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Events
                  </span>
                </div>
                <div>
                  {searchResults.events.items.map((event) => (
                    <HorizontalEventCard
                      key={event.id}
                      event={event}
                      showDate
                      showCategories={false}
                      onClick={handleEventClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Users Section */}
            {!isLoading && searchResults?.users?.items && searchResults.users.items.length > 0 && (
              <div className="p-2 border-t border-foreground/10">
                <div className="px-2 py-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Users
                  </span>
                </div>
                <div className="space-y-1">
                  {searchResults.users.items.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-foreground hover:bg-foreground/5 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-card-secondary-background flex-shrink-0">
                        {user.profilePicture ? (
                          <Image
                            src={user.profilePicture}
                            alt={user.username}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/20">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.organizationName ||
                            (user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                          {user.followerCount > 0 && (
                            <span className="ml-2">
                              <Users className="h-3 w-3 inline mr-1" />
                              {user.followerCount}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
