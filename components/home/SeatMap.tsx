/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SeatViewerCanvas } from "@/components/seat-viewer-canvas";
import type { ShowtimeSeat } from "@/types/home";
import type { Seat } from "@/types/seat";
import { cn } from "@/lib/utils";

interface SeatMapProps {
  seats: ShowtimeSeat[];
  onSelectionChange: (selected: ShowtimeSeat[]) => void;
  maxSelectable?: number;
  clearSelectionSignal?: number;
}

export function SeatMap({
  seats,
  onSelectionChange,
  maxSelectable = 8,
  clearSelectionSignal,
}: SeatMapProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const getSeatPrice = (seat: ShowtimeSeat) =>
    Number(seat.price ?? seat.price_tier?.price ?? 0);

  const getSeatCurrency = (seat: ShowtimeSeat) =>
    seat.currency ?? seat.price_tier?.currency ?? "";

  const canvasSeats: Seat[] = useMemo(
    () =>
      seats.map((seat) => {
        const isSelected = selected.has(seat.id);
        const isBooked =
          seat.status === "booked" ||
          seat.status === "reserved" ||
          seat.status === "inactive";

        const coloredTier = isSelected
          ? { ...(seat.price_tier ?? {}), color: "var(--accent)" }
          : isBooked
            ? { ...(seat.price_tier ?? {}), color: "var(--bg-secondary)" }
            : (seat.price_tier ?? null);

        return {
          ...seat,
          status: isBooked ? "inactive" : "active",
          is_active: !isBooked,
          price_tier: coloredTier as Seat["price_tier"],
        } as Seat;
      }),
    [seats, selected],
  );

  useEffect(() => {
    if (clearSelectionSignal === undefined) return;
    setSelected(new Set());
    onSelectionChange([]);
  }, [clearSelectionSignal, onSelectionChange]);

  function handleSeatClick(canvasSeat: Seat) {
    const original = seats.find((seat) => seat.id === canvasSeat.id);
    if (!original) return;
    if (
      original.status === "booked" ||
      original.status === "reserved" ||
      original.status === "inactive"
    ) {
      return;
    }

    const next = new Set(selected);
    if (next.has(original.id)) {
      next.delete(original.id);
    } else {
      if (next.size >= maxSelectable) return;
      next.add(original.id);
    }

    setSelected(next);
    onSelectionChange(seats.filter((seat) => next.has(seat.id)));
  }

  const legend = [
    { color: "var(--text-secondary)", label: "Available" },
    { color: "var(--accent)", label: "Selected" },
    { color: "var(--bg-secondary)", label: "Taken" },
  ];

  const totalPrice = useMemo(() => {
    return seats
      .filter((seat) => selected.has(seat.id))
      .reduce((sum, seat) => sum + getSeatPrice(seat), 0);
  }, [seats, selected]);

  const selectedSeat = seats.find((seat) => selected.has(seat.id));
  const currency = selectedSeat ? getSeatCurrency(selectedSeat) : "";

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.div
        className="cinema-surface overflow-hidden rounded-[28px] p-3"
        initial={{ opacity: 0.96, scale: 0.995 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2 pt-1">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Choose your seats
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Hover to inspect, click to reserve your favorites.
            </p>
          </div>
          <div className="rounded-full border border-white/8 bg-white/6 px-3 py-1 text-xs text-[var(--text-secondary)]">
            Up to {maxSelectable} seats
          </div>
        </div>

        <SeatViewerCanvas
          seats={canvasSeats}
          onSeatClick={handleSeatClick}
          className="h-[260px]"
        />
      </motion.div>

      <motion.div
        className="flex flex-wrap items-center gap-5 px-1"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
      >
        {legend.map((item) => (
          <motion.div
            key={item.label}
            className="flex items-center gap-2"
            whileHover={{ y: -1 }}
          >
            <span
              className="h-4 w-4 rounded-md border border-white/10"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-[var(--text-secondary)]">
              {item.label}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className={cn(
          "flex items-center justify-between rounded-[22px] border px-5 py-4 text-sm transition-all duration-300",
          selected.size > 0
            ? "cinema-surface border-[var(--accent)]/35"
            : "border-white/8 bg-white/5 opacity-75",
        )}
        animate={
          selected.size > 0
            ? { scale: 1, opacity: 1, y: 0 }
            : { scale: 0.995, opacity: 0.8, y: 0 }
        }
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
      >
        <span className="text-[var(--text-secondary)]">
          {selected.size === 0
            ? "Select your seats above"
            : `${selected.size} seat${selected.size > 1 ? "s" : ""} selected`}
        </span>
        {selected.size > 0 && totalPrice > 0 && (
          <motion.span
            className="font-semibold text-[var(--accent)]"
            key={`${currency}-${totalPrice}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            {currency} {totalPrice.toFixed(2)}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}
