"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getHalls } from "@/services/hallService";
import { getPriceTiers } from "@/services/priceTierService";
import {
  createShowtime,
  deleteShowtime,
  getShowtimes,
  updateShowtime,
} from "@/services/showtimeService";
import type { Hall } from "@/types/hall";
import type { Movie } from "@/types/movie";
import type { PaginationMeta } from "@/types/pagination";
import type { PriceTier } from "@/types/price-tier";
import type { Showtime } from "@/types/showtime";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

/** `datetime-local` value from ISO string (best-effort). */
function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string) {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? local : d.toISOString();
}

export default function ShowtimesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [rows, setRows] = useState<Showtime[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState({
    movie_id: 0,
    hall_id: 0,
    price_tier_id: 0,
    start_time_local: "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Showtime | null>(null);
  const [editingLocalTime, setEditingLocalTime] = useState("");

  const movieTitleById = useMemo(() => {
    const m = new Map<number, string>();
    movies.forEach((x) => m.set(x.id, x.title));
    return m;
  }, [movies]);

  const hallNameById = useMemo(() => {
    const m = new Map<number, string>();
    halls.forEach((x) => m.set(x.id, x.name));
    return m;
  }, [halls]);

  const tierNameById = useMemo(() => {
    const m = new Map<number, string>();
    tiers.forEach((x) => m.set(x.id, x.name));
    return m;
  }, [tiers]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getShowtimes({ page, per_page: perPage });
      const { data, meta: m } = extractPaginated<Showtime>(res);
      setRows(data);
      setMeta(m);
    } catch {
      setError("Failed to load showtimes.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void (async () => {
      try {
        const [mRes, hRes, tRes] = await Promise.all([
          getMovies({ per_page: 500 }),
          getHalls({ per_page: 500 }),
          getPriceTiers({ per_page: 500 }),
        ]);
        const { data: m } = extractPaginated<Movie>(mRes);
        const { data: h } = extractPaginated<Hall>(hRes);
        const { data: t } = extractPaginated<PriceTier>(tRes);
        setMovies(m);
        setHalls(h);
        setTiers(t);
      } catch {
        /* mapping only */
      }
    })();
  }, []);

  useEffect(() => {
    if (movies.length && halls.length && tiers.length) {
      setCreateValues((v) => ({
        movie_id: v.movie_id || movies[0]!.id,
        hall_id: v.hall_id || halls[0]!.id,
        price_tier_id: v.price_tier_id || tiers[0]!.id,
        start_time_local: v.start_time_local,
      }));
    }
  }, [movies, halls, tiers]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (
      !createValues.movie_id ||
      !createValues.hall_id ||
      !createValues.price_tier_id
    ) {
      setError("Select movie, hall, and price tier.");
      return;
    }
    try {
      await createShowtime({
        movie_id: createValues.movie_id,
        hall_id: createValues.hall_id,
        price_tier_id: createValues.price_tier_id,
        start_time: fromLocalInput(createValues.start_time_local),
      });
      setCreateOpen(false);
      setCreateValues({
        movie_id: movies[0]?.id ?? 0,
        hall_id: halls[0]?.id ?? 0,
        price_tier_id: tiers[0]?.id ?? 0,
        start_time_local: "",
      });
      await load();
    } catch {
      setError("Could not create showtime.");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateShowtime(editing.id, {
        movie_id: editing.movie_id,
        hall_id: editing.hall_id,
        price_tier_id: editing.price_tier_id,
        start_time: fromLocalInput(editingLocalTime),
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch {
      setError("Could not update showtime.");
    }
  }

  async function handleDelete(row: Showtime) {
    if (!window.confirm("Delete this showtime?")) return;
    try {
      await deleteShowtime(row.id);
      await load();
    } catch {
      setError("Could not delete showtime.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Showtimes</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Links movie, hall, tier, and start — labels resolved from cached
            lists.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button">New showtime</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New showtime</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Movie</Label>
                  <Select
                    value={String(createValues.movie_id || "")}
                    onValueChange={(v) =>
                      setCreateValues((s) => ({
                        ...s,
                        movie_id: Number(v),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Movie" />
                    </SelectTrigger>
                    <SelectContent>
                      {movies.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hall</Label>
                  <Select
                    value={String(createValues.hall_id || "")}
                    onValueChange={(v) =>
                      setCreateValues((s) => ({
                        ...s,
                        hall_id: Number(v),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Hall" />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((h) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price tier</Label>
                  <Select
                    value={String(createValues.price_tier_id || "")}
                    onValueChange={(v) =>
                      setCreateValues((s) => ({
                        ...s,
                        price_tier_id: Number(v),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="st-start">Start</Label>
                  <Input
                    id="st-start"
                    type="datetime-local"
                    value={createValues.start_time_local}
                    onChange={(e) =>
                      setCreateValues((s) => ({
                        ...s,
                        start_time_local: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                <TableHead>Movie</TableHead>
                <TableHead>Hall</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Start</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {movieTitleById.get(r.movie_id) ?? r.movie_id}
                  </TableCell>
                  <TableCell>
                    {hallNameById.get(r.hall_id) ?? r.hall_id}
                  </TableCell>
                  <TableCell>
                    {tierNameById.get(r.price_tier_id) ?? r.price_tier_id}
                  </TableCell>
                  <TableCell>{r.start_time}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(r);
                        setEditingLocalTime(toLocalInput(r.start_time));
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDelete(r)}
                    >
                      Delete
                    </Button>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          {editing ? (
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>Edit showtime</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Movie</Label>
                  <Select
                    value={String(editing.movie_id)}
                    onValueChange={(v) =>
                      setEditing((s) =>
                        s ? { ...s, movie_id: Number(v) } : s,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {movies.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hall</Label>
                  <Select
                    value={String(editing.hall_id)}
                    onValueChange={(v) =>
                      setEditing((s) =>
                        s ? { ...s, hall_id: Number(v) } : s,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((h) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price tier</Label>
                  <Select
                    value={String(editing.price_tier_id)}
                    onValueChange={(v) =>
                      setEditing((s) =>
                        s ? { ...s, price_tier_id: Number(v) } : s,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="datetime-local"
                    value={editingLocalTime}
                    onChange={(e) => setEditingLocalTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
