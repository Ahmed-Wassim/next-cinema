"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Branch tabs */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Location
        </p>
        <div className="flex flex-wrap gap-2">
          {branches.map((b, index) => (
            <motion.button
              key={b}
              onClick={() => handleBranchChange(b)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
                activeBranch === b
                  ? "cinema-ring border-[var(--accent)]/40 bg-[var(--accent)]/12 text-[var(--text-primary)]"
                  : "border-white/8 bg-white/5 text-[var(--text-secondary)] hover:-translate-y-0.5 hover:border-[var(--accent)]/24 hover:bg-black/10 hover:text-[var(--text-primary)]",
              )}
            >
              {b}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Date tabs */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Date
        </p>
        <div className="flex flex-wrap gap-2">
          {dates.map((d, index) => (
            <motion.button
              key={d}
              onClick={() => setActiveDate(d)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-300",
                activeDate === d
                  ? "border-[var(--accent)]/35 bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[0_12px_30px_rgba(2,6,23,0.2)]"
                  : "border-white/8 bg-white/5 text-[var(--text-secondary)] hover:-translate-y-0.5 hover:border-[var(--accent)]/24 hover:bg-black/10 hover:text-[var(--text-primary)]",
              )}
            >
              {formatDate(d)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Showtime
        </p>
        {slots.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-sm">
            No showtimes on this date.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {slots.map((s, index) => (
              <motion.button
                key={s.id}
                onClick={() => {
                  if (onSelectShowtime) onSelectShowtime(s.id);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 24,
                  delay: index * 0.04,
                }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition-all duration-300",
                  selectedShowtimeId === s.id
                    ? "cinema-ring border-[var(--accent)]/45 bg-[var(--accent)]/10 text-[var(--text-primary)]"
                    : "border-white/8 bg-white/5 text-[var(--text-secondary)] hover:-translate-y-1 hover:border-[var(--accent)]/35 hover:bg-black/10 hover:text-[var(--text-primary)]",
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:from-[var(--accent)]/14" />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div>
                    <span className="block text-lg font-bold text-[var(--text-primary)]">
                      {formatTime(s.start_time)}
                    </span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      Showtime
                    </span>
                  </div>
                  {s.available_seats !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        s.available_seats > 0
                          ? "bg-emerald-500/12 text-emerald-300"
                          : "bg-red-500/12 text-red-300",
                      )}
                    >
                      {s.available_seats > 0
                        ? `${s.available_seats} left`
                        : "Full"}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
