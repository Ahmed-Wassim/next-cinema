"use client";

import Image from "next/image";
import { CheckCircle } from "lucide-react";
import type { BookingConfirmation } from "@/types/home";

interface TicketCardProps {
  booking: BookingConfirmation;
}

export function TicketCard({ booking }: TicketCardProps) {
  const movie = booking.showtime?.movie;
  const seats = booking.seats ?? [];
  const seatLabels = seats
    .map(
      (s) =>
        s.row_label
          ? `${s.row_label}${s.col_label ?? ""}`
          : s.label ?? s.number ?? `#${s.id}`
    )
    .join(", ");

  const total =
    booking.total_amount !== undefined
      ? `${booking.currency ?? ""} ${Number(booking.total_amount).toFixed(2)}`
      : null;

  const formattedDate = booking.showtime?.start_time
    ? new Date(booking.showtime.start_time).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-amber-500/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center gap-3">
        <CheckCircle className="h-6 w-6 text-zinc-950 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-zinc-800 uppercase tracking-widest">
            Booking Confirmed
          </p>
          <p className="text-xs text-zinc-900/70">
            Ref #{booking.id}
          </p>
        </div>
      </div>

      {/* Movie info */}
      {movie && (
        <div className="flex gap-4 p-5 border-b border-zinc-800">
          {movie.poster && (
            <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl">
              <Image
                src={movie.poster}
                alt={movie.title ?? "Movie"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white leading-tight">
              {movie.title}
            </h2>
            {formattedDate && (
              <p className="mt-1 text-xs text-zinc-400">{formattedDate}</p>
            )}
          </div>
        </div>
      )}

      {/* Ticket details */}
      <div className="divide-y divide-zinc-800">
        {seatLabels && (
          <Row label="Seats" value={seatLabels} />
        )}
        {seats.length > 0 && (
          <Row label="Qty" value={`${seats.length} ticket${seats.length > 1 ? "s" : ""}`} />
        )}
        {total && <Row label="Total Paid" value={total} accent />}
        <Row
          label="Status"
          value={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              {booking.status ?? "Confirmed"}
            </span>
          }
        />
      </div>

      {/* QR placeholder */}
      <div className="flex flex-col items-center py-6 gap-2 border-t border-zinc-800">
        <div className="h-32 w-32 rounded-xl bg-zinc-800 flex items-center justify-center">
          <p className="text-xs text-zinc-500 text-center px-3">
            QR code will appear here
          </p>
        </div>
        <p className="text-xs text-zinc-500">Show this at the entrance</p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <span
        className={`text-sm font-medium ${accent ? "text-amber-400" : "text-zinc-200"}`}
      >
        {value}
      </span>
    </div>
  );
}
