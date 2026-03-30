"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GroupedShowtimes } from "@/types/home";
import { cn } from "@/lib/utils";

interface ShowtimePickerProps {
  showtimes: GroupedShowtimes;
  selectedShowtimeId?: number | null;
  onSelectShowtime?: (id: number) => void;
}

export function ShowtimePicker({ 
  showtimes, 
  selectedShowtimeId, 
  onSelectShowtime 
}: ShowtimePickerProps) {
  const branches = Object.keys(showtimes);
  const [activeBranch, setActiveBranch] = useState(branches[0] ?? "");

  const dateMap = activeBranch ? showtimes[activeBranch] ?? {} : {};
  const dates = Object.keys(dateMap);
  const [activeDate, setActiveDate] = useState(dates[0] ?? "");

  const slots = (activeDate ? dateMap[activeDate] : undefined) ?? [];

  function handleBranchChange(branch: string) {
    setActiveBranch(branch);
    const newDates = Object.keys(showtimes[branch] ?? {});
    setActiveDate(newDates[0] ?? "");
  }

  function formatDate(raw: string) {
    try {
      return new Date(raw).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return raw;
    }
  }

  function formatTime(raw: string) {
    try {
      return new Date(raw).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return raw;
    }
  }

  if (branches.length === 0) {
    return (
      <p className="text-zinc-500 text-sm">No showtimes currently available.</p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Branch tabs */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Location
        </p>
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => handleBranchChange(b)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeBranch === b
                  ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Date tabs */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Date
        </p>
        <div className="flex flex-wrap gap-2">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDate(d)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeDate === d
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              )}
            >
              {formatDate(d)}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Showtime
        </p>
        {slots.length === 0 ? (
          <p className="text-zinc-500 text-sm">No showtimes on this date.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {slots.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  if (onSelectShowtime) onSelectShowtime(s.id);
                }}
                className={cn(
                  "group relative overflow-hidden rounded-xl border px-5 py-3 text-sm font-semibold transition-all",
                  selectedShowtimeId === s.id
                    ? "border-amber-500 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-amber-500/60 hover:bg-zinc-700 hover:text-white"
                )}
              >
                <span className="relative z-10">{formatTime(s.start_time)}</span>
                {s.available_seats !== undefined && (
                  <span
                    className={cn(
                      "relative z-10 ml-2 text-xs font-normal",
                      s.available_seats > 0
                        ? "text-green-400"
                        : "text-red-400"
                    )}
                  >
                    {s.available_seats > 0
                      ? `${s.available_seats} left`
                      : "Full"}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:to-amber-600/5 transition-all duration-300" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
