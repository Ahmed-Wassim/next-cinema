import { MovieCard } from "@/components/home/MovieCard";
import { browseMovies } from "@/services/homeService";
import type { HomeMovie } from "@/types/home";

export const metadata = {
  title: "Now Playing — CineBook",
  description: "Browse movies currently showing at your local cinema",
};

export default async function MoviesPage() {
  let movies: HomeMovie[] = [];
  let error: string | null = null;

  try {
    const res = await browseMovies();
    movies = res.data?.data ?? [];
  } catch {
    error = "Could not load movies. Please try again later.";
  }

  return (
    <div>
      {/* Hero */}
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-2">
          What&apos;s On
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Now Playing
        </h1>
        <p className="mt-3 text-zinc-400 max-w-md mx-auto text-sm">
          Pick a movie, choose your seats, and enjoy the show.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-8 rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Grid */}
      {movies.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <p className="text-lg font-semibold">No movies available right now.</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
