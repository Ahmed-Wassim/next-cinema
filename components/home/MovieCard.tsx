"use client";

import Image from "next/image";
import Link from "next/link";
import type { HomeMovie } from "@/types/home";

interface MovieCardProps {
  movie: HomeMovie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const poster = movie.poster ?? "/placeholder-poster.svg";

  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-zinc-900 shadow-lg transition-transform duration-300 hover:scale-[1.03] hover:shadow-amber-500/20 hover:shadow-2xl"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full">
        <Image
          src={poster}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-opacity duration-300 group-hover:opacity-80"
          unoptimized
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
          Now Playing
        </p>
        <h3 className="text-base font-bold text-white leading-tight line-clamp-2">
          {movie.title}
        </h3>
        {movie.genres && movie.genres.length > 0 && (
          <p className="mt-1 text-xs text-zinc-400 line-clamp-1">
            {movie.genres.join(" · ")}
          </p>
        )}
      </div>

      {/* Hover glow border */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 group-hover:ring-amber-400/40 transition-all duration-300" />
    </Link>
  );
}
