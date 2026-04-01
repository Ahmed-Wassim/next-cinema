"use client";

import { useSearchParams } from "next/navigation";
import { Ticket } from "lucide-react";

import { CheckoutClient } from "./CheckoutClient";
import { Stepper } from "@/components/ui/stepper";

export function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const showtimeId = Number(searchParams.get("showtimeId") ?? "0");
  const offerPercentage = Number(searchParams.get("offerPercentage") ?? "0");
  const seatParam = searchParams.get("seats") ?? "";
  const seatIds = seatParam
    .split(",")
    .map(Number)
    .filter((n) => n > 0);

  if (!showtimeId || seatIds.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
        <Ticket className="mb-4 h-12 w-12 text-[var(--accent)]" />
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          No tickets selected
        </h2>
        <p className="mt-2 text-sm">
          Please return to a movie and pick seats before checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
      <Stepper
        steps={["Movie", "Showtime", "Seats", "Payment"]}
        currentStepIndex={3}
      />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          Step 4 of 4
        </p>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          Booking & Payment
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Seats are reserved. Complete your customer details and payment to
          confirm the booking.
        </p>
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/40 p-4">
        <h3 className="font-semibold text-[var(--text-primary)]">
          Seat summary
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {seatIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-medium text-[var(--accent)]"
            >
              <Ticket className="h-3 w-3" /> Seat {id}
            </span>
          ))}
        </div>
      </div>
      <CheckoutClient
        showtimeId={showtimeId}
        seatIds={seatIds}
        initialOfferPercentage={offerPercentage}
      />
    </div>
  );
}
