"use client";

import { useState, useMemo } from "react";
import { SeatViewerCanvas } from "@/components/seat-viewer-canvas";
import type { ShowtimeSeat } from "@/types/home";
import type { Seat } from "@/types/seat";
import { cn } from "@/lib/utils";

interface SeatMapProps {
  seats: ShowtimeSeat[];
  onSelectionChange: (selected: ShowtimeSeat[]) => void;
  maxSelectable?: number;
}

export function SeatMap({
  seats,
  onSelectionChange,
  maxSelectable = 8,
}: SeatMapProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  /** Map ShowtimeSeat → Seat for the canvas, overriding colors based on status */
  const canvasSeats: Seat[] = useMemo(
    () =>
      seats.map((s) => {
        const isSelected = selected.has(s.id);
        const isBooked =
          s.status === "booked" || s.status === "reserved" || s.status === "inactive";

        // Synthesize a price_tier to carry color into the canvas
        const coloredTier = isSelected
          ? { ...(s.price_tier ?? {}), color: "#f59e0b" } // amber when selected
          : isBooked
            ? { ...(s.price_tier ?? {}), color: "#3f3f46" } // dark zinc when unavailable
            : s.price_tier ?? null;

        return {
          ...s,
          status: isBooked ? "inactive" : "active",
          is_active: !isBooked,
          price_tier: coloredTier as Seat["price_tier"],
        } as Seat;
      }),
    [seats, selected]
  );

  function handleSeatClick(canvasSeat: Seat) {
    const original = seats.find((s) => s.id === canvasSeat.id);
    if (!original) return;
    if (
      original.status === "booked" ||
      original.status === "reserved" ||
      original.status === "inactive"
    )
      return;

    const next = new Set(selected);
    if (next.has(original.id)) {
      next.delete(original.id);
    } else {
      if (next.size >= maxSelectable) return;
      next.add(original.id);
    }
    
    setSelected(next);
    const selectedSeats = seats.filter((s) => next.has(s.id));
    onSelectionChange(selectedSeats);
  }

  /* ── Legend ── */
  const legend = [
    { color: "#94a3b8", label: "Available" },
    { color: "#f59e0b", label: "Selected" },
    { color: "#3f3f46", label: "Taken" },
  ];

  /* ── Price summary ── */
  const totalPrice = useMemo(() => {
    return seats
      .filter((s) => selected.has(s.id))
      .reduce((sum, s) => sum + (Number(s.price_tier?.price) || 0), 0);
  }, [seats, selected]);

  const currency =
    seats.find((s) => selected.has(s.id))?.price_tier?.currency ?? "";

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <SeatViewerCanvas
        seats={canvasSeats}
        onSeatClick={handleSeatClick}
        className="h-[520px]"
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 px-1">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded"
              style={{ backgroundColor: l.color }}
            />
            <span className="text-xs text-zinc-400">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Selection summary */}
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm transition-all",
          selected.size > 0
            ? "border-amber-500/40 bg-zinc-900"
            : "opacity-60"
        )}
      >
        <span className="text-zinc-400">
          {selected.size === 0
            ? "Select your seats above"
            : `${selected.size} seat${selected.size > 1 ? "s" : ""} selected`}
        </span>
        {selected.size > 0 && totalPrice > 0 && (
          <span className="font-semibold text-amber-400">
            {currency} {totalPrice.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
