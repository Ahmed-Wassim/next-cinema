import type { BulkSeatItem } from "@/types/seat-bulk";

/** Seat with a stable client id for list keys and drag tracking. */
export type LayoutSeat = BulkSeatItem & { layoutKey: string; id?: number };

export function stripLayoutKey(seat: LayoutSeat): BulkSeatItem & { id?: number } {
  const { layoutKey: _k, ...rest } = seat;
  return rest;
}

export function withLayoutKeys(seats: BulkSeatItem[]): LayoutSeat[] {
  return seats.map((s) => ({
    ...s,
    layoutKey:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  }));
}
