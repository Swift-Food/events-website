"use client";

import { Plus } from "lucide-react";

interface CreateYourOwnCardProps {
  eventId: string;
}

export function CreateYourOwnCard({ eventId }: CreateYourOwnCardProps) {
  return (
    <div
      onClick={() => {
        window.open(`https://swiftfood.uk/event-order?eventId=${eventId}`, '_blank');
      }}
      className="group cursor-pointer rounded-xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all hover:shadow-xl hover:scale-[1.02] overflow-hidden"
    >
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[280px]">
        <div className="rounded-full bg-primary/20 p-4 mb-4 group-hover:scale-110 transition-transform">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <h5 className="font-bold text-foreground text-lg mb-2 text-center">
          Create Your Own
        </h5>
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          Build a custom catering order tailored to your event
        </p>
      </div>
    </div>
  );
}
