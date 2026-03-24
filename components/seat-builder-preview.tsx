"use client";

import { cn } from "@/lib/utils";
import type { BulkSeatItem } from "@/types/seat-bulk";

type Props = {
  seats: BulkSeatItem[];
  /** Optional map tier id → hex color for chips */
  tierColors?: Map<number, string>;
  className?: string;
};

export function SeatBuilderPreview({ seats, tierColors, className }: Props) {
  if (seats.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400",
          className,
        )}
      >
        No seats in preview — adjust the form.
      </div>
    );
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of seats) {
    minX = Math.min(minX, s.pos_x);
    minY = Math.min(minY, s.pos_y);
    maxX = Math.max(maxX, s.pos_x + s.width);
    maxY = Math.max(maxY, s.pos_y + s.height);
  }
  const bw = Math.max(maxX - minX, 1);
  const bh = Math.max(maxY - minY, 1);

  const pad = 12;
  const viewW = 400;
  const viewH = 260;
  const scale = Math.min(
    (viewW - pad * 2) / bw,
    (viewH - pad * 2) / bh,
    24,
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950/[0.02] dark:border-zinc-800 dark:bg-zinc-900/40",
        className,
      )}
    >
      <div className="border-b border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        Live preview (same coordinates as Hall layout)
      </div>
      <div
        className="relative mx-auto"
        style={{ width: viewW, height: viewH }}
      >
        <svg
          width={viewW}
          height={viewH}
          className="block text-zinc-300 dark:text-zinc-600"
          aria-hidden
        >
          <rect
            x={0.5}
            y={0.5}
            width={viewW - 1}
            height={viewH - 1}
            rx={8}
            fill="none"
            stroke="currentColor"
            strokeDasharray="4 3"
            opacity={0.5}
          />
        </svg>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ padding: pad }}
        >
          <div className="relative h-full w-full">
            {seats.map((s, i) => {
              const fill =
                tierColors?.get(s.price_tier_id) ?? "rgba(113,113,122,0.35)";
              const left = (s.pos_x - minX) * scale;
              const top = (s.pos_y - minY) * scale;
              const sw = Math.max(s.width * scale, 4);
              const sh = Math.max(s.height * scale, 4);
              return (
                <div
                  key={`${s.row}-${s.number}-${i}`}
                  className="absolute rounded-sm border border-zinc-400/80 dark:border-zinc-500"
                  style={{
                    left,
                    top,
                    width: sw,
                    height: sh,
                    backgroundColor: fill,
                  }}
                  title={`${s.row}${s.number}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
