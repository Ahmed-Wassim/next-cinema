import type { PriceTier } from "@/types/price-tier";

export interface Seat {
  id: number;
  hall_section_id: number;
  hall_id?: number;
  section_id?: number;
  price_tier_id?: number;
  price_tier?: PriceTier | null;
  row_label?: string;
  col_label?: string;
  row?: string;
  number?: string;
  label?: string;
  pos_x?: number | string;
  pos_y?: number | string;
  rotation?: number | string;
  width?: number | string;
  height?: number | string;
  shape?: string;
  sort_order?: number;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
