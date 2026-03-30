import Image from "next/image"
import { notFound } from "next/navigation"
import { getMovieDetails } from "@/services/homeService"
import { MovieBookingFlow } from "@/components/home/MovieBookingFlow"
import { Calendar, Globe } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  try {
    const res = await getMovieDetails(id)
    return { title: `${res.data.data.title} — CineBook` }
  } catch {
    return { title: "Movie — CineBook" }
  }
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params
  let movie
  let showtimes

  try {
    const res = await getMovieDetails(id)
    movie = res.data.data
    showtimes = res.data.showtimes
  } catch {
    notFound()
  }

  const backdrop = movie.backdrop ?? movie.poster ?? null

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] shadow-[0_25px_60px_rgba(0,0,0,0.7)]">
        {backdrop ? (
          <Image
            src={backdrop}
            alt={movie.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-64 bg-[var(--bg-secondary)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="relative p-6 md:p-10">
          <p className="inline-flex rounded-full bg-[var(--accent)]/20 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
            Premium Cinema
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-5xl">{movie.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--text-secondary)] sm:text-base">{movie.overview}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
            {movie.genres?.map((g) => (
              <span key={g} className="rounded-full bg-white/10 px-3 py-1">{g}</span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
            {movie.release_date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(movie.release_date).getFullYear()}
              </span>
            )}
            {movie.language && (
              <span className="inline-flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {movie.language.toUpperCase()}
              </span>
            )}
            {movie.rating != null && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold text-white">
                ⭐ {movie.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <MovieBookingFlow showtimes={showtimes ?? {}} />
        </div>

        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Need help?</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Premium seating includes extra legroom, recline, and snack delivery.<br />
            All bookings are refundable up to 1 hour before showtime.
          </p>
          <div className="mt-5 grid gap-2">
            <span className="rounded-lg bg-[var(--bg-primary)]/60 px-4 py-2 text-sm text-[var(--text-primary)]">Live chat available until 10PM</span>
            <span className="rounded-lg bg-[var(--bg-primary)]/60 px-4 py-2 text-sm text-[var(--text-primary)]">VIP code: CINEMAGLOW for 5% off</span>
          </div>
        </aside>
      </section>
    </div>
  )
}
