"use client";

import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Mail,
  Package,
} from "lucide-react";
import { CateringBundle } from "@/types/catering";
import { BundleCard } from "./BundleCard";
import { CreateYourOwnCard } from "./CreateYourOwnCard";

interface MealSessionFormData {
  id: string;
  sessionName: string;
  sessionDate: string;
  eventTime: string;
  collectionTime: string;
  specialRequirements: string;
  bundleQuantities: Record<string, number>;
  expanded: boolean;
}

interface MealSessionCardProps {
  session: MealSessionFormData;
  bundles: CateringBundle[];
  onUpdate: (sessionId: string, updates: Partial<MealSessionFormData>) => void;
  onRemove: (sessionId: string) => void;
  onToggleExpanded: (sessionId: string) => void;
  onOpenBundleModal: (sessionId: string, bundle: CateringBundle) => void;
  sessionTotal: number;
  eventId: string;
}

export function MealSessionCard({
  session,
  bundles,
  onUpdate,
  onRemove,
  onToggleExpanded,
  onOpenBundleModal,
  sessionTotal,
  eventId,
}: MealSessionCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-card-background to-card-secondary-background overflow-hidden shadow-lg hover:shadow-xl transition-all">
      {/* Session Header - Enhanced */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => onToggleExpanded(session.id)}
            className="flex-shrink-0 rounded-lg p-2 hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
          >
            {session.expanded ? (
              <ChevronUp className="h-5 w-5 text-primary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-primary" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={session.sessionName}
              onChange={(e) => onUpdate(session.id, { sessionName: e.target.value })}
              className="w-full bg-transparent border-none text-lg sm:text-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-3 py-2 hover:bg-white/5 transition-all"
              placeholder="Session name"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="rounded-xl bg-primary/10 px-4 py-2 border border-primary/20">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total
            </p>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              ${sessionTotal}
            </p>
          </div>
          <button
            onClick={() => onRemove(session.id)}
            className="flex-shrink-0 rounded-lg p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all hover:scale-110 active:scale-95"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Session Content */}
      {session.expanded && (
        <div className="p-5 sm:p-6 lg:p-8 space-y-6">
          {/* Session Details Form - Enhanced */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="rounded-lg bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                Session Date
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={session.sessionDate}
                onChange={(e) => onUpdate(session.id, { sessionDate: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-card-secondary-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary/30"
                required
              />
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="rounded-lg bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                Event Time
                <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={session.eventTime}
                onChange={(e) => onUpdate(session.id, { eventTime: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-card-secondary-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary/30"
                required
              />
            </div>
          </div>

          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <div className="rounded-lg bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              Special Requirements
            </label>
            <textarea
              value={session.specialRequirements}
              onChange={(e) => onUpdate(session.id, { specialRequirements: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-card-secondary-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary/30 resize-none"
              placeholder="Any dietary restrictions, allergies, or special instructions..."
            />
          </div>

          {/* Bundle Selection - Enhanced */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-primary/10 p-2">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-foreground">
                  Select Catering Bundles
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Each bundle has a fixed price and serves a specific number of guests
                </p>
              </div>
            </div>
            {bundles.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-card-secondary-background border border-white/5">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No bundles available</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Create Your Own Button */}
                <CreateYourOwnCard eventId={eventId} />

                {bundles.map((bundle) => {
                  const quantity = session.bundleQuantities[bundle.id] || 0;
                  return (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      isSelected={quantity > 0}
                      quantity={quantity}
                      onClick={() => onOpenBundleModal(session.id, bundle)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
