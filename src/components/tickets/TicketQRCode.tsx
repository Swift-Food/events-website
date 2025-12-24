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

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 32;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + 60;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(eventName.slice(0, 30), canvas.width / 2, size + padding + 24);

      ctx.font = "12px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText(ticketName, canvas.width / 2, size + padding + 44);

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
    <div className="relative">
      <div
        ref={qrRef}
        className="bg-white p-4 rounded-2xl"
      >
        <QRCodeSVG
          value={qrCode}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>

      {/* {showDownload && (
        <button
          onClick={handleDownload}
          className="absolute -bottom-5 -right-5 flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          title="Download QR Code"
        >
          <Download className="h-4 w-4" />
        </button>
      )} */}
    </div>
  );
}
