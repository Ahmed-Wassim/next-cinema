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
import { getHallSections } from "@/services/hallSectionService";
import { getHalls } from "@/services/hallService";
import { getPriceTiers } from "@/services/priceTierService";
import { bulkInsertSeats } from "@/services/seatService";
import type { CustomBuilderRow } from "@/types/seat-builder";
import type { HallSection } from "@/types/hall-section";
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
  const [sections, setSections] = useState<HallSection[]>([]);
  const [tiers, setTiers] = useState<PriceTier[]>([]);

  const [hallId, setHallId] = useState(0);
  const [sectionId, setSectionId] = useState(0);
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
        const [hRes, secRes, tRes] = await Promise.all([
          getHalls({ per_page: 500 }),
          getHallSections({ per_page: 500 }),
          getPriceTiers({ per_page: 500 }),
        ]);
        setHalls(extractPaginated<Hall>(hRes).data);
        setSections(extractPaginated<HallSection>(secRes).data);
        setTiers(extractPaginated<PriceTier>(tRes).data);
      } catch {
        setError("Could not load halls, sections, or tiers.");
      }
    })();
  }, []);

  const sectionsForHall = useMemo(
    () => sections.filter((s) => s.hall_id === hallId),
    [sections, hallId],
  );

  const tiersForHall = useMemo(
    () => tiers.filter((t) => t.hall_id === hallId),
    [tiers, hallId],
  );

  useEffect(() => {
    if (hallId && sectionsForHall.length) {
      const ok = sectionsForHall.some((s) => s.id === sectionId);
      if (!ok) setSectionId(sectionsForHall[0]!.id);
    } else {
      setSectionId(0);
    }
  }, [hallId, sectionsForHall, sectionId]);

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
    if (!hallId || !sectionId || !tierId) return null;
    return {
      hall_id: hallId,
      section_id: sectionId,
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
    sectionId,
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
    if (!hallId || !sectionId || !tierId) return [];
    try {
      if (builderMode === "uniform") {
        if (!uniformConfig) return [];
        return generateBulkSeatsFromGrid(uniformConfig);
      }
      if (customRows.length === 0) return [];
      return generateBulkSeatsFromCustomRows({
        hall_id: hallId,
        section_id: sectionId,
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
    sectionId,
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
    saveLayoutDraft({ hallId, sectionId, tierId, seats: previewSeats });
    router.push("/dashboard/seats/layout");
  }

  const handleSubmit = useCallback(async () => {
    setError(null);
    setMessage(null);
    if (!hallId || !sectionId || !tierId) {
      setError("Select a hall, section, and price tier.");
      return;
    }
    if (builderMode === "custom" && customRows.length === 0) {
      setError("Add at least one row in Custom mode, or switch to Uniform grid.");
      return;
    }
    if (previewSeats.length === 0) {
      setError("No seats to create. Check grid settings.");
      return;
    }
    setSubmitting(true);
    try {
      await bulkInsertSeats(previewSeats);
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
  }, [hallId, sectionId, tierId, previewSeats, builderMode, customRows.length]);

  const hallName = halls.find((h) => h.id === hallId)?.name ?? "—";
  const sectionName =
    sections.find((s) => s.id === sectionId)?.name ?? "—";
  const tierName = tiers.find((t) => t.id === tierId)?.name ?? "—";

  const canSubmit =
    previewSeats.length > 0 &&
    hallId &&
    sectionId &&
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
            Choose a <strong className="font-medium text-zinc-800 dark:text-zinc-200">uniform grid</strong> or{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">row-by-row</strong> placement, preview
            live, then insert or refine in Hall layout.
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
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              {sectionName}
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
                    Hall, section, and default price tier for new seats.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
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
                <Label>Section</Label>
                <Select
                  value={sectionId ? String(sectionId) : ""}
                  onValueChange={(v) => setSectionId(Number(v))}
                  disabled={!hallId || sectionsForHall.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionsForHall.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
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
                      Same seats per row, shared spacing, global numbering rules.
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
                    Mirror alternating rows (zig-zag X — pairs well with serpentine)
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
                        Per-row seat count, position, pitch, optional tier override.
                        Seat numbers use one global counter (see manual).
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
                        <TableHead className="w-24 text-right"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Input
                              className="h-8 min-w-[2.5rem]"
                              value={row.row}
                              onChange={(e) =>
                                updateCustomRow(row.id, {
                                  row: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              className="h-8 w-20"
                              value={row.seat_count}
                              onChange={(e) =>
                                updateCustomRow(row.id, {
                                  seat_count: Math.max(
                                    0,
                                    Number(e.target.value) || 0,
                                  ),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.5"
                              className="h-8 w-24"
                              value={row.start_pos_x}
                              onChange={(e) =>
                                updateCustomRow(row.id, {
                                  start_pos_x: Number(e.target.value),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.5"
                              className="h-8 w-24"
                              value={row.start_pos_y}
                              onChange={(e) =>
                                updateCustomRow(row.id, {
                                  start_pos_y: Number(e.target.value),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.5"
                              className="h-8 w-24"
                              value={row.step_x}
                              onChange={(e) =>
                                updateCustomRow(row.id, {
                                  step_x: Number(e.target.value),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-zinc-300"
                              checked={row.mirror}
                              onChange={(e) =>
                                updateCustomRow(row.id, {
                                  mirror: e.target.checked,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={
                                row.price_tier_id
                                  ? String(row.price_tier_id)
                                  : "default"
                              }
                              onValueChange={(v) =>
                                updateCustomRow(row.id, {
                                  price_tier_id:
                                    v === "default" ? null : Number(v),
                                })
                              }
                              disabled={!tiersForHall.length}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                {tiersForHall.map((t) => (
                                  <SelectItem key={t.id} value={String(t.id)}>
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Duplicate row"
                                onClick={() => duplicateCustomRow(row.id)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400"
                                title="Remove row"
                                disabled={customRows.length <= 1}
                                onClick={() => removeCustomRow(row.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {customRows.length === 0 ? (
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    No rows yet — switch to Uniform and back to Custom, or click{" "}
                    <strong>Add row</strong>.
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="n0c">First seat number (global counter)</Label>
                    <Input
                      id="n0c"
                      type="number"
                      min={0}
                      value={seatNumberStart}
                      onChange={(e) =>
                        setSeatNumberStart(Number(e.target.value) || 0)
                      }
                    />
                  </div>
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
                    {builderMode === "uniform"
                      ? "Geometry & appearance"
                      : "Shared seat size & appearance"}
                  </CardTitle>
                  <CardDescription>
                    {builderMode === "uniform"
                      ? "Start position, spacing, and shape for the whole block."
                      : "Width, height, shape, and rotation apply to every generated seat; row positions are in the table above."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent
              className={cn(
                "grid gap-4",
                builderMode === "uniform"
                  ? "sm:grid-cols-2 lg:grid-cols-4"
                  : "sm:grid-cols-2 lg:grid-cols-4",
              )}
            >
              {builderMode === "uniform" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="px">Start pos X</Label>
                    <Input
                      id="px"
                      type="number"
                      step="0.5"
                      value={startPosX}
                      onChange={(e) => setStartPosX(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="py">Start pos Y</Label>
                    <Input
                      id="py"
                      type="number"
                      step="0.5"
                      value={startPosY}
                      onChange={(e) => setStartPosY(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sx">Step X</Label>
                    <Input
                      id="sx"
                      type="number"
                      step="0.5"
                      value={stepX}
                      onChange={(e) => setStepX(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sy">Step Y</Label>
                    <Input
                      id="sy"
                      type="number"
                      step="0.5"
                      value={stepY}
                      onChange={(e) => setStepY(Number(e.target.value))}
                    />
                  </div>
                </>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="w">Width</Label>
                <Input
                  id="w"
                  type="number"
                  min={1}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="h">Height</Label>
                <Input
                  id="h"
                  type="number"
                  min={1}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shape">Shape</Label>
                <Input
                  id="shape"
                  list="seat-shapes"
                  value={shape}
                  onChange={(e) => setShape(e.target.value || "rect")}
                  placeholder="rect, circle, …"
                />
                <datalist id="seat-shapes">
                  <option value="rect" />
                  <option value="circle" />
                  <option value="rounded_rect" />
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rot">Rotation (°)</Label>
                <Input
                  id="rot"
                  type="number"
                  step={15}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id="active"
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <Label htmlFor="active" className="font-normal">
                  is_active
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                    aria-hidden
                  >
                    4
                  </span>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-zinc-500" />
                      Preview &amp; API payload
                    </CardTitle>
                    <CardDescription>
                      Sample JSON for{" "}
                      <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
                        POST /seats/bulk
                      </code>
                      .
                    </CardDescription>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/dashboard/seats/layout">
                    Open hall layout (empty)
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  First 3 objects
                </p>
                <pre className="max-h-48 overflow-auto text-xs leading-relaxed">
                  {JSON.stringify(previewSeats.slice(0, 3), null, 2)}
                </pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="gap-2"
                  disabled={!canSubmit || submitting}
                  onClick={() => void handleSubmit()}
                >
                  <Send className="h-4 w-4" />
                  {submitting
                    ? "Submitting…"
                    : `Bulk insert ${previewSeats.length} seats`}
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
                  Continue in hall layout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <SeatBuilderPreview seats={previewSeats} tierColors={tierColorMap} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2 px-2">
          <Button
            type="button"
            className="min-h-11 flex-1 gap-2"
            disabled={!canSubmit || submitting}
            onClick={() => void handleSubmit()}
          >
            <Send className="h-4 w-4 shrink-0" />
            {submitting ? "…" : `Insert (${previewSeats.length})`}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 gap-2"
            disabled={previewSeats.length === 0}
            onClick={openLayoutEditor}
          >
            <MousePointer2 className="h-4 w-4 shrink-0" />
            Layout
          </Button>
        </div>
      </div>
    </div>
  );
}
