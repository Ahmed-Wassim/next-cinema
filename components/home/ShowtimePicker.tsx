"use client";

import { useState } from "react";
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
  onSelectShowtime,
}: ShowtimePickerProps) {
  const branches = Object.keys(showtimes);
  const [activeBranch, setActiveBranch] = useState(branches[0] ?? "");

  const dateMap = activeBranch ? (showtimes[activeBranch] ?? {}) : {};
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
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4 text-center text-[var(--text-secondary)]">
        <p className="text-sm font-semibold">
          No showtimes currently available.
        </p>
        <p className="text-xs">
          Try another date or branch for the latest schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Branch tabs */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
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
                  ? "bg-[var(--accent)] text-black shadow-md shadow-[var(--accent)]/30"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]",
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Date tabs */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
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
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]",
              )}
            >
              {formatDate(d)}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Showtime
        </p>
        {slots.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-sm">No showtimes on this date.</p>
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
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)] shadow-[0_0_15px_var(--accent-shadow)]"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent)]/60 hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]",
                )}
              >
                <span className="relative z-10">
                  {formatTime(s.start_time)}
                </span>
                {s.available_seats !== undefined && (
                  <span
                    className={cn(
                      "relative z-10 ml-2 text-xs font-normal",
                      s.available_seats > 0 ? "text-green-400" : "text-red-400",
                    )}
                  >
                    {s.available_seats > 0
                      ? `${s.available_seats} left`
                      : "Full"}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/10 group-hover:to-[var(--accent)]/5 transition-all duration-300" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
