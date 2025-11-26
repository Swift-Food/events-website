// components/tickets/TicketQRCode.tsx
"use client";

import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { useRef } from "react";

interface TicketQRCodeProps {
  qrCode: string;
  ticketName: string;
  eventName: string;
  size?: number;
  showDownload?: boolean;
}

export default function TicketQRCode({
  qrCode,
  ticketName,
  eventName,
  size = 200,
  showDownload = true,
}: TicketQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with padding
    const padding = 32;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + 60; // Extra space for text

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Draw QR code centered
      ctx.drawImage(img, padding, padding, size, size);

      // Add text below QR code
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(eventName.slice(0, 30), canvas.width / 2, size + padding + 24);

      ctx.font = "12px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText(ticketName, canvas.width / 2, size + padding + 44);

      // Download
      const link = document.createElement("a");
      link.download = `ticket-${eventName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (!qrCode) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-xl"
        style={{ width: size, height: size }}
      >
        <p className="text-muted-foreground text-sm text-center px-4">
          QR code not available
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={qrRef}
        className="bg-white p-4 rounded-xl shadow-lg"
      >
        <QRCodeSVG
          value={qrCode}
          size={size}
          level="H"
          includeMargin={false}
        />
      </div>

      {showDownload && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download QR Code
        </button>
      )}
    </div>
  );
}
