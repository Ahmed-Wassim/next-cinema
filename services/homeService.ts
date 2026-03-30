import { homeApi } from "@/lib/home-api";
import type {
  HomeMovie,
  HomeMovieDetailsResponse,
  ShowtimeSeat,
  ReserveSeatsPayload,
  ReserveSeatsResponse,
  CreateBookingPayload,
  Booking,
  InitiateCheckoutPayload,
  CheckoutResponse,
  BookingConfirmation,
} from "@/types/home";

/* 1. Browse Now Playing Movies – GET / */
export const browseMovies = () =>
  homeApi.get<{ data: HomeMovie[] }>("/");

/* 2. Get Movie Details & Showtimes – GET /movies/:id */
export const getMovieDetails = (id: number | string) =>
  homeApi.get<HomeMovieDetailsResponse>(`/movies/${id}`);

/* 3. Get Showtime Seats – GET /showtimes/:id/seats */
export const getShowtimeSeats = (showtimeId: number | string) =>
  homeApi.get<{ data: ShowtimeSeat[] }>(`/showtimes/${showtimeId}/seats`);

/* 4. Reserve Seats – POST /reserve-seats */
export const reserveSeats = (payload: ReserveSeatsPayload) =>
  homeApi.post<ReserveSeatsResponse>("/reserve-seats", payload);

/* 5. Create Booking – POST /bookings */
export const createBooking = (payload: CreateBookingPayload) =>
  homeApi.post<{ data: Booking }>("/bookings", payload);

/* 6. Initiate PayTabs Checkout – POST /api/checkout/initiate */
export const initiateCheckout = (payload: InitiateCheckoutPayload) =>
  homeApi.post<CheckoutResponse>("/checkout/initiate", payload);

/* 8. View Booking Confirmation – GET /booking/:id/success */
export const getBookingConfirmation = (bookingId: number | string) =>
  homeApi.get<{ data: BookingConfirmation }>(`/booking/${bookingId}/success`);
