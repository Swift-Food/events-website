"use client";

import { useState, useEffect } from "react";
import { X, User, Phone, Mail, Save } from "lucide-react";

interface EditPickupContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    pickupContactName: string;
    pickupContactPhone: string;
  }) => Promise<void>;
  initialData?: {
    pickupContactName?: string;
    pickupContactPhone?: string;
  };
}

export function EditPickupContactModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EditPickupContactModalProps) {
  const [pickupContactName, setPickupContactName] = useState("");
  const [pickupContactPhone, setPickupContactPhone] = useState("");
  const [pickupContactEmail, setPickupContactEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  useEffect(() => {
    if (isOpen && initialData) {
      setPickupContactName(initialData.pickupContactName || "");
      setPickupContactPhone(initialData.pickupContactPhone || "");
    }
  }, [isOpen, initialData]);

  const validateForm = () => {
    const newErrors: {
      name?: string;
      phone?: string;
      email?: string;
    } = {};

    if (!pickupContactName.trim()) {
      newErrors.name = "Contact name is required";
    }

    if (!pickupContactPhone.trim()) {
      newErrors.phone = "Contact phone is required";
    }

    if (!pickupContactEmail.trim()) {
      newErrors.email = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pickupContactEmail)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        pickupContactName: pickupContactName.trim(),
        pickupContactPhone: pickupContactPhone.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Error saving pickup contact:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card-background border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Edit Pickup Contact
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Update the contact information for pickup
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Contact Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <User className="h-4 w-4 text-primary" />
              Contact Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pickupContactName}
              onChange={(e) => setPickupContactName(e.target.value)}
              placeholder="Enter contact name"
              className={`w-full rounded-lg border ${
                errors.name ? "border-red-500" : "border-white/10"
              } bg-card-secondary-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              disabled={isSaving}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <Phone className="h-4 w-4 text-primary" />
              Contact Phone
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={pickupContactPhone}
              onChange={(e) => setPickupContactPhone(e.target.value)}
              placeholder="Enter contact phone"
              className={`w-full rounded-lg border ${
                errors.phone ? "border-red-500" : "border-white/10"
              } bg-card-secondary-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              disabled={isSaving}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-card-secondary-background to-card-background border-t border-white/10 p-6">
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-lg border border-white/10 bg-card-secondary-background px-6 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
