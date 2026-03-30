import Image from "next/image";
import { notFound } from "next/navigation";
import { getMovieDetails } from "@/services/homeService";
import { MovieBookingFlow } from "@/components/home/MovieBookingFlow";
import { Calendar, Globe } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const res = await getMovieDetails(id);
    return { title: `${res.data.data.title} — CineBook` };
  } catch {
    return { title: "Movie — CineBook" };
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
    <div>
      {/* Backdrop hero */}
      {backdrop && (
        <div className="relative -mx-4 -mt-8 mb-10 h-72 sm:-mx-6 sm:h-80 lg:-mx-8">
          <Image
            src={backdrop}
            alt={movie.title}
            fill
            className="object-cover object-center"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-zinc-950/60 to-zinc-950" />
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        {/* Poster */}
        {movie.poster && (
          <div className="hidden lg:block">
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-2xl shadow-zinc-950">
              <Image
                src={movie.poster}
                alt={movie.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Info + showtimes */}
        <div className="space-y-8">
          {/* Title & meta */}
          <div>
            {movie.genres && movie.genres.length > 0 && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
                {movie.genres.join(" · ")}
              </p>
            )}
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {movie.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              {movie.release_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
              {movie.language && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  {movie.language.toUpperCase()}
                </span>
              )}
            </div>
            {movie.overview && (
              <p className="mt-4 text-sm leading-relaxed text-zinc-400 max-w-2xl">
                {movie.overview}
              </p>
            )}
          </div>

          {/* Booking Flow (Picker + Seats) */}
          <MovieBookingFlow showtimes={showtimes ?? {}} />
        </div>
      </div>
    </div>
  );
}
