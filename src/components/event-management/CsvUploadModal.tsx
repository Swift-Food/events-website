"use client";

import { useState } from "react";
import { X, Upload, FileSpreadsheet, Loader2, ArrowLeft } from "lucide-react";
import { eventTicketService } from "@/services/event-ticket.service";
import { toast } from "sonner";

interface TicketOption {
  id: string;
  name: string;
  quantityLeft: number;
}

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  tickets: TicketOption[];
}

export function CsvUploadModal({ isOpen, onClose, onBack, tickets }: CsvUploadModalProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [replaceEmails, setReplaceEmails] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const resetState = () => {
    setSelectedTicketId("");
    setCsvFile(null);
    setReplaceEmails(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleBack = () => {
    resetState();
    onBack?.();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setCsvFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedTicketId || !csvFile) {
      toast.error("Please select a ticket type and upload a CSV file");
      return;
    }

    try {
      setIsUploading(true);
      const result = await eventTicketService.uploadApprovedEmailsCsv(
        selectedTicketId,
        csvFile,
        replaceEmails
      );
      toast.success(`Successfully added ${result.added} of ${result.total} emails`);
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload CSV");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card-background border border-white/5 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h3 className="text-lg font-semibold text-foreground">Upload Approved Emails</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with approved invitee emails for a specific ticket type.
          </p>

          {/* Ticket Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Ticket Type
            </label>
            <select
              value={selectedTicketId}
              onChange={(e) => setSelectedTicketId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="" className="bg-neutral-800 text-neutral-400">Choose a ticket type...</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id} className="bg-neutral-800 text-white">
                  {ticket.name} ({ticket.quantityLeft} available)
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              CSV File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 transition-colors hover:border-white/30"
              >
                {csvFile ? (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <FileSpreadsheet className="h-5 w-5 text-green-400" />
                    {csvFile.name}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-5 w-5" />
                    Click to upload CSV (max 5MB)
                  </div>
                )}
              </label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              CSV should have an &quot;email&quot; column header, or emails in the first column.
            </p>
          </div>

          {/* Replace Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="replace-emails"
              checked={replaceEmails}
              onChange={(e) => setReplaceEmails(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
            />
            <label htmlFor="replace-emails" className="text-sm text-foreground">
              Replace existing approved emails with emails in CSV
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedTicketId || !csvFile || isUploading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
