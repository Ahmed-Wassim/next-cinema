export interface PaymentCustomer {
  id: number;
  name: string;
  email: string;
  phone_country_code?: string | null;
  phone?: string | null;
}

export interface PaymentBookingUser {
  id: number;
  name: string;
  email: string;
}

export interface PaymentMovie {
  id: number;
  title: string;
  poster?: string | null;
  runtime?: number | null;
}

export interface PaymentHall {
  id: number;
  name: string;
}

export interface PaymentShowtime {
  id: number;
  start_time: string;
  end_time?: string | null;
  movie?: PaymentMovie | null;
  hall?: PaymentHall | null;
}

export interface PaymentBooking {
  id: number;
  status?: string | null;
  total_price?: number | string | null;
  currency?: string | null;
  expires_at?: string | null;
  customer?: PaymentCustomer | null;
  user?: PaymentBookingUser | null;
  showtime?: PaymentShowtime | null;
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number | string;
  currency: string;
  status: string;
  gateway?: string | null;
  transaction_ref?: string | null;
  payload?: unknown;
  booking?: PaymentBooking | null;
  created_at: string;
  updated_at: string;
}
