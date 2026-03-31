import type { BulkSeatItem } from "@/types/seat-bulk";

/** Seat with a stable client id for list keys and drag tracking. */
export type LayoutSeat = BulkSeatItem & { layoutKey: string; id?: number };

/** Strip internal tracking keys and redundant fields (e.g., hall_id) before API sync. */
export function stripLayoutKey(seat: LayoutSeat): Omit<BulkSeatItem, "hall_id"> & { id?: number } {
  const { layoutKey: _k, hall_id: _h, ...rest } = seat;
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
