"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AddMovieDialog } from "@/components/add-movie-dialog";
import { Badge } from "@/components/ui/badge";
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
      const { data, meta: m } = extractPaginated<Movie>(res);
      setMovies(data);
      setMeta(m);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movies</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tenant catalog — posters, status, and details.
          </p>
        </div>
        <AddMovieDialog onAdded={load} />
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
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
              {movies.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="relative h-14 w-10 overflow-hidden rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-700">
                      {m.poster_url ? (
                        <Image
                          src={m.poster_url}
                          alt={m.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{m.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        m.status === "active" ? "success" : "secondary"
                      }
                    >
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/movies/${m.id}`}
                      className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
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
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
