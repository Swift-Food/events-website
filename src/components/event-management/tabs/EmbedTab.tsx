"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { EventResponseDto } from "@/types";
import { toast } from "sonner";
import {
 Code,
 Copy,
 Check,
 LayoutTemplate,
 Eye,
 Palette,
 Settings2,
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
 { id: "image", label: "Cover Image", icon: <Image className="h-4 w-4" />, defaultEnabled: true },
 { id: "time", label: "Date & Time", icon: <Clock className="h-4 w-4" />, defaultEnabled: true },
 { id: "organizer", label: "Organizer", icon: <User className="h-4 w-4" />, defaultEnabled: true },
 { id: "location", label: "Location", icon: <MapPin className="h-4 w-4" />, defaultEnabled: true },
 { id: "description", label: "Description", icon: <FileText className="h-4 w-4" />, defaultEnabled: true },
 { id: "categories", label: "Categories", icon: <Tag className="h-4 w-4" />, defaultEnabled: true },
 { id: "tickets", label: "Ticket Price", icon: <Ticket className="h-4 w-4" />, defaultEnabled: true },
 { id: "cta", label: "Register Button", icon: <MousePointerClick className="h-4 w-4" />, defaultEnabled: true },
];

// Sections not available in the card layout
const CARD_DISABLED_SECTIONS = new Set(["description", "categories"]);

interface EmbedTabProps {
 eventData: EventResponseDto;
}

export function EmbedTab({ eventData }: EmbedTabProps) {
 const [layout, setLayout] = useState<EmbedLayout>("card");
 const [theme, setTheme] = useState<EmbedTheme>("event");
 const [enabledSections, setEnabledSections] = useState<Set<string>>(
  () => new Set(SECTION_OPTIONS.filter((s) => s.defaultEnabled).map((s) => s.id))
 );
 const [copied, setCopied] = useState(false);
 const [baseUrl, setBaseUrl] = useState("");
 const [customWidth, setCustomWidth] = useState("100%");
 const [customHeight, setCustomHeight] = useState("150");

 useEffect(() => {
  setBaseUrl(window.location.origin);
 }, []);

 // When switching layout, remove unsupported sections and reset dimensions
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
   setCustomWidth("100%");
   setCustomHeight("800");
  }
 }, [layout]);

 const toggleSection = useCallback((sectionId: string) => {
  // Don't allow toggling sections disabled for the current layout
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
 }, [layout]);

 const embedUrl = useMemo(() => {
  if (!baseUrl) return "";

  const params = new URLSearchParams();
  params.set("layout", layout);

  const showSections = Array.from(enabledSections).join(",");
  // Only include 'show' param if not all sections are enabled
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

 const iframeWidth = customWidth;
 const iframeHeight = customHeight;

 const iframeStyle = layout === "card"
  ? "border: none; border-radius: 12px; overflow: hidden;"
  : "border: none; border-radius: 12px;";

 const iframeSnippet = useMemo(() => {
  if (!embedUrl) return "";
  return `<iframe\n  src="${embedUrl}"\n  width="${iframeWidth}"\n  height="${iframeHeight}"\n  frameborder="0"\n  style="${iframeStyle}"\n  loading="lazy"\n></iframe>`;
 }, [embedUrl, iframeWidth, iframeHeight, iframeStyle]);

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

 return (
  <div className="space-y-6 py-4">
   {/* Header */}
   <div>
    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
     <Code className="h-5 w-5 text-primary" />
     Embed Event
    </h2>
    <p className="mt-1 text-sm text-muted-foreground">
     Generate an embed code to display this event on any website. Customize the layout, visible sections, and theme below.
    </p>
   </div>

   <div className="grid gap-6 lg:grid-cols-[340px_1fr] min-w-0">
    {/* Left: Configuration */}
    <div className="min-w-0 space-y-5">
     {/* Layout Picker */}
      <div className="rounded-2xl border border-white/5 bg-card-background p-5 sm:p-6 space-y-4">
       <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-1.5">
         <LayoutTemplate className="h-4 w-4 text-primary" />
        </div>
        Layout
       </h3>
      <div className="grid grid-cols-2 gap-3">
        <button
         onClick={() => setLayout("card")}
          className={`flex flex-col items-center rounded-xl border-2 p-3 transition-all ${
           layout === "card"
            ? "border-primary bg-primary/10"
            : "border-white/10 hover:border-white/20"
          }`}
        >
         <div className="flex h-16 w-full items-center">
          <div className="flex h-10 w-full rounded border border-current/20 overflow-hidden">
           <div className="w-10 bg-current/10" />
           <div className="flex-1 space-y-1 p-1">
            <div className="h-1 w-full rounded bg-current/20" />
            <div className="h-1 w-3/4 rounded bg-current/10" />
           </div>
           <div className="flex items-center px-1">
            <div className="h-3 w-6 rounded bg-current/15" />
           </div>
          </div>
         </div>
         <span className={`mt-2 text-xs font-medium ${layout === "card" ? "text-primary" : "text-muted-foreground"}`}>
          Card
         </span>
        </button>
       <button
        onClick={() => setLayout("full")}
         className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
          layout === "full"
           ? "border-primary bg-primary/10"
           : "border-white/10 hover:border-white/20"
         }`}
       >
        <div className="flex h-16 w-full rounded border border-current/20 overflow-hidden">
         <div className="flex-1 space-y-1 p-1.5">
          <div className="h-1.5 w-3/4 rounded bg-current/20" />
          <div className="h-1 w-1/2 rounded bg-current/10" />
          <div className="h-1 w-full rounded bg-current/10" />
          <div className="h-1 w-2/3 rounded bg-current/10" />
          <div className="mt-1 h-2 w-10 rounded bg-current/15" />
         </div>
         <div className="w-10 bg-current/10" />
        </div>
        <span className={`text-xs font-medium ${layout === "full" ? "text-primary" : "text-muted-foreground"}`}>
         Full Page
        </span>
       </button>
      </div>
     </div>

     {/* Sections Toggle */}
      <div className="rounded-2xl border border-white/5 bg-card-background p-5 sm:p-6 space-y-4">
       <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-1.5">
         <Settings2 className="h-4 w-4 text-primary" />
        </div>
        Visible Sections
       </h3>
       <div className="grid grid-cols-2 gap-2">
        {[...SECTION_OPTIONS].sort((a, b) => {
         if (layout === "card") {
          const aDisabled = CARD_DISABLED_SECTIONS.has(a.id) ? 1 : 0;
          const bDisabled = CARD_DISABLED_SECTIONS.has(b.id) ? 1 : 0;
          return aDisabled - bDisabled;
         }
         return 0;
        }).map((section) => {
         const isDisabledForLayout = layout === "card" && CARD_DISABLED_SECTIONS.has(section.id);
         const isEnabled = !isDisabledForLayout && enabledSections.has(section.id);
         return (
          <button
           key={section.id}
           onClick={() => toggleSection(section.id)}
           disabled={isDisabledForLayout}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
             isDisabledForLayout
              ? "border-white/5 text-muted-foreground/30 cursor-not-allowed opacity-50"
              : isEnabled
               ? "border-primary/50 bg-primary/10 text-foreground"
               : "border-white/10 text-muted-foreground hover:border-white/20"
            }`}
          >
           <div
            className={`flex h-4 w-4 items-center justify-center rounded transition-colors ${
             isDisabledForLayout
              ? "text-muted-foreground/30"
              : isEnabled
               ? "text-primary"
               : "text-muted-foreground/50"
            }`}
           >
            {section.icon}
           </div>
           <span className={`truncate ${isDisabledForLayout ? "line-through" : ""}`}>{section.label}</span>
           <div
            className={`ml-auto h-3 w-3 rounded-full border-2 transition-colors ${
             isDisabledForLayout
              ? "border-muted-foreground/20"
              : isEnabled
               ? "border-primary bg-primary"
               : "border-muted-foreground/30"
            }`}
           />
          </button>
         );
        })}
       </div>
     </div>

     {/* Theme Picker */}
      <div className="rounded-2xl border border-white/5 bg-card-background p-5 sm:p-6 space-y-4">
       <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-1.5">
         <Palette className="h-4 w-4 text-primary" />
        </div>
        Theme
       </h3>
      <div className="flex gap-2">
       {(
        [
         { id: "event", label: "Event Theme", colors: ["#7c3aed", "#a78bfa"] },
         { id: "light", label: "Light", colors: ["#ffffff", "#f3f4f6"] },
         { id: "dark", label: "Dark", colors: ["#18181b", "#27272a"] },
        ] as const
       ).map((opt) => (
        <button
         key={opt.id}
         onClick={() => setTheme(opt.id)}
          className={`flex flex-1 items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all ${
           theme === opt.id
            ? "border-primary bg-primary/10"
            : "border-white/10 hover:border-white/20"
          }`}
        >
         <div className="flex -space-x-1">
          {opt.colors.map((c, i) => (
           <div
            key={i}
            className="h-4 w-4 rounded-full border border-white/20"
            style={{ backgroundColor: c }}
           />
          ))}
         </div>
          <span
           className={`text-sm font-medium ${
            theme === opt.id ? "text-primary" : "text-muted-foreground"
           }`}
          >
          {opt.label}
         </span>
        </button>
       ))}
      </div>
      </div>

      {/* Dimensions */}
       <div className="rounded-2xl border border-white/5 bg-card-background p-5 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
         <div className="rounded-lg bg-primary/10 p-1.5">
          <Settings2 className="h-4 w-4 text-primary" />
         </div>
         Dimensions
        </h3>
       <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Width</label>
          <input
           type="text"
           value={customWidth}
           onChange={(e) => setCustomWidth(e.target.value)}
           className="w-full rounded-lg border border-white/10 bg-card-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
           placeholder="e.g. 100%, 500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Height</label>
          <input
           type="text"
           value={customHeight}
           onChange={(e) => setCustomHeight(e.target.value)}
           className="w-full rounded-lg border border-white/10 bg-card-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
           placeholder="e.g. 150, 800"
          />
        </div>
       </div>
        <p className="text-xs text-muted-foreground">
        Use numbers for pixels or include % for percentages. The resize script will auto-adjust height.
       </p>
      </div>
     </div>

     {/* Right: Preview + Code */}
    <div className="min-w-0 space-y-5">
     {/* Live Preview */}
      <div className="rounded-2xl border border-white/5 bg-card-background p-5 sm:p-6 space-y-4">
       <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-1.5">
         <Eye className="h-4 w-4 text-primary" />
        </div>
        Live Preview
       </h3>
       <div
        className="flex items-start justify-center rounded-xl p-4"
          style={{
           backgroundColor: theme === "light" ? "#f3f4f6" : theme === "dark" ? "#0a0a0a" : "#1a1a2e",
           minHeight: "150px",
          }}
         >
           {embedUrl && (
            <iframe
             src={embedUrl}
             width="100%"
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
      <div className="rounded-2xl border border-white/5 bg-card-background p-5 sm:p-6 space-y-4">
       <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
         <div className="rounded-lg bg-primary/10 p-1.5">
          <Code className="h-4 w-4 text-primary" />
         </div>
         Embed Code
        </h3>
       <button
        onClick={handleCopy}
         className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-card-secondary-background px-3 py-2 text-sm font-medium text-foreground transition-all hover:bg-primary/10 hover:border-primary/50"
       >
        {copied ? (
         <>
          <Check className="h-3.5 w-3.5 text-green-400" />
          Copied
         </>
        ) : (
         <>
          <Copy className="h-3.5 w-3.5" />
          Copy
         </>
        )}
       </button>
      </div>
      <div className="relative">
        <pre className="overflow-x-auto rounded-xl bg-card-secondary-background p-4 text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-all">
        <code>{iframeSnippetWithResize}</code>
       </pre>
      </div>
       <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
        Paste this code into your website&apos;s HTML where you want the event
        to appear. The resize script automatically adjusts the iframe height to
        fit the content. You can also adjust the <code className="text-primary">width</code> and{" "}
        <code className="text-primary">height</code> attributes to fit your
        design.
       </p>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}
