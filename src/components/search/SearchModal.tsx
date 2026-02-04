"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Plus,
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
      icon: <Compass className="h-4 w-4" />,
      label: "Open Discover",
      href: "/discover",
      keywords: ["discover", "explore", "find", "browse", "home"],
    },
    {
      icon: <Ticket className="h-4 w-4" />,
      label: "My Tickets",
      href: "/my-tickets",
      keywords: ["tickets", "my", "purchased", "booked"],
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Friends",
      href: "/friends",
      keywords: ["friends", "followers", "following", "social"],
    },
    {
      icon: <CalendarIcon className="h-4 w-4" />,
      label: "Manage Events",
      href: "/event-management",
      keywords: ["manage", "events", "dashboard", "admin"],
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

  // Build flat list of all navigable items
  const allItems = [
    ...filteredShortcuts.map((s, i) => ({ type: "shortcut" as const, index: i, data: s })),
    ...(searchResults?.calendars?.items ?? []).map((c, i) => ({ type: "calendar" as const, index: i, data: c })),
    ...(searchResults?.events?.items ?? []).map((e, i) => ({ type: "event" as const, index: i, data: e })),
    ...(searchResults?.users?.items ?? []).map((u, i) => ({ type: "user" as const, index: i, data: u })),
  ];

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults, searchQuery]);

  // Calendar grid constants
  const CALENDAR_COLS = 3;
  const calendarStartIndex = filteredShortcuts.length;
  const calendarCount = searchResults?.calendars?.items?.length ?? 0;
  const calendarEndIndex = calendarStartIndex + calendarCount;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      const currentItem = selectedIndex >= 0 ? allItems[selectedIndex] : null;
      const isInCalendarSection = currentItem?.type === "calendar";

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (isInCalendarSection) {
          // Move down by CALENDAR_COLS in calendar grid
          const newIndex = selectedIndex + CALENDAR_COLS;
          if (newIndex < calendarEndIndex) {
            setSelectedIndex(newIndex);
          } else {
            // Move to first item after calendars
            if (calendarEndIndex < allItems.length) {
              setSelectedIndex(calendarEndIndex);
            }
          }
        } else {
          setSelectedIndex((prev) =>
            prev < allItems.length - 1 ? prev + 1 : prev
          );
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (isInCalendarSection) {
          // Move up by CALENDAR_COLS in calendar grid
          const newIndex = selectedIndex - CALENDAR_COLS;
          if (newIndex >= calendarStartIndex) {
            setSelectedIndex(newIndex);
          } else {
            // Move to last shortcut or deselect
            if (calendarStartIndex > 0) {
              setSelectedIndex(calendarStartIndex - 1);
            } else {
              setSelectedIndex(-1);
            }
          }
        } else {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isInCalendarSection) {
          // Move right within calendar row
          const calendarLocalIndex = selectedIndex - calendarStartIndex;
          const isLastInRow = (calendarLocalIndex + 1) % CALENDAR_COLS === 0;
          if (!isLastInRow && selectedIndex + 1 < calendarEndIndex) {
            setSelectedIndex(selectedIndex + 1);
          }
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (isInCalendarSection) {
          // Move left within calendar row
          const calendarLocalIndex = selectedIndex - calendarStartIndex;
          const isFirstInRow = calendarLocalIndex % CALENDAR_COLS === 0;
          if (!isFirstInRow) {
            setSelectedIndex(selectedIndex - 1);
          }
        }
      } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < allItems.length) {
        e.preventDefault();
        const item = allItems[selectedIndex];
        if (item.type === "shortcut") {
          handleShortcutClick(item.data as ShortcutItem);
        } else if (item.type === "calendar") {
          const cal = item.data as { id: string };
          router.push(`/calendar/${cal.id}`);
          onClose();
        } else if (item.type === "event") {
          const evt = item.data as EventResponseDto;
          router.push(`/events/${evt.id}`);
          onClose();
        } else if (item.type === "user") {
          handleUserClick(item.data as UserSearchResult);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Robust scroll lock for iOS
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY, 10) * -1);
      }
    };
  }, [isOpen, onClose, allItems, selectedIndex, router]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      const selectedEl = modalRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

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
    router.push(`/user/${user.id}`);
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
      className="fixed inset-0 z-[100] overflow-hidden bg-black/40 backdrop-blur-sm touch-none"
      onClick={handleBackdropClick}
    >
      <div className="h-full px-4 pt-4 sm:pt-[15vh] flex flex-col items-center overflow-hidden">
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl rounded-xl border border-white/10 bg-[#1a1a1a]/70 backdrop-blur-sm shadow-2xl shadow-black/50 animate-in fade-in duration-200 flex flex-col max-h-[85dvh] sm:max-h-[70vh] touch-auto"
        >
          {/* Search Input */}
          <div className="border-b border-white/10">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="h-5 w-5 text-white/60 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for events, calendars and more..."
                className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-base sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 text-white/60" />
                </button>
              )}
            </div>
            <div className="px-4 pb-2">
              <span className="text-xs text-white/60">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-xs">@</kbd>
                <span className="ml-1.5">to search for users</span>
              </span>
            </div>
          </div>

          {/* Results Container */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {/* Shortcuts Section - instant filtering, not affected by API loading */}
            {filteredShortcuts.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-2">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Shortcuts
                  </span>
                </div>
                <div className="space-y-0.5">
                  {filteredShortcuts.map((item, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                    <button
                      key={index}
                      data-index={index}
                      onClick={() => handleShortcutClick(item)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white transition-colors group ${isSelected ? "bg-white/10" : "hover:bg-white/5"}`}
                    >
                      <span className="text-white/60 group-hover:text-white transition-colors">
                        {item.icon}
                      </span>
                      <span className="text-sm flex-1 text-left">{item.label}</span>
                      {item.external && (
                        <ExternalLink className="h-3 w-3 text-white/60" />
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading State for API results */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              </div>
            )}

            {/* No Results */}
            {!isLoading && searchQuery.length >= 2 && !hasResults && filteredShortcuts.length === 0 && (
              <div className="px-4 py-8 text-center text-white/60 text-sm">
                No results found for &quot;{searchQuery}&quot;
              </div>
            )}

            {/* Calendars Section */}
            {!isLoading && searchResults?.calendars?.items && searchResults.calendars.items.length > 0 && (
              <div className="p-2 border-t border-white/10">
                <div className="px-2 py-2">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Calendars
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-2">
                  {searchResults.calendars.items.map((calendar, index) => {
                    const calendarOffset = filteredShortcuts.length;
                    const globalIndex = calendarOffset + index;
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <div
                        key={calendar.id}
                        data-index={globalIndex}
                        className={`rounded-xl cursor-pointer h-fit ${isSelected ? "ring-2 ring-primary" : ""}`}
                        onClick={() => {
                          router.push(`/calendar/${calendar.id}`);
                          onClose();
                        }}
                      >
                        <SquareCalendarCard
                          calendar={{
                            id: calendar.id,
                            name: calendar.name,
                            calendarUrl: calendar.id,
                            calendarImage: calendar.coverImage ?? undefined,
                            calendarColor: "#6366f1",
                            description: calendar.description ?? undefined,
                            isPublic: !calendar.isPrivate,
                          } as Calendar}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Events Section */}
            {!isLoading && searchResults?.events?.items && searchResults.events.items.length > 0 && (
              <div className="p-2 border-t border-white/10">
                <div className="px-2 py-2">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Events
                  </span>
                </div>
                <div>
                  {searchResults.events.items.map((event, index) => {
                    const eventOffset = filteredShortcuts.length + (searchResults.calendars?.items?.length ?? 0);
                    const globalIndex = eventOffset + index;
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <div
                        key={event.id}
                        data-index={globalIndex}
                        className={`rounded-lg ${isSelected ? "bg-white/10" : ""}`}
                      >
                        <HorizontalEventCard
                          event={event}
                          showDate
                          showCategories={false}
                          onClick={handleEventClick}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Users Section */}
            {!isLoading && searchResults?.users?.items && searchResults.users.items.length > 0 && (
              <div className="p-2 border-t border-white/10">
                <div className="px-2 py-2">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Users
                  </span>
                </div>
                <div className="space-y-1">
                  {searchResults.users.items.map((user, index) => {
                    const userOffset = filteredShortcuts.length +
                      (searchResults.calendars?.items?.length ?? 0) +
                      (searchResults.events?.items?.length ?? 0);
                    const globalIndex = userOffset + index;
                    const isSelected = selectedIndex === globalIndex;
                    return (
                    <button
                      key={user.id}
                      data-index={globalIndex}
                      onClick={() => handleUserClick(user)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white transition-colors group ${isSelected ? "bg-white/10" : "hover:bg-white/5"}`}
                    >
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-full w-full flex items-center justify-center bg-white/20 ${user.profilePicture ? 'hidden' : ''}`}>
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.organizationName ||
                            (user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username)}
                        </p>
                        <p className="text-xs text-white/60 truncate">
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
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Keyboard Shortcut Hint - hidden on mobile */}
          <div className="hidden sm:flex px-4 py-3 border-t border-white/10 items-center justify-between">
            <span className="text-xs text-white/60">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-xs">ESC</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
