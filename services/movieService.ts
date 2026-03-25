import { api } from "@/lib/api";

export interface MoviesListParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export const getMovies = (params?: MoviesListParams) =>
  api.get("/movies", { params });

export const getLandlordMovies = (params?: MoviesListParams) =>
  api.get("/movies/landlord", { params });

export const addMovie = (movie_id: number) =>
  api.post("/movies", { movie_id });

export const getMovie = (id: number) => api.get(`/movies/${id}`);
