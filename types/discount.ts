export type DiscountType = "percentage" | "fixed";

export interface Discount {
  id: number;
  code: string;
  type: DiscountType;
  value: number | string;
  max_uses?: number | null;
  used_count?: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DiscountPayload {
  code: string;
  type: DiscountType;
  value: number;
  max_uses?: number | null;
  is_active: boolean;
}

export interface CouponValidationPayload {
  code: string;
  showtime_id: number;
  seat_ids: number[];
}

export interface CouponValidationData {
  valid?: boolean;
  code?: string;
  message?: string;
  currency?: string | null;
  subtotal?: number | string | null;
  original_total?: number | string | null;
  offer_discount?: number | string | null;
  coupon_discount?: number | string | null;
  discount_amount?: number | string | null;
  total_price?: number | string | null;
  final_total?: number | string | null;
  total_after_discount?: number | string | null;
  coupon?: Partial<Discount> | null;
  [key: string]: unknown;
}

export interface CouponValidationResponse extends CouponValidationData {
  data?: CouponValidationData;
}
