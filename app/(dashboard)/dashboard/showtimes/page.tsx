"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Film,
  Percent,
  Sparkles,
  Ticket,
  TimerReset,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { DashboardTableSkeleton } from "@/components/dashboard-table-skeleton";
import { PaginationBar } from "@/components/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { extractPaginated } from "@/lib/extract-paginated";
import { getHalls } from "@/services/hallService";
import { getMovies } from "@/services/movieService";
import { getPriceTiers } from "@/services/priceTierService";
import {
  clearShowtimeOffer,
  createShowtime,
  deleteShowtime,
  getShowtimes,
  setShowtimeOffer,
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

function toLocalInput(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(local: string) {
  if (!local) return "";
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? local : date.toISOString();
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
              onChange={(event) =>
                onChange(mergeLocalDateTime(event.target.value, parts.time))
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
              onChange={(event) =>
                onChange(mergeLocalDateTime(parts.date, event.target.value))
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
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerTarget, setOfferTarget] = useState<Showtime | null>(null);
  const [offerValue, setOfferValue] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);

  const movieTitleById = useMemo(() => {
    const map = new Map<number, string>();
    movies.forEach((movie) => map.set(movie.id, movie.title));
    return map;
  }, [movies]);

  const hallNameById = useMemo(() => {
    const map = new Map<number, string>();
    halls.forEach((hall) => map.set(hall.id, hall.name));
    return map;
  }, [halls]);

  const tierNameById = useMemo(() => {
    const map = new Map<number, string>();
    tiers.forEach((tier) => map.set(tier.id, tier.name));
    return map;
  }, [tiers]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getShowtimes({ page, per_page: perPage });
      const { data, meta: nextMeta } = extractPaginated<Showtime>(response);
      setRows(data);
      setMeta(nextMeta);
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
        const [movieResponse, hallResponse, tierResponse] = await Promise.all([
          getMovies({ per_page: 500 }),
          getHalls({ per_page: 500 }),
          getPriceTiers({ per_page: 500 }),
        ]);
        const { data: movieData } = extractPaginated<Movie>(movieResponse);
        const { data: hallData } = extractPaginated<Hall>(hallResponse);
        const { data: tierData } = extractPaginated<PriceTier>(tierResponse);
        setMovies(movieData);
        setHalls(hallData);
        setTiers(tierData);
      } catch {
        /* mapping only */
      }
    })();
  }, []);

  useEffect(() => {
    if (movies.length && halls.length && tiers.length) {
      setCreateValues((value) => ({
        movie_id: value.movie_id || movies[0]!.id,
        hall_id: value.hall_id || halls[0]!.id,
        price_tier_id: value.price_tier_id || tiers[0]!.id,
        start_time_local: value.start_time_local,
      }));
    }
  }, [movies, halls, tiers]);

  useEffect(() => {
    void load();
  }, [load]);

  const uniqueMovies = new Set(rows.map((row) => row.movie_id)).size;
  const readyRows = rows.filter(
    (row) =>
      movieTitleById.has(row.movie_id) &&
      hallNameById.has(row.hall_id) &&
      tierNameById.has(row.price_tier_id),
  ).length;
  const activeOffers = rows.filter(
    (row) => Number(row.offer_percentage ?? 0) > 0,
  ).length;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
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

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
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

  async function handleOfferSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!offerTarget) return;

    setOfferBusy(true);
    try {
      await setShowtimeOffer(offerTarget.id, Number(offerValue));
      setOfferOpen(false);
      setOfferTarget(null);
      setOfferValue("");
      await load();
    } catch {
      setError("Could not update showtime offer.");
    } finally {
      setOfferBusy(false);
    }
  }

  async function handleClearOffer(row: Showtime) {
    setError(null);
    try {
      await clearShowtimeOffer(row.id);
      await load();
    } catch {
      setError("Could not clear showtime offer.");
    }
  }

  return (
    <div className="dashboard-content-grid">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Scheduling
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Showtimes
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Linked movie, hall, tier, start-time, and offer records for each
            screening.
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
                    onValueChange={(value) =>
                      setCreateValues((state) => ({
                        ...state,
                        movie_id: Number(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Movie" />
                    </SelectTrigger>
                    <SelectContent>
                      {movies.map((movie) => (
                        <SelectItem key={movie.id} value={String(movie.id)}>
                          {movie.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hall</Label>
                  <Select
                    value={String(createValues.hall_id || "")}
                    onValueChange={(value) =>
                      setCreateValues((state) => ({
                        ...state,
                        hall_id: Number(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Hall" />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((hall) => (
                        <SelectItem key={hall.id} value={String(hall.id)}>
                          {hall.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price tier</Label>
                  <Select
                    value={String(createValues.price_tier_id || "")}
                    onValueChange={(value) =>
                      setCreateValues((state) => ({
                        ...state,
                        price_tier_id: Number(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.id} value={String(tier.id)}>
                          {tier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ShowtimeDateTimeField
                  idPrefix="st-create"
                  label="Start time"
                  value={createValues.start_time_local}
                  onChange={(next) =>
                    setCreateValues((state) => ({
                      ...state,
                      start_time_local: next,
                    }))
                  }
                />
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Showtimes loaded"
          value={rows.length}
          hint="Visible schedule entries for the active dashboard page."
          progress={100}
          icon={Ticket}
        />
        <DashboardStatCard
          label="Unique movies"
          value={uniqueMovies}
          hint="Helpful signal for programming mix without leaving the schedule page."
          progress={rows.length ? (uniqueMovies / rows.length) * 100 : 0}
          icon={Film}
          tone="secondary"
        />
        <DashboardStatCard
          label="Resolved labels"
          value={`${readyRows}/${rows.length || 0}`}
          hint="Checks how many rows have all their linked labels available from cached lists."
          progress={rows.length ? (readyRows / rows.length) * 100 : 0}
          icon={TimerReset}
          tone="accent"
        />
        <DashboardStatCard
          label="Live offers"
          value={activeOffers}
          hint="Showtimes currently carrying a public offer percentage."
          progress={rows.length ? (activeOffers / rows.length) * 100 : 0}
          icon={Percent}
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
        <DashboardTableSkeleton rows={6} columns={6} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Showtime matrix</CardTitle>
            <CardDescription>
              Schedule rows now include per-showtime offers so promotions can be
              managed without leaving the timetable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movie</TableHead>
                  <TableHead>Hall</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Offer</TableHead>
                  <TableHead className="w-[220px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {movieTitleById.get(row.movie_id) ?? row.movie_id}
                    </TableCell>
                    <TableCell>
                      {hallNameById.get(row.hall_id) ?? row.hall_id}
                    </TableCell>
                    <TableCell>
                      {tierNameById.get(row.price_tier_id) ?? row.price_tier_id}
                    </TableCell>
                    <TableCell>{row.start_time}</TableCell>
                    <TableCell>
                      {Number(row.offer_percentage ?? 0) > 0 ? (
                        <Badge variant="success">
                          {Number(row.offer_percentage).toFixed(0)}% off
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No offer</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-w-[72px]"
                          onClick={() => {
                            setEditing(row);
                            setEditingLocalTime(toLocalInput(row.start_time));
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
                          onClick={() => setDeleting(row)}
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOfferTarget(row);
                            setOfferValue(
                              row.offer_percentage
                                ? String(row.offer_percentage)
                                : "",
                            );
                            setOfferOpen(true);
                          }}
                        >
                          Set offer
                        </Button>
                        {Number(row.offer_percentage ?? 0) > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleClearOffer(row)}
                          >
                            Clear offer
                          </Button>
                        ) : null}
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
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
            />
          </CardContent>
        </Card>
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
                    onValueChange={(value) =>
                      setEditing((state) =>
                        state ? { ...state, movie_id: Number(value) } : state,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {movies.map((movie) => (
                        <SelectItem key={movie.id} value={String(movie.id)}>
                          {movie.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hall</Label>
                  <Select
                    value={String(editing.hall_id)}
                    onValueChange={(value) =>
                      setEditing((state) =>
                        state ? { ...state, hall_id: Number(value) } : state,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((hall) => (
                        <SelectItem key={hall.id} value={String(hall.id)}>
                          {hall.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price tier</Label>
                  <Select
                    value={String(editing.price_tier_id)}
                    onValueChange={(value) =>
                      setEditing((state) =>
                        state
                          ? { ...state, price_tier_id: Number(value) }
                          : state,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.id} value={String(tier.id)}>
                          {tier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ShowtimeDateTimeField
                  idPrefix="st-edit"
                  label="Start time"
                  value={editingLocalTime}
                  onChange={setEditingLocalTime}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent>
          {offerTarget ? (
            <form onSubmit={handleOfferSubmit}>
              <DialogHeader>
                <DialogTitle>Set showtime offer</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                  {movieTitleById.get(offerTarget.movie_id) ?? "Selected showtime"}{" "}
                  on {formatLocalPreview(toLocalInput(offerTarget.start_time))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showtime-offer-percentage">
                    Offer percentage
                  </Label>
                  <Input
                    id="showtime-offer-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={offerValue}
                    onChange={(event) => setOfferValue(event.target.value)}
                    placeholder="10"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={offerBusy}>
                  {offerBusy ? "Saving..." : "Save offer"}
                </Button>
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
