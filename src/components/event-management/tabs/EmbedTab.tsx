"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { EventResponseDto } from "@/types";
import { toast } from "sonner";
import {
 Code,
 Copy,
 Check,
 LayoutTemplate,
 PanelTop,
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

type EmbedLayout = "card" | "banner";
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

 useEffect(() => {
  setBaseUrl(window.location.origin);
 }, []);

 const toggleSection = useCallback((sectionId: string) => {
  setEnabledSections((prev) => {
   const next = new Set(prev);
   if (next.has(sectionId)) {
    next.delete(sectionId);
   } else {
    next.add(sectionId);
   }
   return next;
  });
 }, []);

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

 const iframeWidth = layout === "card" ? "400" : "100%";
 const iframeHeight = layout === "card" ? "520" : "180";

 const iframeSnippet = useMemo(() => {
  if (!embedUrl) return "";
  return `<iframe\n  src="${embedUrl}"\n  width="${iframeWidth}"\n  height="${iframeHeight}"\n  frameborder="0"\n  style="border: none; border-radius: 12px; overflow: hidden;"\n  loading="lazy"\n></iframe>`;
 }, [embedUrl, iframeWidth, iframeHeight]);

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
     <div className="rounded-lg border border-border bg-card-background p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
       <LayoutTemplate className="h-4 w-4 text-primary" />
       Layout
      </h3>
      <div className="grid grid-cols-2 gap-3">
       <button
        onClick={() => setLayout("card")}
        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
         layout === "card"
          ? "border-primary bg-primary/10"
          : "border-border hover:border-muted-foreground/30"
        }`}
       >
        <div className="flex h-16 w-12 flex-col rounded border border-current/20 overflow-hidden">
         <div className="h-6 bg-current/10" />
         <div className="flex-1 space-y-1 p-1">
          <div className="h-1 w-full rounded bg-current/20" />
          <div className="h-1 w-3/4 rounded bg-current/10" />
          <div className="h-1 w-1/2 rounded bg-current/10" />
         </div>
        </div>
        <span className={`text-xs font-medium ${layout === "card" ? "text-primary" : "text-muted-foreground"}`}>
         Card
        </span>
       </button>
       <button
        onClick={() => setLayout("banner")}
        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
         layout === "banner"
          ? "border-primary bg-primary/10"
          : "border-border hover:border-muted-foreground/30"
        }`}
       >
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
        <span className={`text-xs font-medium ${layout === "banner" ? "text-primary" : "text-muted-foreground"}`}>
         Banner
        </span>
       </button>
      </div>
     </div>

     {/* Sections Toggle */}
     <div className="rounded-lg border border-border bg-card-background p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
       <Settings2 className="h-4 w-4 text-primary" />
       Visible Sections
      </h3>
      <div className="grid grid-cols-2 gap-2">
       {SECTION_OPTIONS.map((section) => {
        const isEnabled = enabledSections.has(section.id);
        return (
         <button
          key={section.id}
          onClick={() => toggleSection(section.id)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all ${
           isEnabled
            ? "border-primary/50 bg-primary/10 text-foreground"
            : "border-border text-muted-foreground hover:border-muted-foreground/30"
          }`}
         >
          <div
           className={`flex h-4 w-4 items-center justify-center rounded transition-colors ${
            isEnabled
             ? "text-primary"
             : "text-muted-foreground/50"
           }`}
          >
           {section.icon}
          </div>
          <span className="truncate">{section.label}</span>
          <div
           className={`ml-auto h-3 w-3 rounded-full border-2 transition-colors ${
            isEnabled
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
     <div className="rounded-lg border border-border bg-card-background p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
       <Palette className="h-4 w-4 text-primary" />
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
         className={`flex flex-1 items-center gap-2 rounded-lg border-2 px-3 py-2 transition-all ${
          theme === opt.id
           ? "border-primary bg-primary/10"
           : "border-border hover:border-muted-foreground/30"
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
          className={`text-xs font-medium ${
           theme === opt.id ? "text-primary" : "text-muted-foreground"
          }`}
         >
          {opt.label}
         </span>
        </button>
       ))}
      </div>
     </div>
    </div>

    {/* Right: Preview + Code */}
    <div className="min-w-0 space-y-5">
     {/* Live Preview */}
     <div className="rounded-lg border border-border bg-card-background p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
       <Eye className="h-4 w-4 text-primary" />
       Live Preview
      </h3>
      <div
       className="flex items-start justify-center rounded-lg p-4"
       style={{
        backgroundColor: theme === "light" ? "#f3f4f6" : theme === "dark" ? "#0a0a0a" : "#1a1a2e",
        minHeight: layout === "card" ? "400px" : "180px",
       }}
      >
       {embedUrl && (
        <iframe
         src={embedUrl}
         width={layout === "card" ? "380" : "100%"}
         height={layout === "card" ? "520" : "180"}
         style={{
          border: "none",
          borderRadius: "12px",
          overflow: "hidden",
          maxWidth: "100%",
         }}
         loading="lazy"
        />
       )}
      </div>
     </div>

     {/* Embed Code */}
     <div className="rounded-lg border border-border bg-card-background p-4 space-y-3">
      <div className="flex items-center justify-between">
       <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Code className="h-4 w-4 text-primary" />
        Embed Code
       </h3>
       <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card-secondary-background px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary/10 hover:border-primary/50"
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
       <pre className="overflow-x-auto rounded-lg bg-card-secondary-background p-3 text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-all">
        <code>{iframeSnippetWithResize}</code>
       </pre>
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
       <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
       <p className="text-xs text-muted-foreground leading-relaxed">
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
