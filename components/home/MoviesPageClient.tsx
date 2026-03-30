"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { browseMovies } from "@/services/homeService";
import type { HomeMovie } from "@/types/home";

const STORAGE_KEY = "cinema.lastSelectedMovie";

export function MoviesPageClient() {
  const [movies, setMovies] = useState<HomeMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastMovieId, setLastMovieId] = useState<number | null>(null);

  useEffect(() => {
    const loadMovies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await browseMovies();
        setMovies(res.data?.data ?? []);
      } catch {
        setError("Could not fetch movies. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMovies();

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const id = Number(stored);
      if (!Number.isNaN(id)) setLastMovieId(id);
    }
  }, []);

  const lastMovie = useMemo(
    () => movies.find((m) => m.id === lastMovieId),
    [movies, lastMovieId],
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="inline-flex rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
          Cinema Live
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Cinema Booking Reimagined</h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--text-secondary)]">
          Pick a movie, choose the perfect showtime, and secure premium seats in one seamless flow.
        </p>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 space-y-6">
        {lastMovie && (
          <aside className="rounded-3xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 p-5 text-sm text-[var(--text-primary)] shadow-[0_10px_30px_rgba(229,9,20,0.2)]">
            Last movie: <strong>{lastMovie.title}</strong>. 
            <Link
              href={`/movies/${lastMovie.id}`}
              className="ml-2 text-[var(--accent)] underline"
            >
              Resume booking
            </Link>
          </aside>
        )}

        {error && (
          <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
            {error}
          </section>
        )}

        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Now Showing</h2>
            <span className="text-sm text-[var(--text-secondary)]">Tap a promo card to continue</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, id) => (
                  <div key={id} className="h-96 animate-pulse rounded-3xl bg-[var(--bg-secondary)]" />
                ))
              : movies.map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.id}`}
                    onClick={() => window.localStorage.setItem(STORAGE_KEY, String(movie.id))}
                    className="group relative block overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={movie.backdrop ?? movie.poster ?? "/placeholder-poster.svg"}
                        alt={movie.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-white">{movie.title}</h3>
                      <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">{movie.overview ?? "No description available."}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(movie.genres ?? []).slice(0, 4).map((genre) => (
                          <span key={genre} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)]/70 p-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Booking flow guide</h3>
          <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
            <li>1. Choose title → watch details and trailer.</li>
            <li>2. Pick the perfect showtime in a clean horizontal timeline.</li>
            <li>3. Tap seats on an interactive premium seat map.</li>
            <li>4. Confirm booking and pay securely with a single tap.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
