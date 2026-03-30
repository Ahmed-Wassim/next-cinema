"use client";

import Image from "next/image";
import {
  CalendarDays,
  CheckCircle,
  Clock3,
  Landmark,
  MapPin,
  Receipt,
  Ticket,
} from "lucide-react";

import type { BookingConfirmation } from "@/types/home";

interface TicketCardProps {
  booking: BookingConfirmation;
}

export function TicketCard({ booking }: TicketCardProps) {
  const movie = booking.movie ?? booking.showtime?.movie;
  const seatLabels = getSeatLabels(booking);
  const seatCount = getSeatCount(booking, seatLabels);
  const showtimeDate = booking.showtime?.start_time
    ? new Date(booking.showtime.start_time)
    : null;

  const total =
    booking.total_price !== undefined || booking.total_amount !== undefined
      ? `${booking.currency ? `${booking.currency} ` : ""}${Number(
          booking.total_price ?? booking.total_amount
        ).toFixed(2)}`
      : null;

  const formattedDate = showtimeDate
    ? showtimeDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  const formattedTime = showtimeDate
    ? showtimeDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,18,0.92),rgba(10,10,10,0.96))] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
                E-Ticket
              </p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                Booking Confirmation
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Everything you need for entry is summarized here.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              {booking.status ?? "Confirmed"}
            </div>
          </div>

          {movie ? (
            <div className="mt-8 flex gap-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              {movie.poster ? (
                <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-2xl">
                  <Image
                    src={movie.poster}
                    alt={movie.title ?? "Movie"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Feature Presentation
                </p>
                <h3 className="mt-2 text-xl font-bold leading-tight text-white">
                  {movie.title}
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
                  {formattedDate ? (
                    <MetaItem
                      icon={<CalendarDays className="h-4 w-4" />}
                      label="Date"
                      value={formattedDate}
                    />
                  ) : null}
                  {formattedTime ? (
                    <MetaItem
                      icon={<Clock3 className="h-4 w-4" />}
                      label="Time"
                      value={formattedTime}
                    />
                  ) : null}
                  {booking.showtime?.hall ? (
                    <MetaItem
                      icon={<Landmark className="h-4 w-4" />}
                      label="Hall"
                      value={booking.showtime.hall}
                    />
                  ) : null}
                  {booking.showtime?.branch ? (
                    <MetaItem
                      icon={<MapPin className="h-4 w-4" />}
                      label="Cinema"
                      value={booking.showtime.branch}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {seatLabels ? (
              <StatCard
                icon={<Ticket className="h-4 w-4" />}
                label="Seats"
                value={seatLabels}
              />
            ) : null}
            {seatCount > 0 ? (
              <StatCard label="Quantity" value={`${seatCount}`} />
            ) : null}
            {total ? <StatCard icon={<Receipt className="h-4 w-4" />} label="Total" value={total} /> : null}
            <StatCard label="Booking ID" value={`#${booking.id}`} />
          </div>
        </div>

        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] lg:left-0 lg:right-auto lg:top-8 lg:h-[calc(100%-4rem)] lg:w-px" />

          <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
              <Ticket className="h-8 w-8" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
              Entry Pass
            </p>
            <h3 className="mt-2 text-lg font-bold text-white">
              Show this at the entrance
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Your booking reference and payment confirmation can be used for check-in.
            </p>

            <div className="mx-auto mt-6 grid h-44 w-44 grid-cols-6 gap-1 rounded-2xl bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
              {Array.from({ length: 36 }, (_, index) => (
                <span
                  key={index}
                  className={`rounded-sm ${
                    QR_PATTERN.has(index) ? "bg-zinc-950" : "bg-zinc-200"
                  }`}
                />
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-zinc-950/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Reference
              </p>
              <p className="mt-1 font-mono text-sm text-zinc-100">
                {booking.payment?.transaction_ref ?? `BOOK-${booking.id}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const QR_PATTERN = new Set([
  0, 1, 2, 4, 5, 6, 7, 10, 12, 13, 15, 17, 18, 20, 21, 23, 24, 25, 27, 29, 30,
  31, 34, 35,
]);

function getSeatLabels(booking: BookingConfirmation) {
  if (typeof booking.seats === "string") {
    return booking.seats;
  }

  if (Array.isArray(booking.seats)) {
    return booking.seats
      .map((seat) =>
        seat.row_label
          ? `${seat.row_label}${seat.col_label ?? ""}`
          : seat.label ?? seat.number ?? `#${seat.id}`
      )
      .join(", ");
  }

  if (Array.isArray(booking.tickets)) {
    return booking.tickets
      .map((ticket) => ticket.seat_label ?? `#${ticket.id}`)
      .join(", ");
  }

  return "";
}

function getSeatCount(booking: BookingConfirmation, seatLabels: string) {
  if (typeof booking.seats === "string") {
    return seatLabels
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean).length;
  }

  if (Array.isArray(booking.seats)) {
    return booking.seats.length;
  }

  if (Array.isArray(booking.tickets)) {
    return booking.tickets.length;
  }

  return 0;
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-zinc-950/55 px-3 py-3">
      <div className="mt-0.5 text-amber-300">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>
        <p className="mt-1 truncate font-medium text-zinc-100">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-amber-300">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>
      </div>
      <p className="mt-3 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
