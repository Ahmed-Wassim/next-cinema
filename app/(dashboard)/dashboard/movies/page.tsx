"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Clapperboard, Eye, Film } from "lucide-react";

import { AddMovieDialog } from "@/components/add-movie-dialog";
import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { DashboardTableSkeleton } from "@/components/dashboard-table-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationBar } from "@/components/pagination-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { extractPaginated } from "@/lib/extract-paginated";
import { getMovies } from "@/services/movieService";
import type { Movie } from "@/types/movie";
import type { PaginationMeta } from "@/types/pagination";

const defaultMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMovies({ page, per_page: perPage });
      const { data, meta: nextMeta } = extractPaginated<Movie>(res);
      setMovies(data);
      setMeta(nextMeta);
    } catch {
      setError("Failed to load movies.");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeMovies = movies.filter((movie) => movie.status === "active").length;
  const activationRate = movies.length ? (activeMovies / movies.length) * 100 : 0;

  return (
    <div className="dashboard-content-grid">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Content hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Movies</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Tenant catalog for posters, status, and detail pages with a cleaner review flow.
          </p>
        </div>
        <AddMovieDialog onAdded={load} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardStatCard
          label="Movies loaded"
          value={movies.length}
          hint="Quick count for the current collection view."
          progress={100}
          icon={Clapperboard}
        />
        <DashboardStatCard
          label="Active titles"
          value={activeMovies}
          hint="Release-ready entries highlighted for faster QA."
          progress={activationRate}
          icon={Film}
          tone="secondary"
        />
        <DashboardStatCard
          label="Visible page"
          value={`${meta.current_page}/${meta.last_page}`}
          hint="Pagination remains responsive across desktop and mobile."
          progress={(meta.current_page / Math.max(meta.last_page, 1)) * 100}
          icon={Eye}
          tone="accent"
        />
      </div>

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-red-600 dark:text-red-400">
            {error}
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <DashboardTableSkeleton rows={6} columns={4} />
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Movie catalog</CardTitle>
              <CardDescription>
                Hover states, responsive spacing, and clear status badges keep the table easy to scan.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[72px]">Poster</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {movies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell>
                      <div className="relative h-14 w-10 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700">
                        {movie.poster_url ? (
                          <Image
                            src={movie.poster_url}
                            alt={movie.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{movie.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          movie.status === "active" ? "success" : "secondary"
                        }
                      >
                        {movie.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/movies/${movie.id}`}
                        className="text-sm font-medium text-[color:var(--primary)] underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <PaginationBar
              meta={meta}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
