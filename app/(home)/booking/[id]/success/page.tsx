"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Sparkles,
  Ticket,
} from "lucide-react";

import { TicketCard } from "@/components/home/TicketCard";
import { getBookingConfirmation } from "@/services/homeService";
import type { BookingConfirmation } from "@/types/home";

interface Props {
  params: Promise<{ id: string }>;
}

export default function BookingSuccessPage({ params }: Props) {
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { id } = await params;
        const res = await getBookingConfirmation(id);
        setBooking(res.data?.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchBooking();
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300/80">
            Confirming Booking
          </p>
          <h1 className="mt-3 text-2xl font-bold text-white">
            Finalizing your ticket details
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            We&apos;re fetching your receipt, seat details, and payment status.
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    notFound();
  }

  const movieTitle = booking.movie?.title ?? "Your Movie";
  const branch = booking.showtime?.branch;
  const hall = booking.showtime?.hall;
  const transactionRef = booking.payment?.transaction_ref;

  return (
    <div className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_48%),radial-gradient(circle_at_20%_30%,rgba(239,68,68,0.18),transparent_30%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(24,24,27,0.94),rgba(10,10,10,0.88))] shadow-[0_28px_90px_rgba(0,0,0,0.48)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-10 lg:py-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Payment Successful
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                Your night at the cinema is officially booked.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
                {movieTitle} is confirmed. Keep this page handy for entry and
                arrive a few minutes early to settle in before showtime.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <DetailPill icon={<Ticket className="h-4 w-4" />}>
                  Booking #{booking.id}
                </DetailPill>
                {branch ? <DetailPill>{branch}</DetailPill> : null}
                {hall ? <DetailPill>{hall}</DetailPill> : null}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/movies"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Browse More Movies
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  Save Confirmation
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-300">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.24em]">
                  What Happens Next
                </p>
              </div>

              <div className="mt-6 space-y-5">
                <TimelineItem
                  title="Check your details"
                  body="Review the movie, hall, showtime, and seat information below before you head out."
                />
                <TimelineItem
                  title="Show your reference"
                  body="Present your booking reference or payment confirmation when you arrive at the cinema."
                />
                <TimelineItem
                  title="Enjoy the show"
                  body="Doors usually open a little before showtime, so arriving early gives you time to settle in."
                />
              </div>

              {transactionRef ? (
                <div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">
                    Payment Reference
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-zinc-100">
                    {transactionRef}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <TicketCard booking={booking} />
      </div>
    </div>
  );
}

function DetailPill({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-zinc-200">
      {icon}
      <span>{children}</span>
    </div>
  );
}

function TimelineItem({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.75)]" />
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{body}</p>
      </div>
    </div>
  );
}
