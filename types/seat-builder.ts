/** Bulk builder page: one repeating grid vs row-by-row placement. */
export type SeatBuilderMode = "uniform" | "custom";

/** One row in custom mode (UI row; `id` is client-only). */
export interface CustomBuilderRow {
  id: string;
  row: string;
  seat_count: number;
  start_pos_x: number;
  start_pos_y: number;
  step_x: number;
  mirror: boolean;
  /** `null` = use global default tier from the form */
  price_tier_id: number | null;
}

/** Payload row without React `id` (for generators). */
export type CustomRowInput = Omit<CustomBuilderRow, "id">;
