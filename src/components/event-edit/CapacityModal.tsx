"use client";

import { useState, useEffect } from "react";
import { X, Users } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";

interface CapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CapacityModal({
  isOpen,
  onClose,
}: CapacityModalProps) {
  const {
    capacity,
    setCapacity,
    isUnlimitedCapacity,
    setIsUnlimitedCapacity,
    hasWaitingList,
    setHasWaitingList,
    capacityNumber,
    setCapacityNumber,
  } = useEventCreation();

  const [localIsUnlimited, setLocalIsUnlimited] = useState(isUnlimitedCapacity);
  const [localHasWaitingList, setLocalHasWaitingList] =
    useState(hasWaitingList);
  const [localCapacityNumber, setLocalCapacityNumber] =
    useState(capacityNumber);

  // Update local state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalIsUnlimited(isUnlimitedCapacity);
      setLocalHasWaitingList(hasWaitingList);
      setLocalCapacityNumber(capacityNumber);
    }
  }, [isOpen, isUnlimitedCapacity, hasWaitingList, capacityNumber]);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsUnlimitedCapacity(localIsUnlimited);
    setHasWaitingList(localHasWaitingList);
    setCapacityNumber(localCapacityNumber);

    // Update the display string
    if (localIsUnlimited) {
      setCapacity("Unlimited");
    } else {
      const waitingListText = localHasWaitingList ? " + Waiting List" : "";
      setCapacity(`${localCapacityNumber}${waitingListText}`);
    }

    onClose();
  };

  const handleCancel = () => {
    // Reset to saved values
    setLocalIsUnlimited(isUnlimitedCapacity);
    setLocalHasWaitingList(hasWaitingList);
    setLocalCapacityNumber(capacityNumber);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-900/90 backdrop-blur-2xl p-8 text-foreground shadow-2xl border border-white/10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Capacity Settings</h2>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full p-2 transition-all hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Unlimited Capacity Toggle */}
          <div className="rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Unlimited Capacity
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Allow unlimited attendees
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocalIsUnlimited(!localIsUnlimited)}
                className={`h-7 w-14 rounded-full transition-all shadow-inner ${
                  localIsUnlimited
                    ? "bg-primary shadow-lg shadow-primary/30"
                    : "bg-white/10"
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full transition-all shadow-lg ${
                    localIsUnlimited
                      ? "translate-x-7 bg-white"
                      : "translate-x-0.5 bg-foreground"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Capacity Number Input - only shown if not unlimited */}
          {!localIsUnlimited && (
            <div className="rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-5 shadow-lg">
              <label className="text-base font-semibold text-foreground block mb-3">
                Maximum Attendees
              </label>
              <input
                type="number"
                min="1"
                value={localCapacityNumber}
                onChange={(e) => setLocalCapacityNumber(e.target.value)}
                className="w-full rounded-xl bg-white/10 backdrop-blur-md px-4 py-3.5 text-foreground text-lg font-semibold outline-none shadow-inner focus:ring-2 focus:ring-primary/50 transition-all border border-white/10"
                placeholder="Enter capacity"
              />
            </div>
          )}

          {/* Waiting List Toggle - only shown if not unlimited */}
          {!localIsUnlimited && (
            <div className="rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    Enable Waiting List
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow people to join when full
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalHasWaitingList(!localHasWaitingList)}
                  className={`h-7 w-14 rounded-full transition-all shadow-inner ${
                    localHasWaitingList
                      ? "bg-primary shadow-lg shadow-primary/30"
                      : "bg-white/10"
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full transition-all shadow-lg ${
                      localHasWaitingList
                        ? "translate-x-7 bg-white"
                        : "translate-x-0.5 bg-foreground"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-full bg-white/10 backdrop-blur-md py-4 text-center font-semibold text-foreground transition-all hover:bg-white/15 shadow-lg hover:scale-105"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-full bg-primary py-4 text-center font-bold text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 shadow-xl shadow-primary/30 hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
