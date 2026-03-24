import type { LayoutSeat } from "@/types/seat-layout";

/** Active tool in the designer canvas. */
export type DesignerTool = "select" | "place" | "row" | "tier-paint";

/** Pan/zoom state for the SVG canvas. */
export interface CanvasViewport {
  /** Horizontal pan offset (SVG user-units). */
  panX: number;
  /** Vertical pan offset (SVG user-units). */
  panY: number;
  /** Zoom factor (1 = 100 %). */
  zoom: number;
}

/** Default dimensions & appearance for newly placed seats. */
export interface SeatDefaults {
  width: number;
  height: number;
  shape: string;
  rotation: number;
  is_active: boolean;
}

/** Configuration for the "Add Row" generator. */
export interface RowGeneratorConfig {
  seatCount: number;
  rowLabel: string;
  startX: number;
  startY: number;
  stepX: number;
  /** If provided, overrides the default tier. */
  priceTierId: number | null;
}

/** Re-export for convenience. */
export type { LayoutSeat };
