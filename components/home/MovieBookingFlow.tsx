"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShowtimePicker } from "@/components/home/ShowtimePicker";
import { SeatMap } from "@/components/home/SeatMap";
import { getShowtimeSeats, reserveSeats } from "@/services/homeService";
import type { GroupedShowtimes, ShowtimeSeat } from "@/types/home";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieBookingFlowProps {
  showtimes: GroupedShowtimes;
}

export function MovieBookingFlow({ showtimes }: MovieBookingFlowProps) {
  const router = useRouter();
  
  // Selection state
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<ShowtimeSeat[]>([]);
  
  // Seat loading state
  const [seats, setSeats] = useState<ShowtimeSeat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch seats when a showtime is selected
  useEffect(() => {
    if (!selectedShowtimeId) {
      setSeats([]);
      setSelectedSeats([]);
      return;
    }

    let isMounted = true;
    setIsLoadingSeats(true);
    setError(null);
    setSelectedSeats([]); // reset previous selections

    getShowtimeSeats(selectedShowtimeId)
      .then((res) => {
        if (isMounted) setSeats(res.data?.data ?? []);
      })
      .catch(() => {
        if (isMounted) setError("Could not load seats for this showtime.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingSeats(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedShowtimeId]);

  async function handleReserve() {
    if (!selectedShowtimeId || selectedSeats.length === 0) return;
    const seatIds = selectedSeats.map((s) => s.id);
    
    setIsReserving(true);
    setError(null);
    try {
      await reserveSeats({ showtime_id: selectedShowtimeId, seat_ids: seatIds });
      router.push(`/checkout?showtimeId=${selectedShowtimeId}&seats=${seatIds.join(",")}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not reserve seats. Please try again.";
      setError(msg);
      setIsReserving(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* 1. Showtime Selection */}
      <section>
        <h2 className="mb-5 text-lg font-bold text-white">1. Pick a Showtime</h2>
        <ShowtimePicker 
          showtimes={showtimes} 
          selectedShowtimeId={selectedShowtimeId}
          onSelectShowtime={setSelectedShowtimeId} 
        />
      </section>

      {/* 2. Seat Selection (only visible if a showtime is picked) */}
      {selectedShowtimeId && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-lg font-bold text-white">2. Select Your Seats</h2>
            {seats.length > 0 && !isLoadingSeats && (
              <span className="text-sm text-zinc-400">
                {seats.filter(s => s.status === 'available').length} available
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
            {isLoadingSeats ? (
              <div className="flex flex-col items-center justify-center py-20 text-amber-500">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-sm font-medium text-zinc-400">Loading seat map...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
                {error}
              </div>
            ) : seats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <p className="text-sm font-medium">No seats available for this showtime.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <SeatMap 
                  seats={seats} 
                  onSelectionChange={setSelectedSeats} 
                />
                
                <button
                  onClick={handleReserve}
                  disabled={selectedSeats.length === 0 || isReserving}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all shadow-lg",
                    selectedSeats.length > 0 && !isReserving
                      ? "bg-amber-500 text-zinc-950 shadow-amber-500/25 hover:bg-amber-400"
                      : "bg-zinc-800 text-zinc-500 opacity-60 cursor-not-allowed border border-zinc-700 shadow-none"
                  )}
                >
                  {isReserving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reserving...
                    </>
                  ) : selectedSeats.length > 0 ? (
                    <>
                      {`Reserve ${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''}`}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    "Select seats to continue"
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
