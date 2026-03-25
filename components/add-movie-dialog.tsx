"use client";

import Image from "next/image";
import {
  CalendarDays,
  Clapperboard,
  Languages,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { extractPaginated } from "@/lib/extract-paginated";
import { addMovie, getLandlordMovies } from "@/services/movieService";
import type { PaginationMeta } from "@/types/pagination";
import type { LandlordMovie } from "@/types/movie";

interface AddMovieDialogProps {
  onAdded: () => void;
}

const PAGE_SIZE = 18;
const defaultMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: PAGE_SIZE,
};

function formatReleaseDate(value?: string) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatPopularity(value?: number | string) {
  if (value == null || value === "") return "N/A";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(1) : String(value);
}

function dedupeMovies(items: LandlordMovie[]) {
  const seen = new Set<number>();
  return items.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

export function AddMovieDialog({ onAdded }: AddMovieDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [movies, setMovies] = useState<LandlordMovie[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [page, setPage] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(
    async (nextPage: number, mode: "reset" | "append") => {
      if (mode === "reset") {
        setLoadingInitial(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const res = await getLandlordMovies({
          page: nextPage,
          per_page: PAGE_SIZE,
          search: deferredQuery || undefined,
        });
        const { data, meta: nextMeta } = extractPaginated<LandlordMovie>(res);
        setMovies((prev) =>
          mode === "reset" ? data : dedupeMovies([...prev, ...data]),
        );
        setMeta(nextMeta);
        setPage(nextPage);
      } catch {
        setError("Could not load landlord movies.");
        if (mode === "reset") {
          setMovies([]);
          setMeta(defaultMeta);
          setPage(1);
        }
      } finally {
        if (mode === "reset") {
          setLoadingInitial(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [deferredQuery],
  );

  useEffect(() => {
    if (!open) return;
    setMovies([]);
    setMeta(defaultMeta);
    setPage(1);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    void loadPage(1, "reset");
  }, [open, deferredQuery, loadPage]);

  const hasMore = meta.current_page < meta.last_page;

  useEffect(() => {
    if (!open || !hasMore || loadingInitial || loadingMore) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        void loadPage(page + 1, "append");
      },
      {
        root,
        rootMargin: "180px 0px",
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadPage, loadingInitial, loadingMore, open, page]);

  const visibleMovies = useMemo(() => {
    const q = deferredQuery.toLowerCase();
    if (!q) return movies;
    return movies.filter((movie) => {
      const title = movie.title.toLowerCase();
      const genres = movie.genres?.join(" ").toLowerCase() ?? "";
      return title.includes(q) || genres.includes(q);
    });
  }, [deferredQuery, movies]);

  async function handleSelect(movie: LandlordMovie) {
    setSubmittingId(movie.id);
    setError(null);
    try {
      await addMovie(movie.id);
      setOpen(false);
      setQuery("");
      onAdded();
    } catch {
      setError("Could not add this movie.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Add movie</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-6xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-zinc-200 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(255,255,255,0.94))] p-6 pb-5 dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_28%),linear-gradient(180deg,_rgba(24,24,27,0.98),_rgba(24,24,27,0.96))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Add From Landlord Catalog
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-sm leading-6">
                Browse the shared movie catalog, inspect the artwork and metadata,
                and attach the right title to your tenant catalog.
              </DialogDescription>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search title or genre..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loadingInitial}
                className="h-11 border-zinc-300 bg-white/90 pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80"
              />
            </div>
          </div>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="min-h-0 max-h-[68vh] overflow-y-auto bg-zinc-50/70 p-6 dark:bg-zinc-950/40"
        >
          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          {loadingInitial ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                />
              ))}
            </div>
          ) : visibleMovies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/80 px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/70">
              <Clapperboard className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                No movies found.
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Try another title or scroll to load more catalog pages.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleMovies.map((movie) => (
                <article
                  key={movie.id}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="relative h-40 overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                    {movie.backdrop_url ? (
                      <Image
                        src={movie.backdrop_url}
                        alt={movie.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 1280px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-200 via-zinc-100 to-white text-zinc-500 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 dark:text-zinc-400">
                        <Clapperboard className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
                      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-zinc-200 shadow-md">
                        {movie.poster_url ? (
                          <Image
                            src={movie.poster_url}
                            alt={movie.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-zinc-300 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                            <Clapperboard className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-white">
                        <h3 className="line-clamp-2 text-base font-semibold leading-tight">
                          {movie.title}
                        </h3>
                        <p className="mt-1 text-xs text-white/75">
                          Landlord catalog ID: {movie.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="flex flex-wrap gap-2">
                      {(movie.genres?.length ? movie.genres : ["Uncategorized"])
                        .slice(0, 3)
                        .map((genre) => (
                          <Badge
                            key={genre}
                            variant="secondary"
                            className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          >
                            {genre}
                          </Badge>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/70">
                        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Release
                        </div>
                        <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                          {formatReleaseDate(movie.release_date)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/70">
                        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                          <Star className="h-3.5 w-3.5" />
                          Popularity
                        </div>
                        <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                          {formatPopularity(movie.popularity)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/70">
                        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                          <Languages className="h-3.5 w-3.5" />
                          Lang
                        </div>
                        <p className="mt-1 font-medium uppercase text-zinc-900 dark:text-zinc-100">
                          {movie.language || "N/A"}
                        </p>
                      </div>
                    </div>

                    <p className="line-clamp-4 min-h-[5rem] text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {movie.overview || "No overview available for this title."}
                    </p>

                    <Button
                      type="button"
                      className="w-full"
                      disabled={submittingId !== null}
                      onClick={() => void handleSelect(movie)}
                    >
                      {submittingId === movie.id ? "Adding..." : "Add movie"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-6" />

          {loadingMore ? (
            <p className="pt-2 text-center text-sm text-zinc-500">
              Loading more movies...
            </p>
          ) : hasMore ? (
            <p className="pt-2 text-center text-sm text-zinc-500">
              Scroll to load more movies
            </p>
          ) : visibleMovies.length > 0 ? (
            <p className="pt-2 text-center text-sm text-zinc-500">
              End of catalog
            </p>
          ) : null}
        </div>

        <DialogFooter className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
