"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle, BadgePercent, Loader2 } from "lucide-react";

import { SeatMap } from "@/components/home/SeatMap";
import { ShowtimePicker } from "@/components/home/ShowtimePicker";
import { Stepper } from "@/components/ui/stepper";
import { ToastContainer, ToastItem } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getShowtimeSeats, reserveSeats } from "@/services/homeService";
import type { GroupedShowtimes, ShowtimeSeat } from "@/types/home";

interface MovieBookingFlowProps {
  movieId?: number | string;
  showtimes: GroupedShowtimes;
}

const steps = ["Select Showtime", "Choose Seats", "Confirm"];
const sectionTransition = {
  type: "spring",
  stiffness: 220,
  damping: 24,
  mass: 0.9,
} as const;

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || "USD"} ${value.toFixed(2)}`;
  }
}

export function MovieBookingFlow({
  movieId,
  showtimes,
}: MovieBookingFlowProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(
    null,
  );
  const [selectedSeats, setSelectedSeats] = useState<ShowtimeSeat[]>([]);
  const [seats, setSeats] = useState<ShowtimeSeat[]>([]);
  const [offerPercentage, setOfferPercentage] = useState(0);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isReservingSeats, setIsReservingSeats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0);

  const getSeatPrice = (seat: ShowtimeSeat) =>
    Number(seat.price ?? seat.price_tier?.price ?? 0);

  const getSeatCurrency = (seat?: ShowtimeSeat | null) =>
    seat?.currency ?? seat?.price_tier?.currency ?? "USD";

  const availableShowtimeIds = useMemo(() => {
    return new Set(
      Object.values(showtimes).flatMap((dateMap) =>
        Object.values(dateMap).flatMap((slots) => slots.map((slot) => slot.id)),
      ),
    );
  }, [showtimes]);

  const resolvedShowtimeId =
    selectedShowtimeId && availableShowtimeIds.has(selectedShowtimeId)
      ? selectedShowtimeId
      : null;

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled || selectedShowtimeId !== null) return;

      const lastId = Number(
        window.localStorage.getItem("cinema.lastSelectedShowtime") ?? "0",
      );

      if (lastId > 0 && availableShowtimeIds.has(lastId)) {
        setSelectedShowtimeId(lastId);
      } else {
        window.localStorage.removeItem("cinema.lastSelectedShowtime");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [availableShowtimeIds, selectedShowtimeId]);

  useEffect(() => {
    if (!resolvedShowtimeId) {
      window.localStorage.removeItem("cinema.lastSelectedShowtime");
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      setIsLoadingSeats(true);
      setError(null);
      getShowtimeSeats(resolvedShowtimeId)
        .then((res) => {
          if (cancelled) return;
          setSeats(res.data?.data ?? []);
          setOfferPercentage(Number(res.data?.offer_percentage ?? 0));
        })
        .catch(() => {
          if (cancelled) return;
          setOfferPercentage(0);
          setError("Could not load seat map for selected showtime.");
          setToasts((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              title: "Seat map error",
              message: "Timeout or server error while loading seats.",
              type: "error",
            },
          ]);
        })
        .finally(() => {
          if (cancelled) return;
          setIsLoadingSeats(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedShowtimeId]);

  const handleSelectionChange = useCallback((next: ShowtimeSeat[]) => {
    setSelectedSeats(next);
  }, []);

  const selectedTotal = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0),
    [selectedSeats],
  );
  const selectedCurrency = getSeatCurrency(selectedSeats[0]);
  const offerDiscount = useMemo(
    () => (selectedTotal * offerPercentage) / 100,
    [offerPercentage, selectedTotal],
  );
  const totalAfterOffer = useMemo(
    () => Math.max(selectedTotal - offerDiscount, 0),
    [offerDiscount, selectedTotal],
  );

  const selectedStep = steps[activeStep];

  const proceedToNext = () => {
    if (activeStep === 0 && !resolvedShowtimeId) return;
    if (activeStep === 1 && selectedSeats.length === 0) return;
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleProceedToCheckout = async () => {
    if (!resolvedShowtimeId || selectedSeats.length === 0) return;

    setIsReservingSeats(true);
    setError(null);

    try {
      await reserveSeats({
        showtime_id: resolvedShowtimeId,
        seat_ids: selectedSeats.map((seat) => seat.id),
      });

      router.push(
        `/checkout?showtimeId=${resolvedShowtimeId}&seats=${selectedSeats.map((seat) => seat.id).join(",")}&offerPercentage=${offerPercentage.toFixed(2)}`,
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not reserve seats. Please try again.";
      setError(message);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: "Reservation failed",
          message,
          type: "error",
        },
      ]);
    } finally {
      setIsReservingSeats(false);
    }
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="cinema-surface rounded-[30px] p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {selectedStep}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Premium experience, step {activeStep + 1} of {steps.length}.
        </p>
        <Stepper steps={steps} currentStepIndex={activeStep} />
      </motion.div>

      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <motion.div
          className="cinema-surface rounded-[30px] p-5"
          layout
          transition={sectionTransition}
        >
          <AnimatePresence mode="wait">
            {activeStep === 0 && (
              <motion.div
                key="showtime-step"
                className="space-y-5"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={sectionTransition}
              >
                <div className="rounded-[24px] border border-white/8 bg-black/10 p-4">
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    Step 1: Showtime
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Pick your preferred date, location, and time slot.
                  </p>
                </div>
                <ShowtimePicker
                  showtimes={showtimes}
                  selectedShowtimeId={resolvedShowtimeId}
                  onSelectShowtime={(id) => {
                    setSelectedShowtimeId(id);
                    setActiveStep(1);
                    setSeats([]);
                    setOfferPercentage(0);
                    window.localStorage.setItem(
                      "cinema.lastSelectedShowtime",
                      String(id),
                    );
                    if (movieId !== undefined) {
                      window.localStorage.setItem(
                        "cinema.lastSelectedMovie",
                        String(movieId),
                      );
                    }
                    setSelectedSeats([]);
                    setClearSelectionSignal((prev) => prev + 1);
                  }}
                />
              </motion.div>
            )}

            {activeStep === 1 && (
              <motion.div
                key="seat-step"
                className="space-y-5"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={sectionTransition}
              >
                <div className="rounded-[24px] border border-white/8 bg-black/10 p-4">
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    Step 2: Seats
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Tap seats to select. Premium seats glow and show exactly
                    what you get.
                  </p>
                </div>

                {offerPercentage > 0 ? (
                  <div className="flex items-start gap-3 rounded-[24px] border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    <BadgePercent className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <div>
                      <p className="font-semibold">
                        Showtime offer: {offerPercentage.toFixed(0)}% off
                      </p>
                      <p className="mt-1 text-emerald-200/80">
                        This showtime already carries a discount, so the totals
                        below reflect the reduced price.
                      </p>
                    </div>
                  </div>
                ) : null}

                {isLoadingSeats ? (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="cinema-surface overflow-hidden rounded-[28px] p-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2 pt-1">
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded-full bg-white/8" />
                          <div className="h-3 w-48 animate-pulse rounded-full bg-white/6" />
                        </div>
                        <div className="h-7 w-24 animate-pulse rounded-full bg-white/6" />
                      </div>
                      <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[var(--bg-primary)]/60 p-6">
                        <div className="mb-8 flex justify-center">
                          <div className="h-4 w-40 animate-pulse rounded-full bg-[var(--accent)]/16" />
                        </div>
                        <div className="space-y-3">
                          {Array.from({ length: 6 }).map((_, rowIndex) => (
                            <div
                              key={rowIndex}
                              className="flex items-center justify-center gap-2"
                            >
                              <div className="mr-3 h-4 w-4 animate-pulse rounded-full bg-white/8" />
                              {Array.from({ length: 8 }).map((_, seatIndex) => (
                                <div
                                  key={seatIndex}
                                  className="h-7 w-7 animate-pulse rounded-[10px] border border-white/8 bg-white/6"
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    className="rounded-[24px] border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  </motion.div>
                ) : (
                  <SeatMap
                    seats={seats}
                    onSelectionChange={handleSelectionChange}
                    maxSelectable={6}
                    clearSelectionSignal={clearSelectionSignal}
                  />
                )}
              </motion.div>
            )}

            {activeStep === 2 && (
              <motion.div
                key="confirm-step"
                className="space-y-5"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={sectionTransition}
              >
                <div className="rounded-[24px] border border-white/8 bg-black/10 p-4">
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    Step 3: Confirm & Reserve
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Review your seats and reserve them before moving to checkout.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-black/10 p-4 space-y-3">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Selected seats: {selectedSeats.length}
                  </p>
                  <ul className="space-y-1 text-sm text-[var(--text-primary)]">
                    {selectedSeats.map((seat, index) => (
                      <motion.li
                        key={seat.id}
                        className="flex items-center justify-between rounded-xl bg-white/6 px-3 py-2 transition-colors duration-300 hover:bg-white/10"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: index * 0.03 }}
                      >
                        <span>
                          {seat.row_label ?? seat.row ?? "?"}
                          {seat.col_label ?? seat.number ?? ""}
                        </span>
                        <span>{formatMoney(getSeatPrice(seat), selectedCurrency)}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm font-medium text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span>{formatMoney(selectedTotal, selectedCurrency)}</span>
                  </div>
                  {offerPercentage > 0 ? (
                    <div className="flex items-center justify-between text-sm font-medium text-emerald-300">
                      <span>Showtime discount ({offerPercentage.toFixed(0)}%)</span>
                      <span>-{formatMoney(offerDiscount, selectedCurrency)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-lg font-bold text-[var(--text-primary)]">
                    <span>Total</span>
                    <motion.span
                      key={`${selectedCurrency}-${totalAfterOffer}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      {formatMoney(totalAfterOffer, selectedCurrency)}
                    </motion.span>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-[24px] border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.aside
          className="cinema-surface rounded-[30px] p-5"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Quick Review
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {selectedStep} ready
          </p>
          <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Showtime</span>
              <span>{resolvedShowtimeId ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Seats selected</span>
              <span>{selectedSeats.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(selectedTotal, selectedCurrency)}</span>
            </div>
            {offerPercentage > 0 ? (
              <>
                <div className="flex justify-between text-emerald-300">
                  <span>Showtime offer</span>
                  <span>-{formatMoney(offerDiscount, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between font-medium text-[var(--text-primary)]">
                  <span>Total</span>
                  <span>{formatMoney(totalAfterOffer, selectedCurrency)}</span>
                </div>
              </>
            ) : null}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={proceedToNext}
              disabled={
                (activeStep === 0 && !resolvedShowtimeId) ||
                (activeStep === 1 && selectedSeats.length === 0) ||
                activeStep === 2
              }
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                (activeStep === 0 && resolvedShowtimeId) ||
                  (activeStep === 1 && selectedSeats.length > 0)
                  ? "cinema-ring bg-[var(--accent)] text-black hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                  : "cursor-not-allowed bg-white/8 text-[var(--text-secondary)]",
              )}
            >
              {activeStep === 2
                ? "Review complete"
                : `Proceed to ${steps[activeStep + 1]}`}
              <ArrowRight className="ml-2 inline-block h-4 w-4" />
            </button>

            <button
              onClick={activeStep > 0 ? goBack : undefined}
              className="rounded-2xl border border-white/8 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-all duration-300 hover:bg-white/6 enabled:hover:-translate-y-0.5"
              disabled={activeStep === 0 || isReservingSeats}
            >
              Back
            </button>

            {activeStep === 2 && (
              <motion.button
                onClick={() => void handleProceedToCheckout()}
                disabled={selectedSeats.length === 0 || isReservingSeats}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {isReservingSeats ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reserving seats...
                  </span>
                ) : (
                  "Proceed to Checkout"
                )}
              </motion.button>
            )}
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}
