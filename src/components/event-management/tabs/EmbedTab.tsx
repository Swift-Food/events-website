"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { EventResponseDto } from "@/types";
import { toast } from "sonner";
import {
  Code,
  Copy,
  Check,
  Image,
  Clock,
  User,
  MapPin,
  FileText,
  Tag,
  Ticket,
  MousePointerClick,
  Info,
} from "lucide-react";

type EmbedLayout = "card" | "full";
type EmbedTheme = "event" | "light" | "dark";

interface SectionOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
}

const SECTION_OPTIONS: SectionOption[] = [
  {
    id: "image",
    label: "Image",
    icon: <Image className="h-3.5 w-3.5" />,
    defaultEnabled: true,
  },
  {
    id: "time",
    label: "Date & Time",
    icon: <Clock className="h-3.5 w-3.5" />,
    defaultEnabled: true,
  },
  {
    id: "organizer",
    label: "Organizer",
    icon: <User className="h-3.5 w-3.5" />,
    defaultEnabled: true,
  },
  {
    id: "location",
    label: "Location",
    icon: <MapPin className="h-3.5 w-3.5" />,
    defaultEnabled: true,
  },
  {
    id: "description",
    label: "Description",
    icon: <FileText className="h-3.5 w-3.5" />,
    defaultEnabled: true,
  },
  {
    id: "categories",
    label: "Categories",
    icon: <Tag className="h-3.5 w-3.5" />,
    defaultEnabled: true,
  },
  {
    id: "tickets",
    label: "Price",
    icon: <Ticket className="h-3.5 w-3.5" />,
    defaultEnabled: true,
  },
  {
    id: "cta",
    label: "Register",
    icon: <MousePointerClick className="h-3.5 w-3.5" />,
    defaultEnabled: true,
  },
];

const CARD_DISABLED_SECTIONS = new Set(["description", "categories"]);

interface EmbedTabProps {
  eventData: EventResponseDto;
}

export function EmbedTab({ eventData }: EmbedTabProps) {
  const [layout, setLayout] = useState<EmbedLayout>("card");
  const [theme, setTheme] = useState<EmbedTheme>("event");
  const [enabledSections, setEnabledSections] = useState<Set<string>>(
    () =>
      new Set(SECTION_OPTIONS.filter((s) => s.defaultEnabled).map((s) => s.id)),
  );
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [customWidth, setCustomWidth] = useState("100%");
  const [customHeight, setCustomHeight] = useState("150");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (layout === "card") {
      setEnabledSections((prev) => {
        const next = new Set(prev);
        CARD_DISABLED_SECTIONS.forEach((s) => next.delete(s));
        return next;
      });
      setCustomWidth("100%");
      setCustomHeight("150");
    } else {
      setEnabledSections((prev) => {
        const next = new Set(prev);
        CARD_DISABLED_SECTIONS.forEach((s) => next.add(s));
        return next;
      });
      setCustomWidth("100%");
      setCustomHeight("800");
    }
  }, [layout]);

  const toggleSection = useCallback(
    (sectionId: string) => {
      if (layout === "card" && CARD_DISABLED_SECTIONS.has(sectionId)) return;
      setEnabledSections((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        return next;
      });
    },
    [layout],
  );

  const embedUrl = useMemo(() => {
    if (!baseUrl) return "";

    const params = new URLSearchParams();
    params.set("layout", layout);

    const showSections = Array.from(enabledSections).join(",");
    const allEnabled = SECTION_OPTIONS.every((s) => enabledSections.has(s.id));
    if (!allEnabled) {
      params.set("show", showSections);
    }

    if (theme !== "event") {
      params.set("theme", theme);
    }

    const queryString = params.toString();
    return `${baseUrl}/embed/events/${eventData.id}${queryString ? `?${queryString}` : ""}`;
  }, [baseUrl, layout, enabledSections, theme, eventData.id]);

  const iframeStyle =
    layout === "card"
      ? "border: none; border-radius: 12px; overflow: hidden;"
      : "border: none; border-radius: 12px;";

  const iframeSnippet = useMemo(() => {
    if (!embedUrl) return "";
    return `<iframe\n  src="${embedUrl}"\n  width="${customWidth}"\n  height="${customHeight}"\n  frameborder="0"\n  style="${iframeStyle}"\n  loading="lazy"\n></iframe>`;
  }, [embedUrl, customWidth, customHeight, iframeStyle]);

  const iframeSnippetWithResize = useMemo(() => {
    if (!baseUrl) return "";
    return `${iframeSnippet}\n<script src="${baseUrl}/embed/resize.js"></script>`;
  }, [iframeSnippet, baseUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(iframeSnippetWithResize);
      setCopied(true);
      toast.success("Embed code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [iframeSnippetWithResize]);

  const sortedSections = useMemo(() => {
    return [...SECTION_OPTIONS].sort((a, b) => {
      if (layout === "card") {
        const aDisabled = CARD_DISABLED_SECTIONS.has(a.id) ? 1 : 0;
        const bDisabled = CARD_DISABLED_SECTIONS.has(b.id) ? 1 : 0;
        return aDisabled - bDisabled;
      }
      return 0;
    });
  }, [layout]);

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          Embed Event
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add this event to any website with a simple embed code.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr] min-w-0">
        {/* Left: Configuration */}
        <div className="min-w-0 space-y-5">
          {/* Layout + Theme combined */}
          <div className="rounded-2xl border border-white/5 bg-card-background p-5 space-y-7">
            {/* Layout */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Layout
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLayout("card")}
                  className={`group relative flex flex-col rounded-xl border-2 p-3 transition-all ${
                    layout === "card"
                      ? "border-primary bg-primary/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Wireframe area — fixed height, card centered */}
                  <div className="flex h-24 w-full items-center justify-center">
                    <div className="flex h-12 w-full items-center rounded-md border border-current/10 overflow-hidden">
                      <div className="w-10 h-full bg-current/8" />
                      <div className="flex-1 space-y-1 p-1.5">
                        <div className="h-1 w-full rounded-full bg-current/15" />
                        <div className="h-1 w-3/4 rounded-full bg-current/10" />
                      </div>
                      <div className="flex items-center px-1.5">
                        <div className="h-2.5 w-5 rounded bg-current/12" />
                      </div>
                    </div>
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center w-full ${layout === "card" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    Card
                  </span>
                </button>

                <button
                  onClick={() => setLayout("full")}
                  className={`group relative flex flex-col rounded-xl border-2 p-3 transition-all ${
                    layout === "full"
                      ? "border-primary bg-primary/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Wireframe area — fixed height, full page fills it */}
                  <div className="flex h-24 w-full items-end">
                    <div className="flex h-24 w-full rounded-md border border-current/10 overflow-hidden">
                      <div className="flex-1 space-y-1.5 p-2">
                        <div className="h-1.5 w-3/4 rounded-full bg-current/15" />
                        <div className="h-1 w-1/2 rounded-full bg-current/10" />
                        <div className="h-1 w-full rounded-full bg-current/8" />
                        <div className="h-1 w-2/3 rounded-full bg-current/8" />
                        <div className="mt-2 h-2.5 w-10 rounded bg-current/12" />
                      </div>
                      <div className="w-10 bg-current/8" />
                    </div>
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center w-full ${layout === "full" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    Full Page
                  </span>
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Visual Style
              </h3>
              <div className="flex rounded-lg bg-white/[0.06] p-0.5">
                {(
                  [
                    { id: "event", label: "Event" },
                    { id: "light", label: "Light" },
                    { id: "dark", label: "Dark" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      theme === opt.id
                        ? "bg-white/[0.1] text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Dimensions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">
                    Width
                  </label>
                  <input
                    type="text"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="100%"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">
                    Height
                  </label>
                  <input
                    type="text"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="150"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="rounded-2xl border border-white/5 bg-card-background p-5 space-y-3">
            <h3 className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Sections
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {sortedSections.map((section) => {
                const isDisabledForLayout =
                  layout === "card" && CARD_DISABLED_SECTIONS.has(section.id);
                const isEnabled =
                  !isDisabledForLayout && enabledSections.has(section.id);
                return (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    disabled={isDisabledForLayout}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      isDisabledForLayout
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : isEnabled
                          ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                          : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Preview + Code */}
        <div className="min-w-0 space-y-5">
          {/* Live Preview — Browser mockup */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#1a1a1a] overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center px-3 py-2 border-b border-white/[0.06]">
              {/* Traffic lights */}
              <div className="flex items-center gap-1.5 w-10 shrink-0">
                <div className="h-2 w-2 rounded-full bg-white/[0.15]" />
                <div className="h-2 w-2 rounded-full bg-white/[0.15]" />
                <div className="h-2 w-2 rounded-full bg-white/[0.15]" />
              </div>
              {/* URL bar */}
              <div className="flex-1 flex justify-center">
                <div className="flex items-center justify-center rounded-md bg-white/[0.06] px-4 h-6">
                  <span className="text-[11px] font-mono text-muted-foreground/50">
                    your-website.com
                  </span>
                </div>
              </div>
              {/* Spacer to balance traffic lights */}
              <div className="w-10 shrink-0" />
            </div>
            {/* Page content area */}
            <div
              className="flex items-center justify-center p-6 sm:p-8"
              style={{
                backgroundColor:
                  theme === "light"
                    ? "#f3f4f6"
                    : theme === "dark"
                      ? "#0a0a0a"
                      : "#1a1a2e",
                minHeight: "200px",
              }}
            >
              {embedUrl && (
                <iframe
                  src={embedUrl}
                  width={customWidth}
                  height={customHeight}
                  style={{
                    border: "none",
                    borderRadius: "12px",
                    overflow: layout === "card" ? "hidden" : undefined,
                    maxWidth: "100%",
                  }}
                  loading="lazy"
                />
              )}
            </div>
          </div>

          {/* Embed Code */}
          <div className="rounded-2xl border border-white/5 bg-card-background p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Code className="h-3.5 w-3.5" />
                Embed Code
              </h3>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  copied
                    ? "bg-green-500/10 text-green-400"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-black/20 p-4 text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-all">
              <code>{iframeSnippetWithResize}</code>
            </pre>
            <div className="flex items-start gap-2.5 rounded-lg bg-primary/5 px-3.5 py-3">
              <Info className="h-3.5 w-3.5 shrink-0 text-primary/60 mt-0.5" />
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                Paste this into your website&apos;s HTML. The resize script
                auto-adjusts the iframe height.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
