import type { PriceTier } from "@/types/price-tier";

/* ── Movie browsing ─────────────────────────────────────────── */

export interface HomeMovie {
  id: number;
  title: string;
  poster?: string | null;
  backdrop?: string | null;
  overview?: string | null;
  release_date?: string | null;
  language?: string | null;
  genres?: string[];
  rating?: number | null;
}

/* Showtime as it appears inside the movie-details groups */
export interface GroupedShowtime {
  id: number;
  start_time: string;
  hall?: string;
  hall_id?: number;
  available_seats?: number;
}

/**
 * Showtimes grouped as: { [branch_name]: { [date]: GroupedShowtime[] } }
 */
export type GroupedShowtimes = Record<
  string,
  Record<string, GroupedShowtime[]>
>;

export interface HomeMovieDetailsResponse {
  data: HomeMovie;
  showtimes: GroupedShowtimes;
}

/* ── Seat map ────────────────────────────────────────────────── */

export type SeatStatus = "available" | "booked" | "reserved" | "inactive";

export interface ShowtimeSeat {
  id: number;
  label?: string | null;
  row_label?: string | null;
  col_label?: string | null;
  row?: string | null;
  number?: string | null;
  pos_x?: number | string;
  pos_y?: number | string;
  width?: number | string;
  height?: number | string;
  rotation?: number | string;
  shape?: string;
  status: SeatStatus;
  price_tier?: PriceTier | null;
  [key: string]: unknown;
}

/* ── Reservation ─────────────────────────────────────────────── */

export interface ReserveSeatsPayload {
  showtime_id: number;
  seat_ids: number[];
}

export interface ReserveSeatsResponse {
  message: string;
}

/* ── Booking ─────────────────────────────────────────────────── */

export interface BookingCustomer {
  name: string;
  email: string;
  phone_country_code: string;
  phone: string;
}

export interface CreateBookingPayload {
  showtime_id: number;
  seat_ids: number[];
  customer: BookingCustomer;
}

export interface Booking {
  id: number;
  status: string;
  total_amount?: number | string;
  currency?: string;
  customer?: BookingCustomer;
  seats?: ShowtimeSeat[];
  showtime?: GroupedShowtime & { movie?: HomeMovie };
  [key: string]: unknown;
}

/* ── Checkout ────────────────────────────────────────────────── */

export interface InitiateCheckoutPayload {
  booking_id: number;
  customer_name: string;
  customer_email: string;
}

export interface CheckoutResponse {
  redirect_url: string;
  [key: string]: unknown;
}

/* ── Confirmation ────────────────────────────────────────────── */

export interface BookingConfirmation extends Booking {
  tickets?: Array<{
    id: number;
    seat_label?: string;
    qr_code?: string;
  }>;
}
