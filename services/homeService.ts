import { homeApi } from "@/lib/home-api";
import type {
  Booking,
  BookingConfirmation,
  CheckoutResponse,
  CouponValidationPayload,
  CouponValidationResponse,
  CreateBookingPayload,
  HomeMovie,
  HomeMovieDetailsResponse,
  InitiateCheckoutPayload,
  ReserveSeatsPayload,
  ReserveSeatsResponse,
  ShowtimeSeatsResponse,
} from "@/types/home";

export const browseMovies = () =>
  homeApi.get<{ data: HomeMovie[] }>("/");

export const getMovieDetails = (id: number | string) =>
  homeApi.get<HomeMovieDetailsResponse>(`/movies/${id}`);

export const getShowtimeSeats = (showtimeId: number | string) =>
  homeApi.get<ShowtimeSeatsResponse>(`/showtimes/${showtimeId}/seats`);

export const validateCouponCode = (payload: CouponValidationPayload) =>
  homeApi.post<CouponValidationResponse>("/coupons/validate", payload);

export const reserveSeats = (payload: ReserveSeatsPayload) =>
  homeApi.post<ReserveSeatsResponse>("/reserve-seats", payload);

export const createBooking = (payload: CreateBookingPayload) =>
  homeApi.post<{ data: Booking }>("/bookings", payload);

export const initiateCheckout = (payload: InitiateCheckoutPayload) =>
  homeApi.post<CheckoutResponse>("/checkout/initiate", payload);

export const getBookingConfirmation = (bookingId: number | string) =>
  homeApi.get<{ data: BookingConfirmation }>(`/booking/${bookingId}/success`);
