"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ShowtimePicker } from "@/components/home/ShowtimePicker";
import { SeatMap } from "@/components/home/SeatMap";
import { getShowtimeSeats, reserveSeats } from "@/services/homeService";
import type { GroupedShowtimes, ShowtimeSeat } from "@/types/home";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import { ToastContainer, ToastItem } from "@/components/ui/toast";

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
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
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

  useEffect(() => {
    const lastId = Number(
      window.localStorage.getItem("cinema.lastSelectedShowtime") ?? "0",
    );
    if (lastId > 0 && availableShowtimeIds.has(lastId)) {
      setSelectedShowtimeId(lastId);
      setActiveStep(1);
    } else {
      window.localStorage.removeItem("cinema.lastSelectedShowtime");
    }
  }, [availableShowtimeIds]);

  useEffect(() => {
    if (!selectedShowtimeId) return;
    if (availableShowtimeIds.has(selectedShowtimeId)) return;

    setSelectedShowtimeId(null);
    setSelectedSeats([]);
    setSeats([]);
    setActiveStep(0);
    window.localStorage.removeItem("cinema.lastSelectedShowtime");
  }, [availableShowtimeIds, selectedShowtimeId]);

  useEffect(() => {
    if (!selectedShowtimeId) {
      setSeats([]);
      setSelectedSeats([]);
      return;
    }

    setIsLoadingSeats(true);
    setError(null);
    getShowtimeSeats(selectedShowtimeId)
      .then((res) => {
        setSeats(res.data?.data ?? []);
      })
      .catch(() => {
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
      .finally(() => setIsLoadingSeats(false));
  }, [selectedShowtimeId]);

  const selectedTotal = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0),
    [selectedSeats],
  );

  const selectedCurrency = getSeatCurrency(selectedSeats[0]);

  const selectedStep = steps[activeStep];

  const proceedToNext = () => {
    if (activeStep === 0 && !selectedShowtimeId) return;
    if (activeStep === 1 && selectedSeats.length === 0) return;
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleReserve = async () => {
    if (!selectedShowtimeId || selectedSeats.length === 0) return;
    setIsReserving(true);
    setError(null);

    try {
      await reserveSeats({
        showtime_id: selectedShowtimeId,
        seat_ids: selectedSeats.map((seat) => seat.id),
      });
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: "Reserved",
          message: "Seats reserved successfully. Redirecting to checkout.",
          type: "success",
        },
      ]);
      router.push(
        `/checkout?showtimeId=${selectedShowtimeId}&seats=${selectedSeats.map((s) => s.id).join(",")}`,
      );
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not reserve seats. Please try again.";
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
      setIsReserving(false);
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
                  selectedShowtimeId={selectedShowtimeId}
                  onSelectShowtime={(id) => {
                    setSelectedShowtimeId(id);
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

                        <div className="mt-8 flex items-center justify-end gap-2">
                          <div className="h-8 w-8 animate-pulse rounded-xl bg-white/6" />
                          <div className="h-8 w-8 animate-pulse rounded-xl bg-white/6" />
                          <div className="h-8 w-8 animate-pulse rounded-xl bg-white/6" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 px-1">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-pulse rounded-md bg-white/8" />
                          <div className="h-3 w-20 animate-pulse rounded-full bg-white/6" />
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[22px] border border-white/8 bg-white/5 px-5 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="h-4 w-36 animate-pulse rounded-full bg-white/8" />
                        <div className="h-4 w-20 animate-pulse rounded-full bg-[var(--accent)]/14" />
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
                    onSelectionChange={setSelectedSeats}
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
                    Step 3: Confirm & Pay
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Review your seats and complete payment with the secure flow.
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
                        <span>
                          {getSeatCurrency(seat)}{" "}
                          {getSeatPrice(seat).toFixed(2)}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-lg font-bold text-[var(--text-primary)]">
                    <span>Total</span>
                    <motion.span
                      key={`${selectedCurrency}-${selectedTotal}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      {selectedCurrency} {selectedTotal.toFixed(2)}
                    </motion.span>
                  </div>
                </div>
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
              <span>{selectedShowtimeId ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Seats selected</span>
              <span>{selectedSeats.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                {selectedCurrency} {selectedTotal.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={proceedToNext}
              disabled={
                (activeStep === 0 && !selectedShowtimeId) ||
                (activeStep === 1 && selectedSeats.length === 0) ||
                activeStep === 2
              }
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                (activeStep === 0 && selectedShowtimeId) ||
                  (activeStep === 1 && selectedSeats.length > 0)
                  ? "cinema-ring bg-[var(--accent)] text-black hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                  : "bg-white/8 text-[var(--text-secondary)] cursor-not-allowed",
              )}
            >
              {activeStep === 2
                ? "Ready for Payment"
                : `Proceed to ${steps[activeStep + 1]}`}
              <ArrowRight className="ml-2 inline-block h-4 w-4" />
            </button>

            <button
              onClick={activeStep > 0 ? goBack : undefined}
              className="rounded-2xl border border-white/8 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-all duration-300 hover:bg-white/6 enabled:hover:-translate-y-0.5"
              disabled={activeStep === 0}
            >
              Back
            </button>

            {activeStep === 2 && (
              <motion.button
                onClick={handleReserve}
                disabled={isReserving || selectedSeats.length === 0}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {isReserving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Reserving...
                  </span>
                ) : (
                  "Confirm Booking"
                )}
              </motion.button>
            )}
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}
