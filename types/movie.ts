export type MovieStatus = "active" | "inactive";

export interface Movie {
  id: number;
  title: string;
  poster_url: string;
  status: MovieStatus;
  movie_id?: number;
}

export interface LandlordMovie {
  id: number;
  title: string;
  poster_url?: string;
  backdrop_url?: string;
  overview?: string;
  release_date?: string;
  language?: string;
  popularity?: number | string;
  genres?: string[];
}

export interface MovieLandlordDetails {
  id: number;
  title?: string;
  [key: string]: unknown;
}

export interface MovieDetails extends Movie {
  landlord_details?: MovieLandlordDetails | null;
}
