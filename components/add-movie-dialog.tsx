"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
import type { LandlordMovie } from "@/types/movie";

interface AddMovieDialogProps {
  onAdded: () => void;
}

export function AddMovieDialog({ onAdded }: AddMovieDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<LandlordMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLandlordMovies({ per_page: 100 });
      const { data } = extractPaginated<LandlordMovie>(res);
      setMovies(data);
    } catch {
      setError("Could not load landlord movies.");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return movies;
    return movies.filter((m) => m.title.toLowerCase().includes(q));
  }, [movies, query]);

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
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden gap-0 p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Add from landlord catalog</DialogTitle>
          <DialogDescription>
            Search and pick a movie to attach to your tenant.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 p-6 pt-4">
          <Input
            placeholder="Search titles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <div className="max-h-[45vh] space-y-2 overflow-y-auto rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
            {loading ? (
              <p className="p-4 text-sm text-zinc-500">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">No movies found.</p>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {m.title}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={submittingId !== null}
                    onClick={() => void handleSelect(m)}
                  >
                    {submittingId === m.id ? "Adding…" : "Select"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
