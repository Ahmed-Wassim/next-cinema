import type { LayoutSeat } from "@/types/seat-layout";

function seatCenter(s: LayoutSeat) {
  return {
    x: s.pos_x + s.width / 2,
    y: s.pos_y + s.height / 2,
  };
}

function sortByRowThenNumber(a: LayoutSeat, b: LayoutSeat) {
  const rr = a.row.localeCompare(b.row);
  if (rr !== 0) return rr;
  const na = parseInt(a.number, 10);
  const nb = parseInt(b.number, 10);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.number.localeCompare(b.number);
}

export interface CurveAlongRowOptions {
  /** Offset of control point from chord midpoint, along perpendicular (logical units). Positive = toward screen (+Y). */
  bulge: number;
  /** If true, set each seat's `rotation` to tangent angle (degrees, canvas coords). */
  rotateWithArc: boolean;
}

/**
 * Places selected seats evenly along a quadratic Bézier from first → last center,
 * with control point offset perpendicular to the chord (bulge toward screen or away).
 */
export function curveSelectedSeatsAlongRow(
  seats: LayoutSeat[],
  selectedKeys: Set<string>,
  options: CurveAlongRowOptions,
): LayoutSeat[] {
  const picked = seats.filter((s) => selectedKeys.has(s.layoutKey));
  if (picked.length < 2) return seats;

  const sorted = [...picked].sort(sortByRowThenNumber);
  const p0 = seatCenter(sorted[0]!);
  const p1 = seatCenter(sorted[sorted.length - 1]!);
  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return seats;

  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const cx = mx + nx * options.bulge;
  const cy = my + ny * options.bulge;

  const keyToIndex = new Map(sorted.map((s, i) => [s.layoutKey, i]));

  return seats.map((s) => {
    const i = keyToIndex.get(s.layoutKey);
    if (i === undefined) return s;

    const t = sorted.length === 1 ? 0 : i / (sorted.length - 1);
    const omt = 1 - t;
    const bx = omt * omt * p0.x + 2 * omt * t * cx + t * t * p1.x;
    const by = omt * omt * p0.y + 2 * omt * t * cy + t * t * p1.y;

    let rotation = s.rotation;
    if (options.rotateWithArc) {
      const dbx = 2 * omt * (cx - p0.x) + 2 * t * (p1.x - cx);
      const dby = 2 * omt * (cy - p0.y) + 2 * t * (p1.y - cy);
      rotation = (Math.atan2(dby, dbx) * 180) / Math.PI;
    }

    return {
      ...s,
      pos_x: Math.max(0, bx - s.width / 2),
      pos_y: Math.max(0, by - s.height / 2),
      rotation,
    };
  });
}
