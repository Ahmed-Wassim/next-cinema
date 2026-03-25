/** Payload item for POST /seats/bulk (matches dashboard API). */
export interface BulkSeatItem {
  hall_id: number;
  section_id: number;
  price_tier_id: number;
  row: string;
  number: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  width: number;
  height: number;
  shape: string;
  sort_order: number;
  is_active: boolean;
  label?: string;
}

export type SeatNumberingMode = "ltr" | "rtl" | "serpentine";

export type RowGrowth = "down" | "up";
