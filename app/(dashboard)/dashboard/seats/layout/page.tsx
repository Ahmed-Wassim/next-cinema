"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { HallLayoutCanvas } from "@/components/hall-layout-canvas";
import { SeatsSubnav } from "@/components/seats-subnav";
import { SeatsWorkflowExplainer } from "@/components/seats-workflow-explainer";
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
import { curveSelectedSeatsAlongRow } from "@/lib/curve-seat-row";
import { consumeLayoutDraft } from "@/lib/layout-draft";
import { generateBulkSeatsFromGrid } from "@/lib/generate-bulk-seats";
import { extractPaginated } from "@/lib/extract-paginated";
import { getHalls } from "@/services/hallService";
import { getPriceTiers } from "@/services/priceTierService";
import { bulkInsertSeats } from "@/services/seatService";
import type { Hall } from "@/types/hall";
import type { PriceTier } from "@/types/price-tier";
import type { RowGrowth, SeatNumberingMode } from "@/types/seat-bulk";
import type { LayoutSeat } from "@/types/seat-layout";
import { stripLayoutKey, withLayoutKeys } from "@/types/seat-layout";

export default function HallLayoutEditorPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [tiers, setTiers] = useState<PriceTier[]>([]);

  const [hallId, setHallId] = useState(0);
  const [tierId, setTierId] = useState(0);

  const [rowCount, setRowCount] = useState(5);
  const [seatsPerRow, setSeatsPerRow] = useState(10);
  const [rowStartLetter, setRowStartLetter] = useState("A");
  const [seatNumberStart, setSeatNumberStart] = useState(1);
  const [numbering, setNumbering] = useState<SeatNumberingMode>("ltr");
  const [rowGrowth, setRowGrowth] = useState<RowGrowth>("down");
  const [mirrorRows, setMirrorRows] = useState(false);
  const [startPosX, setStartPosX] = useState(10);
  const [startPosY, setStartPosY] = useState(10);
  const [stepX, setStepX] = useState(5);
  const [stepY, setStepY] = useState(5);
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(4);
  const [shape, setShape] = useState("rect");
  const [rotation, setRotation] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [layoutSeats, setLayoutSeats] = useState<LayoutSeat[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [canvasScale, setCanvasScale] = useState(8);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapStep, setSnapStep] = useState(1);

  const [assignTierId, setAssignTierId] = useState(0);
  const [rotationEdit, setRotationEdit] = useState(0);
  const [rowBulge, setRowBulge] = useState(8);
  const [bowToward, setBowToward] = useState<"screen" | "audience">("screen");
  const [rotateWithCurve, setRotateWithCurve] = useState(true);

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

  useEffect(() => {
    const draft = consumeLayoutDraft();
    if (!draft) return;
    setHallId(draft.hallId);
    setTierId(draft.tierId);
    setLayoutSeats(withLayoutKeys(draft.seats));
    setMessage("Loaded a layout draft from the seat builder.");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedKeys(new Set());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tiersForHall = useMemo(
    () => tiers.filter((t) => t.hall_id === hallId),
    [tiers, hallId],
  );

  useEffect(() => {
    if (hallId && tiersForHall.length) {
      const ok = tiersForHall.some((t) => t.id === tierId);
      if (!ok) setTierId(tiersForHall[0]!.id);
    } else setTierId(0);
  }, [hallId, tiersForHall, tierId]);

  useEffect(() => {
    if (halls.length && !hallId) setHallId(halls[0]!.id);
  }, [halls, hallId]);

  useEffect(() => {
    if (tierId && tiersForHall.some((t) => t.id === tierId)) {
      setAssignTierId(tierId);
    }
  }, [hallId, tierId, tiersForHall]);

  useEffect(() => {
    setLayoutSeats((prev) => {
      if (!prev.length || !hallId || !tierId) return prev;
      let changed = false;
      const next = prev.map((s) => {
        if (s.hall_id === hallId && s.price_tier_id === tierId) return s;
        changed = true;
        return {
          ...s,
          hall_id: hallId,
          price_tier_id: tierId,
        };
      });
      return changed ? next : prev;
    });
  }, [hallId, tierId]);

  const tierColorById = useMemo(() => {
    const m = new Map<number, string>();
    tiers.forEach((t) => {
      if (t.color) m.set(t.id, t.color);
    });
    return m;
  }, [tiers]);

  const previewGrid = useMemo(() => {
    if (!hallId || !tierId) return [];
    try {
      return generateBulkSeatsFromGrid({
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
      });
    } catch {
      return [];
    }
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

  const rowLetters = useMemo(() => {
    const u = new Set<string>();
    layoutSeats.forEach((s) => u.add(s.row));
    return [...u].sort();
  }, [layoutSeats]);

  const selectedCount = selectedKeys.size;

  function replaceLayoutFromGrid() {
    if (previewGrid.length === 0) return;
    setLayoutSeats(withLayoutKeys(previewGrid));
    setSelectedKeys(new Set());
  }

  function applyTierToSelection() {
    if (!assignTierId || selectedKeys.size === 0) return;
    setLayoutSeats((prev) =>
      prev.map((s) =>
        selectedKeys.has(s.layoutKey)
          ? { ...s, price_tier_id: assignTierId }
          : s,
      ),
    );
  }

  function applyRotationToSelection(delta?: number) {
    if (selectedKeys.size === 0) return;
    setLayoutSeats((prev) =>
      prev.map((s) => {
        if (!selectedKeys.has(s.layoutKey)) return s;
        const base = delta != null ? s.rotation + delta : rotationEdit;
        return { ...s, rotation: base };
      }),
    );
  }

  function applyCurveToSelection() {
    if (selectedKeys.size < 2) {
      setError("Select at least two seats to curve a row.");
      return;
    }
    setError(null);
    const bulge =
      bowToward === "screen" ? Math.abs(rowBulge) : -Math.abs(rowBulge);
    setLayoutSeats((prev) =>
      curveSelectedSeatsAlongRow(prev, selectedKeys, {
        bulge,
        rotateWithArc: rotateWithCurve,
      }),
    );
  }

  function selectRowLetter(letter: string) {
    const next = new Set<string>();
    layoutSeats.forEach((s) => {
      if (s.row === letter) next.add(s.layoutKey);
    });
    setSelectedKeys(next);
  }

  const handleBulkSubmit = useCallback(async () => {
    setError(null);
    setMessage(null);
    if (!hallId || !tierId) {
      setError("Select hall and tier.");
      return;
    }
    if (layoutSeats.length === 0) {
      setError("No seats in the layout. Replace layout from grid first.");
      return;
    }
    const payload = layoutSeats.map(stripLayoutKey);
    setSubmitting(true);
    try {
      await bulkInsertSeats(hallId, payload);
      setMessage(`Created ${payload.length} seats.`);
    } catch (e: unknown) {
      setError(
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Bulk insert failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [hallId, tierId, layoutSeats]);

  useEffect(() => {
    if (selectedKeys.size !== 1) return;
    const key = [...selectedKeys][0]!;
    const s = layoutSeats.find((x) => x.layoutKey === key);
    if (s) setRotationEdit(Math.round(s.rotation));
  }, [selectedKeys, layoutSeats]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 pb-10">
      <SeatsSubnav />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-4 lg:w-[380px] lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Seats · Hall layout
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Visual layout editor
            </h1>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Drag seats, assign tiers to a selection, rotate chairs, curve
              rows. Use{" "}
              <Link
                href="/dashboard/seats/builder"
                className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
              >
                Bulk builder
              </Link>{" "}
              to generate a grid, then open here with the handoff button.{" "}
              <kbd className="rounded border border-zinc-300 px-1 text-xs dark:border-zinc-600">
                Esc
              </kbd>{" "}
              clears selection; ⌘/Ctrl+click toggles.
            </p>
          </div>

          <SeatsWorkflowExplainer variant="layout" />

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          {message ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {message}
            </p>
          ) : null}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Venue target</CardTitle>
              <CardDescription>
                Applies to new grids and keeps IDs in sync on every seat.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="space-y-1">
                <Label>Hall</Label>
                <Select
                  value={hallId ? String(hallId) : ""}
                  onValueChange={(v) => setHallId(Number(v))}
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
              <div className="space-y-1">
                <Label>Default tier (new grid)</Label>
                <Select
                  value={tierId ? String(tierId) : ""}
                  onValueChange={(v) => setTierId(Number(v))}
                  disabled={!hallId || !tiersForHall.length}
                >
                  <SelectTrigger>
                    <SelectValue />
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Grid → layout</CardTitle>
              <CardDescription>
                Compact grid; replaces all seats on the canvas.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Rows</Label>
                <Input
                  type="number"
                  min={1}
                  value={rowCount}
                  onChange={(e) => setRowCount(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Per row</Label>
                <Input
                  type="number"
                  min={1}
                  value={seatsPerRow}
                  onChange={(e) => setSeatsPerRow(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Row letter</Label>
                <Input
                  maxLength={1}
                  value={rowStartLetter}
                  onChange={(e) => setRowStartLetter(e.target.value || "A")}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Step X / Y</Label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    step={0.5}
                    value={stepX}
                    onChange={(e) => setStepX(Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    step={0.5}
                    value={stepY}
                    onChange={(e) => setStepY(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  variant="default"
                  disabled={previewGrid.length === 0}
                  onClick={replaceLayoutFromGrid}
                >
                  Replace layout from grid
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/seats/builder">Open full builder</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Selection</CardTitle>
              <CardDescription>
                {selectedCount} selected · {layoutSeats.length} total seats
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!layoutSeats.length}
                  onClick={() =>
                    setSelectedKeys(new Set(layoutSeats.map((s) => s.layoutKey)))
                  }
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!selectedKeys.size}
                  onClick={() => setSelectedKeys(new Set())}
                >
                  Clear
                </Button>
              </div>
              {rowLetters.length ? (
                <div className="space-y-1">
                  <Label className="text-xs">Select row</Label>
                  <Select onValueChange={(v) => selectRowLetter(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick row letter" />
                    </SelectTrigger>
                    <SelectContent>
                      {rowLetters.map((r) => (
                        <SelectItem key={r} value={r}>
                          Row {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assign price tier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                value={assignTierId ? String(assignTierId) : ""}
                onValueChange={(v) => setAssignTierId(Number(v))}
                disabled={!tiersForHall.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  {tiersForHall.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      <span className="flex items-center gap-2">
                        {t.color ? (
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-zinc-300"
                            style={{ backgroundColor: t.color }}
                          />
                        ) : null}
                        {t.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                disabled={!selectedKeys.size || !assignTierId}
                onClick={applyTierToSelection}
              >
                Apply tier to selection
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rotation</CardTitle>
              <CardDescription>
                Set angle (°) then apply, or nudge by ±15°.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                type="number"
                step={15}
                value={rotationEdit}
                onChange={(e) => setRotationEdit(Number(e.target.value))}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!selectedKeys.size}
                  onClick={() => applyRotationToSelection()}
                >
                  Apply angle
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!selectedKeys.size}
                  onClick={() => applyRotationToSelection(-15)}
                >
                  −15°
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!selectedKeys.size}
                  onClick={() => applyRotationToSelection(15)}
                >
                  +15°
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Curved row</CardTitle>
              <CardDescription>
                Bézier arc through the first → last selected seat (sorted by row
                &amp; number). Positive bulge bends toward the screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Bulge (layout units)</Label>
                <Input
                  type="number"
                  step={1}
                  value={rowBulge}
                  onChange={(e) =>
                    setRowBulge(Math.max(0, Number(e.target.value) || 0))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Bow direction</Label>
                <Select
                  value={bowToward}
                  onValueChange={(v) =>
                    setBowToward(v as "screen" | "audience")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="screen">Toward screen (+Y)</SelectItem>
                    <SelectItem value="audience">
                      Toward audience (−Y)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="rotcurve"
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300"
                  checked={rotateWithCurve}
                  onChange={(e) => setRotateWithCurve(e.target.checked)}
                />
                <Label htmlFor="rotcurve" className="font-normal">
                  Rotate seats along the arc
                </Label>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={selectedKeys.size < 2}
                onClick={applyCurveToSelection}
              >
                Curve selected seats
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                type="button"
                className="w-full"
                disabled={submitting || layoutSeats.length === 0}
                onClick={() => void handleBulkSubmit()}
              >
                {submitting
                  ? "Submitting…"
                  : `Bulk insert ${layoutSeats.length} seats`}
              </Button>
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Canvas</CardTitle>
              <CardDescription>
                Tier colors tint seats. Drag to move. Click background to clear
                selection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Zoom (px / unit)</Label>
                  <Input
                    className="h-8 w-24"
                    type="number"
                    min={4}
                    max={24}
                    value={canvasScale}
                    onChange={(e) =>
                      setCanvasScale(
                        Math.min(24, Math.max(4, Number(e.target.value) || 8)),
                      )
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="snap2"
                    type="checkbox"
                    className="h-4 w-4 rounded"
                    checked={snapEnabled}
                    onChange={(e) => setSnapEnabled(e.target.checked)}
                  />
                  <Label htmlFor="snap2">Snap</Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Snap step</Label>
                  <Input
                    className="h-8 w-24"
                    type="number"
                    min={0.5}
                    step={0.5}
                    disabled={!snapEnabled}
                    value={snapStep}
                    onChange={(e) =>
                      setSnapStep(Math.max(0.5, Number(e.target.value) || 1))
                    }
                  />
                </div>
              </div>

              {layoutSeats.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
                  Use <strong>Replace layout from grid</strong> or open the seat
                  builder and choose{" "}
                  <strong>Edit visually in hall layout</strong>.
                </p>
              ) : (
                <HallLayoutCanvas
                  seats={layoutSeats}
                  onSeatsChange={setLayoutSeats}
                  selectedKeys={selectedKeys}
                  onSelectionChange={setSelectedKeys}
                  onRequestClearSelection={() => setSelectedKeys(new Set())}
                  tierColorById={tierColorById}
                  scale={canvasScale}
                  snapEnabled={snapEnabled}
                  snapStep={snapStep}
                />
              )}
            </CardContent>
          </Card>

          {layoutSeats.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payload preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-48 overflow-auto rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-900/50">
                  {JSON.stringify(
                    layoutSeats.slice(0, 2).map(stripLayoutKey),
                    null,
                    2,
                  )}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
