import type { CustomRowInput } from "@/types/seat-builder";
import type {
  BulkSeatItem,
  RowGrowth,
  SeatNumberingMode,
} from "@/types/seat-bulk";

export interface SeatGridConfig {
  hall_id: number;
  price_tier_id: number;
  row_count: number;
  seats_per_row: number;
  /** First row label, e.g. "A". */
  row_start_letter: string;
  /** Global starting seat number for first cell (row 0, col 0 in LTR). */
  seat_number_start: number;
  numbering: SeatNumberingMode;
  row_growth: RowGrowth;
  /** If true, even rows LTR layout, odd rows mirror X (serpentine layout). */
  mirror_alternating_rows: boolean;
  start_pos_x: number;
  start_pos_y: number;
  step_x: number;
  step_y: number;
  width: number;
  height: number;
  shape: string;
  rotation: number;
  is_active: boolean;
}

function rowLabel(rowIndex: number, startLetter: string): string {
  const ch = startLetter.trim().toUpperCase().charAt(0);
  const code = ch >= "A" && ch <= "Z" ? ch.charCodeAt(0) : 65;
  return String.fromCharCode(code + rowIndex);
}

/** Seat number string for row r, visual column s (0 = left). */
function seatNumber(cfg: SeatGridConfig, r: number, s: number): string {
  const n = cfg.seats_per_row;
  const along =
    cfg.numbering === "ltr"
      ? s
      : cfg.numbering === "rtl"
        ? n - 1 - s
        : r % 2 === 0
          ? s
          : n - 1 - s;
  const value = cfg.seat_number_start + r * n + along;
  return String(value);
}

export function generateBulkSeatsFromGrid(cfg: SeatGridConfig): BulkSeatItem[] {
  const seats: BulkSeatItem[] = [];
  let sort = 1;
  const { row_count, seats_per_row } = cfg;

  for (let r = 0; r < row_count; r++) {
    const row = rowLabel(r, cfg.row_start_letter);
    const mirrorRow = cfg.mirror_alternating_rows && r % 2 === 1;

    for (let s = 0; s < seats_per_row; s++) {
      const visualS = mirrorRow ? seats_per_row - 1 - s : s;
      const pos_x = cfg.start_pos_x + visualS * cfg.step_x;
      const pos_y =
        cfg.row_growth === "down"
          ? cfg.start_pos_y + r * cfg.step_y
          : cfg.start_pos_y - r * cfg.step_y;
      const number = seatNumber(cfg, r, s);

      seats.push({
        hall_id: cfg.hall_id,
        price_tier_id: cfg.price_tier_id,
        row,
        number,
        pos_x,
        pos_y,
        rotation: cfg.rotation,
        width: cfg.width,
        height: cfg.height,
        shape: cfg.shape,
        sort_order: sort++,
        is_active: cfg.is_active,
      });
    }
  }

  return seats;
}

/** Build rows + positions from current uniform settings (for switching to custom mode). */
export function customRowsFromUniformGrid(
  cfg: SeatGridConfig,
): CustomRowInput[] {
  const rows: CustomRowInput[] = [];
  for (let r = 0; r < cfg.row_count; r++) {
    const row = rowLabel(r, cfg.row_start_letter);
    const mirrorRow = cfg.mirror_alternating_rows && r % 2 === 1;
    const startY =
      cfg.row_growth === "down"
        ? cfg.start_pos_y + r * cfg.step_y
        : cfg.start_pos_y - r * cfg.step_y;
    rows.push({
      row,
      seat_count: cfg.seats_per_row,
      start_pos_x: cfg.start_pos_x,
      start_pos_y: startY,
      step_x: cfg.step_x,
      mirror: mirrorRow,
      price_tier_id: null,
    });
  }
  return rows;
}

/** Best-effort uniform guess when switching back from custom (may need manual tuning). */
export function guessUniformFromCustomRows(
  rows: CustomRowInput[],
): Pick<
  SeatGridConfig,
  | "row_count"
  | "seats_per_row"
  | "start_pos_x"
  | "start_pos_y"
  | "step_x"
  | "step_y"
  | "row_start_letter"
  | "mirror_alternating_rows"
> | null {
  if (rows.length === 0) return null;
  const maxSeats = Math.max(1, ...rows.map((r) => Math.max(0, r.seat_count)));
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  const dy =
    rows.length > 1
      ? (last.start_pos_y - first.start_pos_y) / (rows.length - 1)
      : 5;

  return {
    row_count: rows.length,
    seats_per_row: maxSeats,
    start_pos_x: first.start_pos_x,
    start_pos_y: first.start_pos_y,
    step_x: first.step_x || 1,
    step_y: Math.abs(dy) > 0.01 ? Math.abs(dy) : 5,
    row_start_letter: (first.row.trim().charAt(0) || "A").toUpperCase(),
    mirror_alternating_rows: rows.some((r) => r.mirror),
  };
}

/**
 * Irregular hall: each row has its own count, X/Y origin, horizontal pitch, mirror, optional tier.
 * Seat **number** strings are assigned in order: row 1 left→right, then row 2, … (global counter).
 */
export function generateBulkSeatsFromCustomRows(payload: {
  hall_id: number;
  default_price_tier_id: number;
  rows: CustomRowInput[];
  seat_number_start: number;
  width: number;
  height: number;
  shape: string;
  rotation: number;
  is_active: boolean;
}): BulkSeatItem[] {
  const seats: BulkSeatItem[] = [];
  let sort = 1;
  let num = Math.max(0, Math.floor(payload.seat_number_start));

  for (const spec of payload.rows) {
    const count = Math.max(0, Math.floor(spec.seat_count));
    const tier = spec.price_tier_id ?? payload.default_price_tier_id;
    const mirror = spec.mirror ?? false;
    const label = spec.row.trim() || "?";

    for (let s = 0; s < count; s++) {
      const visualS = mirror ? count - 1 - s : s;
      const pos_x = spec.start_pos_x + visualS * spec.step_x;
      const pos_y = spec.start_pos_y;

      seats.push({
        hall_id: payload.hall_id,
        price_tier_id: tier,
        row: label,
        number: String(num++),
        pos_x,
        pos_y,
        rotation: payload.rotation,
        width: payload.width,
        height: payload.height,
        shape: payload.shape,
        sort_order: sort++,
        is_active: payload.is_active,
      });
    }
  }

  return seats;
}
