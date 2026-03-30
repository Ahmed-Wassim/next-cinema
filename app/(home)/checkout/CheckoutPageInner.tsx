"use client";

import { useSearchParams } from "next/navigation";
import { CheckoutClient } from "./CheckoutClient";
import { Ticket } from "lucide-react";

export function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const showtimeId = Number(searchParams.get("showtimeId") ?? 0);
  const seatParam = searchParams.get("seats") ?? "";
  const seatIds = seatParam
    .split(",")
    .map(Number)
    .filter((n) => n > 0);

  if (!showtimeId || seatIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <Ticket className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-semibold">No seats selected.</p>
        <p className="text-sm mt-1">Please go back and select seats first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
          Step 3 of 3
        </p>
        <h1 className="text-3xl font-extrabold text-white">Your Details</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {seatIds.length} seat{seatIds.length > 1 ? "s" : ""} selected · Complete
          your booking below
        </p>
      </div>

      {/* Summary chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {seatIds.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300"
          >
            <Ticket className="h-3 w-3 text-amber-400" />
            Seat #{id}
          </span>
        ))}
      </div>

      <CheckoutClient showtimeId={showtimeId} seatIds={seatIds} />
    </div>
  );
}
