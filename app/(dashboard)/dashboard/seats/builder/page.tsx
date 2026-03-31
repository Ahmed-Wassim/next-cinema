"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  LayoutGrid,
  MapPin,
  MousePointer2,
  Plus,
  Send,
  Shapes,
  Sparkles,
  Trash2,
} from "lucide-react";

import { SeatBuilderManual } from "@/components/seat-builder-manual";
import { SeatBuilderPreview } from "@/components/seat-builder-preview";
import { SeatsSubnav } from "@/components/seats-subnav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  customRowsFromUniformGrid,
  generateBulkSeatsFromCustomRows,
  generateBulkSeatsFromGrid,
  guessUniformFromCustomRows,
} from "@/lib/generate-bulk-seats";
import type { SeatGridConfig } from "@/lib/generate-bulk-seats";
import { saveLayoutDraft } from "@/lib/layout-draft";
import { extractPaginated } from "@/lib/extract-paginated";
import { cn } from "@/lib/utils";
import { getHalls } from "@/services/hallService";
import { getPriceTiers } from "@/services/priceTierService";
import { bulkInsertSeats } from "@/services/seatService";
import type { CustomBuilderRow } from "@/types/seat-builder";
import type { Hall } from "@/types/hall";
import type { PriceTier } from "@/types/price-tier";
import type { RowGrowth, SeatNumberingMode } from "@/types/seat-bulk";

function nextRowLabel(prev: string): string {
  const ch = prev.trim().toUpperCase().charAt(0);
  const code = ch >= "A" && ch <= "Z" ? ch.charCodeAt(0) : 64;
  return String.fromCharCode(Math.min(code + 1, 90));
}

function newId() {
  return crypto.randomUUID();
}

export default function SeatBuilderPage() {
  const router = useRouter();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [tiers, setTiers] = useState<PriceTier[]>([]);

  const [hallId, setHallId] = useState(0);
  const [tierId, setTierId] = useState(0);

  const [builderMode, setBuilderMode] = useState<"uniform" | "custom">(
    "uniform",
  );

  const [rowCount, setRowCount] = useState(5);
  const [seatsPerRow, setSeatsPerRow] = useState(10);
  const [rowStartLetter, setRowStartLetter] = useState("A");
  const [seatNumberStart, setSeatNumberStart] = useState(1);
  const [numbering, setNumbering] = useState<SeatNumberingMode>("ltr");
  const [rowGrowth, setRowGrowth] = useState<RowGrowth>("down");
  const [mirrorRows, setMirrorRows] = useState(false);

  const [customRows, setCustomRows] = useState<CustomBuilderRow[]>([]);

  const [startPosX, setStartPosX] = useState(10);
  const [startPosY, setStartPosY] = useState(10);
  const [stepX, setStepX] = useState(5);
  const [stepY, setStepY] = useState(5);
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(4);
  const [shape, setShape] = useState<string>("rect");
  const [rotation, setRotation] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [hRes, tRes] = await Promise.all([
          getHalls({ per_page: 500 }),
          getPriceTiers({ per_page: 500 }),
        ]);
        setHalls(extractPaginated<Hall>(hRes).data);
        setTiers(extractPaginated<PriceTier>(tRes).data);
      } catch {
        setError("Could not load halls or tiers.");
      }
    })();
  }, []);

  const tiersForHall = useMemo(
    () => tiers.filter((t) => t.hall_id === hallId),
    [tiers, hallId],
  );

  useEffect(() => {
    if (hallId && tiersForHall.length) {
      const ok = tiersForHall.some((t) => t.id === tierId);
      if (!ok) setTierId(tiersForHall[0]!.id);
    } else {
      setTierId(0);
    }
  }, [hallId, tiersForHall, tierId]);

  useEffect(() => {
    if (halls.length && !hallId) {
      setHallId(halls[0]!.id);
    }
  }, [halls, hallId]);

  const uniformConfig = useMemo((): SeatGridConfig | null => {
    if (!hallId || !tierId) return null;
    return {
      hall_id: hallId,
      price_tier_id: tierId,
      row_count: Math.max(1, rowCount),
      seats_per_row: Math.max(1, seatsPerRow),
      row_start_letter: rowStartLetter,
      seat_number_start: Math.max(0, seatNumberStart),
      numbering,
      row_growth: rowGrowth,
      mirror_alternating_rows: mirrorRows,
      start_pos_x: startPosX,
      start_pos_y: startPosY,
      step_x: stepX,
      step_y: stepY,
      width: Math.max(1, width),
      height: Math.max(1, height),
      shape,
      rotation,
      is_active: isActive,
    };
  }, [
    hallId,
    tierId,
    rowCount,
    seatsPerRow,
    rowStartLetter,
    seatNumberStart,
    numbering,
    rowGrowth,
    mirrorRows,
    startPosX,
    startPosY,
    stepX,
    stepY,
    width,
    height,
    shape,
    rotation,
    isActive,
  ]);

  const customInputs = useMemo(
    () => customRows.map(({ id: _id, ...rest }) => rest),
    [customRows],
  );

  const previewSeats = useMemo(() => {
    if (!hallId || !tierId) return [];
    try {
      if (builderMode === "uniform") {
        if (!uniformConfig) return [];
        return generateBulkSeatsFromGrid(uniformConfig);
      }
      if (customRows.length === 0) return [];
      return generateBulkSeatsFromCustomRows({
        hall_id: hallId,
        default_price_tier_id: tierId,
        rows: customInputs,
        seat_number_start: Math.max(0, seatNumberStart),
        width: Math.max(1, width),
        height: Math.max(1, height),
        shape,
        rotation,
        is_active: isActive,
      });
    } catch {
      return [];
    }
  }, [
    hallId,
    tierId,
    builderMode,
    uniformConfig,
    customInputs,
    seatNumberStart,
    width,
    height,
    shape,
    rotation,
    isActive,
  ]);

  const tierColorMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of tiers) {
      if (t.color) m.set(t.id, t.color);
    }
    return m;
  }, [tiers]);

  const currentTier = useMemo(
    () => tiers.find((t) => t.id === tierId),
    [tiers, tierId],
  );

  function syncCustomFromUniform() {
    if (!uniformConfig) return;
    setCustomRows(
      customRowsFromUniformGrid(uniformConfig).map((r) => ({
        ...r,
        id: newId(),
      })),
    );
  }

  function applyUniformGuessFromCustom() {
    const guessed = guessUniformFromCustomRows(
      customRows.map(({ id: _id, ...r }) => ({
        row: r.row,
        seat_count: r.seat_count,
        start_pos_x: r.start_pos_x,
        start_pos_y: r.start_pos_y,
        step_x: r.step_x,
        mirror: r.mirror,
        price_tier_id: r.price_tier_id,
      })),
    );
    if (!guessed) return;
    setRowCount(guessed.row_count);
    setSeatsPerRow(guessed.seats_per_row);
    setStartPosX(guessed.start_pos_x);
    setStartPosY(guessed.start_pos_y);
    setStepX(guessed.step_x);
    setStepY(guessed.step_y);
    setRowStartLetter(guessed.row_start_letter);
    setMirrorRows(guessed.mirror_alternating_rows);
  }

  function setMode(next: "uniform" | "custom") {
    if (next === builderMode) return;
    if (next === "custom") {
      syncCustomFromUniform();
    } else {
      applyUniformGuessFromCustom();
    }
    setBuilderMode(next);
  }

  function updateCustomRow(id: string, patch: Partial<CustomBuilderRow>) {
    setCustomRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  function addCustomRow() {
    setCustomRows((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: newId(),
            row: rowStartLetter.trim().toUpperCase().charAt(0) || "A",
            seat_count: Math.max(1, seatsPerRow),
            start_pos_x: startPosX,
            start_pos_y: startPosY,
            step_x: stepX,
            mirror: false,
            price_tier_id: null,
          },
        ];
      }
      const last = prev[prev.length - 1]!;
      return [
        ...prev,
        {
          id: newId(),
          row: nextRowLabel(last.row),
          seat_count: last.seat_count,
          start_pos_x: last.start_pos_x,
          start_pos_y: last.start_pos_y + stepY,
          step_x: last.step_x,
          mirror: false,
          price_tier_id: null,
        },
      ];
    });
  }

  function removeCustomRow(id: string) {
    setCustomRows((rows) => {
      if (rows.length <= 1) return rows;
      return rows.filter((r) => r.id !== id);
    });
  }

  function duplicateCustomRow(id: string) {
    setCustomRows((rows) => {
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) return rows;
      const src = rows[i]!;
      const clone: CustomBuilderRow = {
        ...src,
        id: newId(),
        row: nextRowLabel(src.row),
        start_pos_y: src.start_pos_y + stepY,
      };
      const next = [...rows];
      next.splice(i + 1, 0, clone);
      return next;
    });
  }

  function openLayoutEditor() {
    if (previewSeats.length === 0) return;
    saveLayoutDraft({ hallId, tierId, seats: previewSeats });
    router.push("/dashboard/seats/layout");
  }

  const handleSubmit = useCallback(async () => {
    setError(null);
    setMessage(null);
    if (!hallId || !tierId) {
      setError("Select a hall and price tier.");
      return;
    }
    if (builderMode === "custom" && customRows.length === 0) {
      setError(
        "Add at least one row in Custom mode, or switch to Uniform grid.",
      );
      return;
    }
    if (previewSeats.length === 0) {
      setError("No seats to create. Check grid settings.");
      return;
    }
    const payload = previewSeats.map(({ hall_id, ...rest }) => {
      if (!rest.price_tier_id) rest.price_tier_id = tierId;
      return rest;
    });
    setSubmitting(true);
    try {
      await bulkInsertSeats(hallId, payload);
      setMessage(`Created ${previewSeats.length} seats via bulk API.`);
    } catch (e: unknown) {
      setError(
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Bulk insert failed. Check API and payload.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [hallId, tierId, previewSeats, builderMode, customRows.length]);

  const hallName = halls.find((h) => h.id === hallId)?.name ?? "—";
  const tierName = tiers.find((t) => t.id === tierId)?.name ?? "—";

  const canSubmit =
    previewSeats.length > 0 &&
    hallId &&
    tierId &&
    (builderMode === "uniform" || customRows.length > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-28 lg:pb-8">
      <SeatsSubnav />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Seats · Bulk builder
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Custom bulk seat builder
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Choose a{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">
              uniform grid
            </strong>{" "}
            or{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">
              row-by-row
            </strong>{" "}
            placement, preview live, then insert or refine in Hall layout.
          </p>
        </div>
        <div className="hidden shrink-0 flex-col gap-2 sm:flex-row lg:flex">
          <Button
            type="button"
            size="lg"
            className="gap-2"
            disabled={!canSubmit || submitting}
            onClick={() => void handleSubmit()}
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting…" : `Insert ${previewSeats.length} seats`}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="gap-2"
            disabled={previewSeats.length === 0}
            onClick={openLayoutEditor}
          >
            <MousePointer2 className="h-4 w-4" />
            Hall layout
          </Button>
        </div>
      </div>

      <Card className="border-zinc-200/80 dark:border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">User manual</CardTitle>
          <CardDescription>
            Step-by-step reference for uniform vs custom modes and API behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[min(70vh,520px)] overflow-y-auto pr-1">
          <SeatBuilderManual />
        </CardContent>
      </Card>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4 shadow-sm dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-950">
        <div className="flex min-w-[5rem] flex-col">
          <span className="text-xs font-medium text-zinc-500">Seats</span>
          <span className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
            {previewSeats.length}
          </span>
        </div>
        <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {hallName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {currentTier?.color ? (
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600"
                style={{ backgroundColor: currentTier.color }}
                title={tierName}
              />
            ) : null}
            <span className="text-zinc-600 dark:text-zinc-400">
              Default tier: <span className="font-medium">{tierName}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Builder mode
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={builderMode === "uniform" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setMode("uniform")}
          >
            <LayoutGrid className="h-4 w-4" />
            Uniform grid
          </Button>
          <Button
            type="button"
            variant={builderMode === "custom" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setMode("custom")}
          >
            Custom rows
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                  aria-hidden
                >
                  1
                </span>
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                    Target
                  </CardTitle>
                  <CardDescription>
                    Hall and default price tier for new seats.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Hall</Label>
                <Select
                  value={hallId ? String(hallId) : ""}
                  onValueChange={(v) => setHallId(Number(v))}
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
                <Label>Default price tier</Label>
                <Select
                  value={tierId ? String(tierId) : ""}
                  onValueChange={(v) => setTierId(Number(v))}
                  disabled={!hallId || tiersForHall.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiersForHall.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {builderMode === "uniform" ? (
            <Card className="border-zinc-200/80 shadow-sm dark:border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                    aria-hidden
                  >
                    2
                  </span>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <LayoutGrid className="h-4 w-4 text-zinc-500" />
                      Grid &amp; numbering
                    </CardTitle>
                    <CardDescription>
                      Same seats per row, shared spacing, global numbering
                      rules.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rows">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    min={1}
                    value={rowCount}
                    onChange={(e) => setRowCount(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cols">Seats per row</Label>
                  <Input
                    id="cols"
                    type="number"
                    min={1}
                    value={seatsPerRow}
                    onChange={(e) => setSeatsPerRow(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="row0">First row letter</Label>
                  <Input
                    id="row0"
                    maxLength={1}
                    value={rowStartLetter}
                    onChange={(e) => setRowStartLetter(e.target.value || "A")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="n0">First seat number</Label>
                  <Input
                    id="n0"
                    type="number"
                    min={0}
                    value={seatNumberStart}
                    onChange={(e) =>
                      setSeatNumberStart(Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seat numbering</Label>
                  <Select
                    value={numbering}
                    onValueChange={(v) => setNumbering(v as SeatNumberingMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ltr">
                        Left → right (same every row)
                      </SelectItem>
                      <SelectItem value="rtl">
                        Right → left (same every row)
                      </SelectItem>
                      <SelectItem value="serpentine">
                        Serpentine (snake by row)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Next row direction (Y)</Label>
                  <Select
                    value={rowGrowth}
                    onValueChange={(v) => setRowGrowth(v as RowGrowth)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="down">Down (+pos_y)</SelectItem>
                      <SelectItem value="up">Up (−pos_y)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input
                    id="mirror"
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300"
                    checked={mirrorRows}
                    onChange={(e) => setMirrorRows(e.target.checked)}
                  />
                  <Label htmlFor="mirror" className="font-normal">
                    Mirror alternating rows (zig-zag X — pairs well with
                    serpentine)
                  </Label>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-200/80 shadow-sm dark:border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                      aria-hidden
                    >
                      2
                    </span>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <LayoutGrid className="h-4 w-4 text-zinc-500" />
                        Custom rows
                      </CardTitle>
                      <CardDescription>
                        Per-row seat count, position, pitch, optional tier
                        override. Seat numbers use one global counter (see
                        manual).
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={syncCustomFromUniform}
                      disabled={!uniformConfig}
                    >
                      Sync from uniform
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1"
                      onClick={addCustomRow}
                    >
                      <Plus className="h-4 w-4" />
                      Add row
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[3rem]">Row</TableHead>
                        <TableHead className="min-w-[4rem]">Seats</TableHead>
                        <TableHead className="min-w-[5rem]">Start X</TableHead>
                        <TableHead className="min-w-[5rem]">Start Y</TableHead>
                        <TableHead className="min-w-[5rem]">Step X</TableHead>
                        <TableHead className="w-16">Mirror</TableHead>
                        <TableHead className="min-w-[8rem]">Tier</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customRows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="py-2">
                            <Input
                              className="h-8 w-12 px-1 text-center font-bold"
                              value={r.row}
                              onChange={(e) =>
                                updateCustomRow(r.id, {
                                  row: e.target.value.toUpperCase().charAt(0),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-8 w-14"
                              type="number"
                              min={1}
                              value={r.seat_count}
                              onChange={(e) =>
                                updateCustomRow(r.id, {
                                  seat_count: Number(e.target.value) || 1,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-8 w-20"
                              type="number"
                              value={r.start_pos_x}
                              onChange={(e) =>
                                updateCustomRow(r.id, {
                                  start_pos_x: Number(e.target.value),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-8 w-20"
                              type="number"
                              value={r.start_pos_y}
                              onChange={(e) =>
                                updateCustomRow(r.id, {
                                  start_pos_y: Number(e.target.value),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-8 w-16"
                              type="number"
                              step={0.5}
                              value={r.step_x}
                              onChange={(e) =>
                                updateCustomRow(r.id, {
                                  step_x: Number(e.target.value),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-zinc-300"
                              checked={r.mirror}
                              onChange={(e) =>
                                updateCustomRow(r.id, {
                                  mirror: e.target.checked,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Select
                              value={
                                r.price_tier_id ? String(r.price_tier_id) : "0"
                              }
                              onValueChange={(v) =>
                                updateCustomRow(r.id, {
                                  price_tier_id:
                                    v === "0" ? null : Number(v),
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Default</SelectItem>
                                {tiersForHall.map((t) => (
                                  <SelectItem key={t.id} value={String(t.id)}>
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                onClick={() => duplicateCustomRow(r.id)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-red-600"
                                disabled={customRows.length <= 1}
                                onClick={() => removeCustomRow(r.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                  aria-hidden
                >
                  3
                </span>
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shapes className="h-4 w-4 text-zinc-500" />
                    Seat geometry
                  </CardTitle>
                  <CardDescription>
                    Physical dimensions, shape, and rotation for all generated
                    seats.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Width</Label>
                <Input
                  type="number"
                  min={1}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input
                  type="number"
                  min={1}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Shape</Label>
                <Select value={shape} onValueChange={setShape}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rect">Rectangle</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="sofa">Sofa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rotation (°)</Label>
                <Input
                  type="number"
                  step={45}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Live Preview</CardTitle>
              <CardDescription>
                {previewSeats.length} seats generated. colors based on tier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square w-full rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                <SeatBuilderPreview
                  seats={previewSeats}
                  tierColors={tierColorMap}
                />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={!canSubmit || submitting}
                  onClick={() => void handleSubmit()}
                >
                  <Send className="h-4 w-4" />
                  {submitting
                    ? "Submitting…"
                    : `Insert ${previewSeats.length} seats`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={previewSeats.length === 0}
                  onClick={openLayoutEditor}
                >
                  <MousePointer2 className="h-4 w-4" />
                  Hall layout
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">JSON Payload</CardTitle>
              <CardDescription>First 3 items only.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-48 overflow-auto rounded-md bg-zinc-50 p-2 text-[10px] dark:bg-zinc-900/50">
                {JSON.stringify(previewSeats.slice(0, 3), null, 2)}
              </pre>
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-zinc-500 uppercase">Seats</p>
            <p className="text-lg font-bold tabular-nums">
              {previewSeats.length}
            </p>
          </div>
          <Button
            type="button"
            className="flex-1 gap-2"
            disabled={!canSubmit || submitting}
            onClick={() => void handleSubmit()}
          >
            <Send className="h-4 w-4" />
            Submit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            disabled={previewSeats.length === 0}
            onClick={openLayoutEditor}
          >
            <MousePointer2 className="h-4 w-4" />
            Refine
          </Button>
        </div>
      </div>
    </div>
  );
}
