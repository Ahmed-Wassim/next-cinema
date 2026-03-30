"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { browseMovies } from "@/services/homeService";
import type { HomeMovie } from "@/types/home";

const STORAGE_KEY = "cinema.lastSelectedMovie";

const featurePoints = [
  "Immersive layouts with live availability",
  "Faster seat selection with visual seat zoning",
  "Theme switching tuned for each cinema mood",
];

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
    () => movies.find((movie) => movie.id === lastMovieId),
    [movies, lastMovieId],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute left-[-12rem] top-[-8rem] h-72 w-72 rounded-full bg-[var(--accent)]/14 blur-3xl" />
        <div className="animate-pulse-glow absolute right-[-6rem] top-20 h-64 w-64 rounded-full bg-[var(--theme-glow)] blur-3xl" />
        <div className="cinema-grid absolute inset-x-0 top-0 h-[32rem] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <header className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="cinema-surface relative overflow-hidden rounded-[32px] px-6 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-[var(--accent)]/10 to-transparent lg:block" />
          <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-white/10 bg-white/5 blur-2xl lg:block" />

          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.8fr] lg:items-end">
            <div>
              <p className="inline-flex rounded-full border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
                Cinema Live
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Home booking that feels like opening night.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                Pick a movie, glide through showtimes, and lock premium seats with a richer, more tactile booking flow.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {featurePoints.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-white/8 bg-white/6 px-4 py-2 text-sm text-[var(--text-secondary)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:text-[var(--text-primary)]"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-black/15 p-4 transition-transform duration-300 hover:-translate-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Now Showing</p>
                <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{movies.length || "--"}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Fresh titles available to book right now.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/15 p-4 transition-transform duration-300 hover:-translate-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Last Action</p>
                <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">{lastMovie?.title ?? "No resume yet"}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">We keep your last pick ready when you return.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/15 p-4 transition-transform duration-300 hover:-translate-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Experience</p>
                <p className="mt-2 text-lg font-bold text-[var(--accent)]">Hover-rich UI</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Cards, switcher, and booking panels now feel more alive.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl space-y-8 px-4 pb-32 sm:px-6 lg:px-8">
        {lastMovie && (
          <aside className="cinema-surface group rounded-[28px] p-5 text-sm text-[var(--text-primary)] transition-transform duration-300 hover:-translate-y-1">
            <span className="text-[var(--text-secondary)]">Last movie:</span>{" "}
            <strong>{lastMovie.title}</strong>.
            <Link
              href={`/movies/${lastMovie.id}`}
              className="ml-2 inline-flex items-center text-[var(--accent)] transition-transform duration-300 group-hover:translate-x-0.5"
            >
              Resume booking
            </Link>
          </aside>
        )}

        {error && (
          <section className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
            {error}
          </section>
        )}

        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Now Showing</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Explore the lineup and jump straight into the booking flow.</p>
            </div>
            <span className="hidden text-sm text-[var(--text-secondary)] sm:block">Hover each card for a richer preview</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="cinema-surface relative h-96 overflow-hidden rounded-[30px]">
                    <div className="absolute inset-0 animate-pulse bg-white/5" />
                    <div className="animate-shimmer-slide absolute inset-y-0 left-0 w-28 -skew-x-12 bg-white/8" />
                  </div>
                ))
              : movies.map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.id}`}
                    onClick={() => window.localStorage.setItem(STORAGE_KEY, String(movie.id))}
                    className="group cinema-surface relative block overflow-hidden rounded-[30px] transition-all duration-500 hover:-translate-y-0.5 hover:border-[var(--accent)]/24 hover:shadow-[0_20px_42px_rgba(2,6,23,0.3)]"
                  >
                    <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-inset ring-white/6 transition-all duration-500 group-hover:ring-[var(--accent)]/18" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/4 via-transparent to-black/8 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={movie.backdrop ?? movie.poster ?? "/placeholder-poster.svg"}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-700 ease-out group-hover:scale-[1.015]"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/28 to-black/8 transition-all duration-500 group-hover:from-black/78 group-hover:via-black/24 group-hover:to-black/0" />
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/20 to-transparent opacity-70" />
                      <div className="absolute inset-y-0 left-[-20%] w-[38%] -skew-x-12 bg-white/10 opacity-0 blur-2xl transition-all duration-700 group-hover:left-[88%] group-hover:opacity-100" />
                      <div className="absolute right-4 top-4 rounded-full border border-white/12 bg-black/28 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-md transition-colors duration-300 group-hover:border-[var(--accent)]/20 group-hover:bg-black/36">
                        Book now
                      </div>
                    </div>

                    <div className="relative p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-full border border-[var(--accent)]/12 bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)] transition-colors duration-300 group-hover:border-[var(--accent)]/22 group-hover:bg-[var(--accent)]/14">
                          Featured
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] transition-all duration-300 group-hover:text-[var(--text-primary)]">
                          Open details
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white transition-colors duration-300 group-hover:text-[var(--accent-soft)]">
                        {movie.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)] transition-colors duration-300 group-hover:text-[var(--text-primary)]/78">
                        {movie.overview ?? "No description available."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(movie.genres ?? []).slice(0, 4).map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full border border-white/8 bg-white/6 px-3 py-1 text-xs font-medium text-[var(--text-primary)] transition-colors duration-300 group-hover:border-[var(--accent)]/20 group-hover:bg-[var(--accent)]/8"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="cinema-surface rounded-[30px] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Booking flow guide</h3>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <li>1. Choose a title and move into the detailed booking experience.</li>
              <li>2. Pick a branch, date, and time from a cleaner, more responsive switcher.</li>
              <li>3. Tap seats inside the upgraded map with clearer hover and summary states.</li>
              <li>4. Confirm booking and continue to checkout with a polished review panel.</li>
            </ul>
          </div>

          <div className="cinema-surface rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">Quick promise</p>
            <h3 className="mt-3 text-xl font-bold text-[var(--text-primary)]">A fuller, more cinematic home surface.</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Hover states are stronger, panels feel layered, and the theme switcher now reads like a premium control instead of a footer bar.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
