"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMovie } from "@/services/movieService";
import type { MovieDetails } from "@/types/movie";

export default function MovieDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (Number.isNaN(id)) {
      setError("Invalid movie id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getMovie(id);
      const body = res.data as MovieDetails | { data: MovieDetails };
      const row =
        body && typeof body === "object" && "data" in body
          ? (body as { data: MovieDetails }).data
          : (body as MovieDetails);
      setMovie(row);
    } catch {
      setError("Could not load movie.");
      setMovie(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (error || !movie) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Not found."}
        </p>
        <Link
          href="/dashboard/movies"
          className="text-sm font-medium underline"
        >
          Back to movies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/movies"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            ← Movies
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{movie.title}</h1>
          <div className="mt-2">
            <Badge variant={movie.status === "active" ? "success" : "secondary"}>
              {movie.status}
            </Badge>
          </div>
        </div>
        {movie.poster_url ? (
          <div className="relative h-52 w-36 shrink-0 overflow-hidden rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-700">
            <Image
              src={movie.poster_url}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="144px"
              unoptimized
            />
          </div>
        ) : null}
      </div>

      {movie.landlord_details ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Landlord details</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-md bg-zinc-100 p-4 text-xs dark:bg-zinc-900">
              {JSON.stringify(movie.landlord_details, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-zinc-500">No landlord details on record.</p>
      )}
    </div>
  );
}
