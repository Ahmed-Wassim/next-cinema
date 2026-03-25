"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
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

function splitLocalDateTime(local: string) {
  if (!local) return { date: "", time: "" };
  const [date = "", time = ""] = local.split("T");
  return { date, time: time.slice(0, 5) };
}

function mergeLocalDateTime(date: string, time: string) {
  if (!date) return "";
  return `${date}T${(time || "19:00").slice(0, 5)}`;
}

function formatLocalPreview(local: string) {
  if (!local) return "Pick a date and time";
  const date = new Date(local);
  if (Number.isNaN(date.getTime())) return local;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const showtimeTimePresets = [
  { label: "Morning", value: "10:00" },
  { label: "Noon", value: "12:30" },
  { label: "Matinee", value: "15:00" },
  { label: "Prime", value: "18:30" },
  { label: "Late", value: "21:30" },
];

function ShowtimeDateTimeField({
  label,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  idPrefix: string;
}) {
  const parts = useMemo(() => splitLocalDateTime(value), [value]);

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Choose the screening day first, then lock the exact showtime.
          </p>
        </div>
        <div className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-date`} className="text-xs text-zinc-500">
            Date
          </Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id={`${idPrefix}-date`}
              type="date"
              value={parts.date}
              onChange={(e) =>
                onChange(mergeLocalDateTime(e.target.value, parts.time))
              }
              className="h-11 bg-white pl-9 dark:bg-zinc-950"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-time`} className="text-xs text-zinc-500">
            Time
          </Label>
          <div className="relative">
            <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id={`${idPrefix}-time`}
              type="time"
              step={300}
              value={parts.time}
              onChange={(e) =>
                onChange(mergeLocalDateTime(parts.date, e.target.value))
              }
              className="h-11 bg-white pl-9 dark:bg-zinc-950"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-zinc-500">Quick times</Label>
        <div className="flex flex-wrap gap-2">
          {showtimeTimePresets.map((preset) => (
            <Button
              key={preset.value}
              type="button"
              variant={parts.time === preset.value ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => onChange(mergeLocalDateTime(parts.date, preset.value))}
            >
              {preset.label}
              <span className="ml-1 opacity-80">{preset.value}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
        <span className="font-medium">Scheduled for:</span>{" "}
        {formatLocalPreview(value)}
      </div>
    </div>
  );
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
  const [deleting, setDeleting] = useState<Showtime | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  void handleDelete;
  async function confirmDelete(row: Showtime) {
    setDeleteBusy(true);
    try {
      await deleteShowtime(row.id);
      setDeleting(null);
      await load();
    } catch {
      setError("Could not delete showtime.");
    } finally {
      setDeleteBusy(false);
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
                  <ShowtimeDateTimeField
                    idPrefix="st-create"
                    label="Start time"
                    value={createValues.start_time_local}
                    onChange={(next) =>
                      setCreateValues((s) => ({
                        ...s,
                        start_time_local: next,
                      }))
                    }
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
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-w-[72px]"
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
                        className="min-w-[72px]"
                        onClick={() => setDeleting(r)}
                      >
                        Delete
                      </Button>
                    </div>
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
                  <ShowtimeDateTimeField
                    idPrefix="st-edit"
                    label="Start time"
                    value={editingLocalTime}
                    onChange={setEditingLocalTime}
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
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete showtime"
        description={
          deleting
            ? `This will remove the ${movieTitleById.get(deleting.movie_id) ?? "selected"} showtime.`
            : ""
        }
        onConfirm={() => (deleting ? confirmDelete(deleting) : undefined)}
        loading={deleteBusy}
      />
    </div>
  );
}
