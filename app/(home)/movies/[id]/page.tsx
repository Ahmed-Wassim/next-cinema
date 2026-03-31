import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, Globe } from "lucide-react";
import { getMovieDetails } from "@/services/homeService";
import { MovieBookingFlow } from "@/components/home/MovieBookingFlow";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const res = await getMovieDetails(id);
    return { title: `${res.data.data.title} - CineBook` };
  } catch {
    return { title: "Movie - CineBook" };
  }
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  let movie;
  let showtimes;

  try {
    const res = await getMovieDetails(id);
    movie = res.data.data;
    showtimes = res.data.showtimes;
  } catch {
    notFound();
  }

  const backdrop = movie.backdrop ?? movie.poster ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <section className="cinema-surface relative overflow-hidden rounded-[34px]">
        {backdrop ? (
          <Image
            src={backdrop}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-700 hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="h-64 bg-[var(--bg-secondary)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%)]" />

        <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-full bg-[var(--accent)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              Premium Cinema
            </p>
            <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-5xl">{movie.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{movie.overview}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
              {movie.genres?.map((genre: string) => (
                <span key={genre} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 transition-colors duration-300 hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/10 hover:text-white">
                  {genre}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">At a glance</p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]">
              {movie.release_date && (
                <div className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Release
                  </span>
                  <span className="font-semibold text-white">{new Date(movie.release_date).getFullYear()}</span>
                </div>
              )}
              {movie.language && (
                <div className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Language
                  </span>
                  <span className="font-semibold text-white">{movie.language.toUpperCase()}</span>
                </div>
              )}
              {movie.rating != null && (
                <div className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3">
                  <span>Rating</span>
                  <span className="rounded-full bg-[var(--accent)]/18 px-3 py-1 font-semibold text-[var(--accent-soft)]">
                    {movie.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <MovieBookingFlow movieId={movie.id} showtimes={showtimes ?? {}} />
        </div>

        <aside className="cinema-surface rounded-[30px] p-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Need help?</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Premium seating includes extra legroom, recline, and snack delivery.
            All bookings are refundable up to 1 hour before showtime.
          </p>
          <div className="mt-5 grid gap-3">
            <span className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-[var(--text-primary)]">
              Live chat available until 10 PM
            </span>
            <span className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-[var(--text-primary)]">
              VIP code: CINEMAGLOW for 5% off
            </span>
          </div>
        </aside>
      </section>
    </div>
  );
}
