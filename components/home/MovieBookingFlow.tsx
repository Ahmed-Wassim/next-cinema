"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShowtimePicker } from "@/components/home/ShowtimePicker";
import { SeatMap } from "@/components/home/SeatMap";
import { getShowtimeSeats, reserveSeats } from "@/services/homeService";
import type { GroupedShowtimes, ShowtimeSeat } from "@/types/home";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import { ToastContainer, ToastItem } from "@/components/ui/toast";

interface MovieBookingFlowProps {
  showtimes: GroupedShowtimes;
}

const steps = ["Select Showtime", "Choose Seats", "Confirm"];

export function MovieBookingFlow({ showtimes }: MovieBookingFlowProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<ShowtimeSeat[]>([]);
  const [seats, setSeats] = useState<ShowtimeSeat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0);

  useEffect(() => {
    const lastId = Number(window.localStorage.getItem("cinema.lastSelectedShowtime") ?? "0");
    if (lastId > 0) {
      setSelectedShowtimeId(lastId);
      setActiveStep(1);
    }
  }, []);

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
    () =>
      selectedSeats.reduce((sum, seat) => sum + Number(seat.price_tier?.price || 0), 0),
    [selectedSeats],
  );

  const selectedCurrency = selectedSeats[0]?.price_tier?.currency ?? "USD";

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
      router.push(`/checkout?showtimeId=${selectedShowtimeId}&seats=${selectedSeats.map((s) => s.id).join(",")}`);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not reserve seats. Please try again.";
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
    <div className="space-y-8">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)]/70 p-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedStep}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Premium experience, step {activeStep + 1} of {steps.length}.</p>
        <Stepper steps={steps} currentStepIndex={activeStep} />
      </div>

      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          {activeStep === 0 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/30 p-4">
                <p className="text-sm font-semibold text-[var(--accent)]">Step 1: Showtime</p>
                <p className="text-sm text-[var(--text-secondary)]">Pick your preferred date, location, and time slot.</p>
              </div>
              <ShowtimePicker
                showtimes={showtimes}
                selectedShowtimeId={selectedShowtimeId}
                onSelectShowtime={(id) => {
                  setSelectedShowtimeId(id);
                  window.localStorage.setItem("cinema.lastSelectedShowtime", String(id));
                  setSelectedSeats([]);
                  setClearSelectionSignal((prev) => prev + 1);
                }}
              />
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/30 p-4">
                <p className="text-sm font-semibold text-[var(--accent)]">Step 2: Seats</p>
                <p className="text-sm text-[var(--text-secondary)]">Tap seats to select. Premium seats glow and show exactly what you get.</p>
              </div>

              {isLoadingSeats ? (
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-56 animate-pulse rounded-2xl bg-[var(--bg-primary)]" />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
                  <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
                </div>
              ) : (
                <SeatMap
                  seats={seats}
                  onSelectionChange={setSelectedSeats}
                  maxSelectable={6}
                  clearSelectionSignal={clearSelectionSignal}
                />
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/30 p-4">
                <p className="text-sm font-semibold text-[var(--accent)]">Step 3: Confirm & Pay</p>
                <p className="text-sm text-[var(--text-secondary)]">Review your seats and complete payment with the secure flow.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/20 p-4 space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">Selected seats: {selectedSeats.length}</p>
                <ul className="space-y-1 text-sm text-[var(--text-primary)]">
                  {selectedSeats.map((seat) => (
                    <li key={seat.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)]/50 px-3 py-2">
                      <span>{seat.row_label ?? seat.row ?? "?"}{seat.col_label ?? seat.number ?? ""}</span>
                      <span>{selectedCurrency} {Number(seat.price_tier?.price || 0).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-lg font-bold text-[var(--text-primary)]">
                  <span>Total</span>
                  <span>{selectedCurrency} {selectedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Quick Review</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{selectedStep} ready</p>
          <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between"><span>Showtime</span><span>{selectedShowtimeId ?? "-"}</span></div>
            <div className="flex justify-between"><span>Seats selected</span><span>{selectedSeats.length}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>{selectedCurrency} {selectedTotal.toFixed(2)}</span></div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={proceedToNext}
              disabled={(activeStep === 0 && !selectedShowtimeId) || (activeStep === 1 && selectedSeats.length === 0) || activeStep === 2}
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-semibold transition",
                (activeStep === 0 && selectedShowtimeId) || (activeStep === 1 && selectedSeats.length > 0)
                  ? "bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]"
                  : "bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed",
              )}
            >
              {activeStep === 2 ? "Ready for Payment" : `Proceed to ${steps[activeStep + 1]}`}
              <ArrowRight className="ml-2 inline-block h-4 w-4" />
            </button>

            <button
              onClick={activeStep > 0 ? goBack : undefined}
              className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
              disabled={activeStep === 0}
            >
              Back
            </button>

            {activeStep === 2 && (
              <button
                onClick={handleReserve}
                disabled={isReserving || selectedSeats.length === 0}
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
              >
                {isReserving ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Reserving...</span>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
