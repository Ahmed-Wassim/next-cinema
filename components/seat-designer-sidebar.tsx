"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ChevronDown,
  Paintbrush2,
  Plus,
  RotateCcw,
  RotateCw,
  Rows3,
  Trash2,
  Link2,
  Link2Off,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Sparkles,
} from "lucide-react";

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
import { cn } from "@/lib/utils";
import { curveSelectedSeatsAlongRow } from "@/lib/curve-seat-row";
import type { Hall } from "@/types/hall";
import type { PriceTier } from "@/types/price-tier";
import type { LayoutSeat } from "@/types/seat-layout";
import type { DesignerTool, SeatDefaults } from "@/types/designer-types";

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                                */
/* ------------------------------------------------------------------ */

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  className,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details
      className={cn(
        "group rounded-xl border border-zinc-200 bg-white open:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60",
        className,
      )}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-900 marker:content-none dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
        {Icon && <Icon className="h-3.5 w-3.5 text-zinc-400" />}
        {title}
      </summary>
      <div className="space-y-3 border-t border-zinc-100 px-3 pb-3 pt-3 dark:border-zinc-800">
        {children}
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SeatDesignerSidebarProps {
  /* Venue target */
  halls: Hall[];
  tiers: PriceTier[];
  hallId: number;
  tierId: number;
  onHallChange: (v: number) => void;
  onTierChange: (v: number) => void;
  tiersForHall: PriceTier[];

  /* Seats */
  seats: LayoutSeat[];
  onSeatsChange: (next: LayoutSeat[]) => void;
  selectedKeys: Set<string>;
  onSelectionChange: React.Dispatch<React.SetStateAction<Set<string>>>;

  /* Active tool */
  activeTool: DesignerTool;

  /* Tier paint */
  paintTierId: number;
  onPaintTierChange: (v: number) => void;

  /* Seat defaults */
  seatDefaults: SeatDefaults;
  onSeatDefaultsChange: React.Dispatch<React.SetStateAction<SeatDefaults>>;

  /* Row generator */
  nextRowLabel: string;
  defaultTierId: number;
  viewportCenter: { x: number; y: number };

  className?: string;
}

export function SeatDesignerSidebar({
  halls,
  tiers,
  hallId,
  tierId,
  onHallChange,
  onTierChange,
  tiersForHall,
  seats,
  onSeatsChange,
  selectedKeys,
  onSelectionChange,
  activeTool,
  paintTierId,
  onPaintTierChange,
  seatDefaults,
  onSeatDefaultsChange,
  nextRowLabel,
  defaultTierId,
  viewportCenter,
  className,
}: SeatDesignerSidebarProps) {
  /* ---- Selected seats ---- */
  const selectedSeats = useMemo(
    () => seats.filter((s) => selectedKeys.has(s.layoutKey)),
    [seats, selectedKeys],
  );
  const selectedCount = selectedSeats.length;

  /* ---- Row labels ---- */
  const rowLetters = useMemo(() => {
    const u = new Set<string>();
    seats.forEach((s) => u.add(s.row));
    return [...u].sort();
  }, [seats]);

  /* ---- Assign tier to selection ---- */
  const [assignTierId, setAssignTierId] = useState(0);
  function applyTierToSelection() {
    if (!assignTierId || selectedKeys.size === 0) return;
    onSeatsChange(
      seats.map((s) =>
        selectedKeys.has(s.layoutKey)
          ? { ...s, price_tier_id: assignTierId }
          : s,
      ),
    );
  }

  /* ---- Rotation ---- */
  const [rotationEdit, setRotationEdit] = useState(0);
  function applyRotation(delta?: number) {
    if (selectedKeys.size === 0) return;
    onSeatsChange(
      seats.map((s) => {
        if (!selectedKeys.has(s.layoutKey)) return s;
        const base = delta != null ? s.rotation + delta : rotationEdit;
        return { ...s, rotation: base };
      }),
    );
  }

  /* ---- Curve ---- */
  const [rowBulge, setRowBulge] = useState(8);
  const [bowToward, setBowToward] = useState<"screen" | "audience">("screen");
  const [rotateWithCurve, setRotateWithCurve] = useState(true);

  function applyCurve() {
    if (selectedKeys.size < 2) return;
    const bulge =
      bowToward === "screen" ? Math.abs(rowBulge) : -Math.abs(rowBulge);
    onSeatsChange(
      curveSelectedSeatsAlongRow(seats, selectedKeys, {
        bulge,
        rotateWithArc: rotateWithCurve,
      }),
    );
  }

  /* ---- Row generator ---- */
  const [rowGen, setRowGen] = useState({
    seatCount: 10,
    rowLabel: "A",
    startX: 10,
    startY: 10,
    gapX: 4, // gap between seats horizontally
    gapY: 4, // gap between rows vertically
    priceTierId: null as number | null,
  });

  /* ---- Aspect Ratio Lock ---- */
  const [lockSquare, setLockSquare] = useState(true);

  /* ---- Distribute Spacing ---- */
  const [distGapX, setDistGapX] = useState(4);
  const [distGapY, setDistGapY] = useState(4);

  function distributeSelected(axis: "x" | "y") {
    if (selectedKeys.size < 2) return;
    const sel = seats.filter((s) => selectedKeys.has(s.layoutKey));

    if (axis === "x") {
      sel.sort((a, b) => a.pos_x - b.pos_x);
      let currentX = sel[0].pos_x;
      const nextSeats = [...seats];
      sel.forEach((s) => {
        const idx = nextSeats.findIndex((x) => x.layoutKey === s.layoutKey);
        nextSeats[idx] = { ...s, pos_x: currentX };
        currentX += s.width + distGapX;
      });
      onSeatsChange(nextSeats);
    } else {
      sel.sort((a, b) => a.pos_y - b.pos_y);
      let currentY = sel[0].pos_y;
      const nextSeats = [...seats];
      sel.forEach((s) => {
        const idx = nextSeats.findIndex((x) => x.layoutKey === s.layoutKey);
        nextSeats[idx] = { ...s, pos_y: currentY };
        currentY += s.height + distGapY;
      });
      onSeatsChange(nextSeats);
    }
  }

  function generateRow() {
    const count = Math.max(1, Math.floor(rowGen.seatCount));
    const tier = rowGen.priceTierId ?? defaultTierId;
    const newSeats: LayoutSeat[] = [];
    const startSort = seats.length + 1;
    const rowWidth =
      count * seatDefaults.width + Math.max(0, count - 1) * rowGen.gapX;
    const centerX = viewportCenter.x - rowWidth / 2;
    const centerY = viewportCenter.y - seatDefaults.height / 2;

    // If the user is still using the default origin, center by viewport; otherwise keep custom coords.
    const startX = rowGen.startX === 10 ? centerX : rowGen.startX;
    const startY = rowGen.startY === 10 ? centerY : rowGen.startY;

    const actualStepX = seatDefaults.width + rowGen.gapX;

    for (let i = 0; i < count; i++) {
      newSeats.push({
        layoutKey: crypto.randomUUID(),
        hall_id: hallId,
        price_tier_id: tier,
        row: rowGen.rowLabel.trim() || "?",
        number: String(i + 1),
        pos_x: startX + i * actualStepX,
        pos_y: startY,
        rotation: seatDefaults.rotation,
        width: seatDefaults.width,
        height: seatDefaults.height,
        shape: seatDefaults.shape,
        sort_order: startSort + i,
        is_active: seatDefaults.is_active,
      });
    }
    onSeatsChange([...seats, ...newSeats]);
    // Select the new row
    onSelectionChange(new Set(newSeats.map((s) => s.layoutKey)));
    // Auto-increment row label & move Y down by seat height + gapY
    const ch = rowGen.rowLabel.trim().toUpperCase().charAt(0);
    const code = ch >= "A" && ch <= "Z" ? ch.charCodeAt(0) : 64;
    const nextLabel = String.fromCharCode(Math.min(code + 1, 90));
    setRowGen((prev) => ({
      ...prev,
      rowLabel: nextLabel,
      startX,
      startY: startY + seatDefaults.height + prev.gapY,
    }));
  }

  /* ---- Delete selection ---- */
  function deleteSelected() {
    if (selectedKeys.size === 0) return;
    onSeatsChange(seats.filter((s) => !selectedKeys.has(s.layoutKey)));
    onSelectionChange(new Set());
  }

  /* ---- Select by row ---- */
  function selectRow(letter: string) {
    const next = new Set<string>();
    seats.forEach((s) => {
      if (s.row === letter) next.add(s.layoutKey);
    });
    onSelectionChange(next);
  }

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-3 lg:w-[320px] lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto",
        className,
      )}
    >
      {/* ---- Venue ---- */}
      <Section title="Venue">
        <div className="grid gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Hall</Label>
            <Select
              value={hallId ? String(hallId) : ""}
              onValueChange={(v) => onHallChange(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs">
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
          <div className="space-y-1">
            <Label className="text-xs">Default tier</Label>
            <Select
              value={tierId ? String(tierId) : ""}
              onValueChange={(v) => onTierChange(Number(v))}
              disabled={!hallId || !tiersForHall.length}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                {tiersForHall.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    <span className="flex items-center gap-2">
                      {t.color && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border border-zinc-300"
                          style={{ backgroundColor: t.color }}
                        />
                      )}
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* ---- Seat appearance ---- */}
      <Section title="Seat defaults" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2 relative">
          {/* Square aspect ratio lock button */}
          <button
            type="button"
            className={cn(
              "absolute left-[calc(50%-12px)] top-[26px] z-10 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors",
              lockSquare
                ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900"
                : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-700 dark:bg-zinc-900 dark:border-zinc-700",
            )}
            onClick={() => {
              setLockSquare(!lockSquare);
              if (!lockSquare) {
                // When locking, immediately make it square
                onSeatDefaultsChange((d) => ({ ...d, height: d.width }));
              }
            }}
            title={lockSquare ? "Unlock aspect ratio" : "Lock square"}
          >
            {lockSquare ? (
              <Link2 className="h-3 w-3" />
            ) : (
              <Link2Off className="h-3 w-3" />
            )}
          </button>
          <div className="space-y-1">
            <Label className="text-xs">Width</Label>
            <Input
              type="number"
              min={1}
              className="h-7 text-xs"
              value={seatDefaults.width}
              onChange={(e) =>
                onSeatDefaultsChange((d) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  return {
                    ...d,
                    width: val,
                    height: lockSquare ? val : d.height,
                  };
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height</Label>
            <Input
              type="number"
              min={1}
              className="h-7 text-xs"
              value={seatDefaults.height}
              disabled={lockSquare}
              onChange={(e) =>
                onSeatDefaultsChange((d) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  return {
                    ...d,
                    height: val,
                    width: lockSquare ? val : d.width,
                  };
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Shape</Label>
            <Select
              value={seatDefaults.shape}
              onValueChange={(v) =>
                onSeatDefaultsChange((d) => ({ ...d, shape: v }))
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rect">Rect</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="rounded_rect">Rounded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Rotation (°)</Label>
            <Input
              type="number"
              step={15}
              className="h-7 text-xs"
              value={seatDefaults.rotation}
              onChange={(e) =>
                onSeatDefaultsChange((d) => ({
                  ...d,
                  rotation: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
      </Section>

      {/* ---- Tier paint (visible when tool active) ---- */}
      {activeTool === "tier-paint" && (
        <Section title="Paint tier" icon={Paintbrush2}>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Click seats on the canvas to assign the selected tier.
          </p>
          <Select
            value={paintTierId ? String(paintTierId) : ""}
            onValueChange={(v) => onPaintTierChange(Number(v))}
            disabled={!tiersForHall.length}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Pick a tier" />
            </SelectTrigger>
            <SelectContent>
              {tiersForHall.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  <span className="flex items-center gap-2">
                    {t.color && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full border border-zinc-300"
                        style={{ backgroundColor: t.color }}
                      />
                    )}
                    {t.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>
      )}

      {/* ---- Row generator (visible when tool active) ---- */}
      {activeTool === "row" && (
        <Section title="Generate row" icon={Rows3}>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Generate a straight row. Then select it and use the Curve tool to
            arc it.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Seats</Label>
              <Input
                type="number"
                min={1}
                className="h-7 text-xs"
                value={rowGen.seatCount}
                onChange={(e) =>
                  setRowGen((r) => ({
                    ...r,
                    seatCount: Number(e.target.value) || 1,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Row label</Label>
              <Input
                className="h-7 text-xs"
                maxLength={2}
                value={rowGen.rowLabel}
                onChange={(e) =>
                  setRowGen((r) => ({ ...r, rowLabel: e.target.value || "A" }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start X</Label>
              <Input
                type="number"
                step={1}
                className="h-7 text-xs"
                value={rowGen.startX}
                onChange={(e) =>
                  setRowGen((r) => ({ ...r, startX: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Y</Label>
              <Input
                type="number"
                step={1}
                className="h-7 text-xs"
                value={rowGen.startY}
                onChange={(e) =>
                  setRowGen((r) => ({ ...r, startY: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gap X</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                className="h-7 text-xs"
                value={rowGen.gapX}
                onChange={(e) =>
                  setRowGen((r) => ({
                    ...r,
                    gapX: Math.max(0, Number(e.target.value) ?? 1),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gap Y</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                className="h-7 text-xs"
                value={rowGen.gapY}
                onChange={(e) =>
                  setRowGen((r) => ({
                    ...r,
                    gapY: Math.max(0, Number(e.target.value) ?? 1),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tier</Label>
              <Select
                value={
                  rowGen.priceTierId ? String(rowGen.priceTierId) : "default"
                }
                onValueChange={(v) =>
                  setRowGen((r) => ({
                    ...r,
                    priceTierId: v === "default" ? null : Number(v),
                  }))
                }
              >
                <SelectTrigger className="h-7 text-xs">
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
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full gap-1.5"
            disabled={rowGen.seatCount < 1 || !hallId}
            onClick={generateRow}
          >
            <Plus className="h-3.5 w-3.5" />
            Generate {rowGen.seatCount} seats (row {rowGen.rowLabel})
          </Button>
        </Section>
      )}

      {/* ---- Selection ---- */}
      <Section title={`Selection (${selectedCount})`}>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={!seats.length}
            onClick={() =>
              onSelectionChange(new Set(seats.map((s) => s.layoutKey)))
            }
          >
            All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={!selectedKeys.size}
            onClick={() => onSelectionChange(new Set())}
          >
            Clear
          </Button>
          {selectedCount > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={deleteSelected}
            >
              <Trash2 className="h-3 w-3" />
              Delete ({selectedCount})
            </Button>
          )}
        </div>

        {/* Single Seat Details */}
        {selectedCount === 1 && selectedSeats[0] && (
          <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/50 mt-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Seat Properties
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-zinc-500">Row</Label>
                <Input
                  className="h-7 px-2 text-xs"
                  value={selectedSeats[0].row}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value;
                    onSeatsChange(
                      seats.map((s) =>
                        s.layoutKey === selectedSeats[0]!.layoutKey
                          ? { ...s, row: val }
                          : s,
                      ),
                    );
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-zinc-500">Number</Label>
                <Input
                  className="h-7 px-2 text-xs"
                  value={selectedSeats[0].number}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value;
                    onSeatsChange(
                      seats.map((s) =>
                        s.layoutKey === selectedSeats[0]!.layoutKey
                          ? { ...s, number: val }
                          : s,
                      ),
                    );
                  }}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] text-zinc-500">
                  Custom Label (Optional)
                </Label>
                <Input
                  className="h-7 px-2 text-xs"
                  value={selectedSeats[0].label || ""}
                  placeholder="e.g. VIP, Wheelchair..."
                  onChange={(e) => {
                    const val = e.target.value;
                    onSeatsChange(
                      seats.map((s) =>
                        s.layoutKey === selectedSeats[0]!.layoutKey
                          ? { ...s, label: val }
                          : s,
                      ),
                    );
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-zinc-500">X Position</Label>
                <Input
                  type="number"
                  step={0.5}
                  className="h-7 px-2 text-xs"
                  value={selectedSeats[0].pos_x}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val))
                      onSeatsChange(
                        seats.map((s) =>
                          s.layoutKey === selectedSeats[0]!.layoutKey
                            ? { ...s, pos_x: val }
                            : s,
                        ),
                      );
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-zinc-500">Y Position</Label>
                <Input
                  type="number"
                  step={0.5}
                  className="h-7 px-2 text-xs"
                  value={selectedSeats[0].pos_y}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val))
                      onSeatsChange(
                        seats.map((s) =>
                          s.layoutKey === selectedSeats[0]!.layoutKey
                            ? { ...s, pos_y: val }
                            : s,
                        ),
                      );
                  }}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    onSeatsChange(
                      seats.map((s) =>
                        s.layoutKey === selectedSeats[0]!.layoutKey
                          ? { ...s, rotation: s.rotation - 15 }
                          : s,
                      ),
                    )
                  }
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    onSeatsChange(
                      seats.map((s) =>
                        s.layoutKey === selectedSeats[0]!.layoutKey
                          ? { ...s, rotation: s.rotation + 15 }
                          : s,
                      ),
                    )
                  }
                >
                  <RotateCw className="h-3 w-3" />
                </Button>
                <span className="text-[10px] text-zinc-500">
                  {Math.round(selectedSeats[0].rotation)}°
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Multi Selection Tools */}
        {selectedCount > 1 && (
          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/50 mt-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Bulk Edits ({selectedCount})
            </h4>

            {/* Align / Distribute */}
            <div className="space-y-2">
              <Label className="text-[10px]">Distribute Spacing</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={distGapX}
                    onChange={(e) => setDistGapX(Number(e.target.value) || 0)}
                    className="h-7 px-1 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => distributeSelected("x")}
                    title="Distribute horizontally"
                  >
                    <AlignHorizontalSpaceAround className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={distGapY}
                    onChange={(e) => setDistGapY(Number(e.target.value) || 0)}
                    className="h-7 px-1 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => distributeSelected("y")}
                    title="Distribute vertically"
                  >
                    <AlignVerticalSpaceAround className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tier Assignment */}
            <div className="space-y-1.5">
              <Label className="text-[10px]">Apply Tier</Label>
              <div className="flex gap-1.5">
                <Select
                  value={assignTierId ? String(assignTierId) : ""}
                  onValueChange={(v) => setAssignTierId(Number(v))}
                >
                  <SelectTrigger className="h-7 flex-1 text-[10px]">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiersForHall.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px]"
                  onClick={applyTierToSelection}
                >
                  Apply
                </Button>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-1.5">
              <Label className="text-[10px]">Apply Rotation</Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  value={rotationEdit}
                  onChange={(e) => setRotationEdit(Number(e.target.value))}
                  className="h-7 flex-1 text-xs"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => applyRotation()}
                >
                  Set
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Selection by Row */}
        {rowLetters.length > 0 && (
          <div className="space-y-1 mt-3">
            <Label className="text-xs">Pick row</Label>
            <Select onValueChange={(v) => selectRow(v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select Row" />
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
        )}
      </Section>

      {/* ---- Curve Selection ---- */}
      <Section title="Curve selection" icon={Sparkles} defaultOpen={false}>
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Curve the selected seats into an arc. Sorting is done automatically by
          row/number.
        </p>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Bulge (units)</Label>
            <Input
              type="number"
              step={1}
              className="h-7 text-xs"
              value={rowBulge}
              onChange={(e) => setRowBulge(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bow direction</Label>
            <Select
              value={bowToward}
              onValueChange={(v) => setBowToward(v as "screen" | "audience")}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="screen">Toward screen (+Y)</SelectItem>
                <SelectItem value="audience">Toward audience (−Y)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 py-1">
            <input
              id="rotcurve-side"
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-zinc-300"
              checked={rotateWithCurve}
              onChange={(e) => setRotateWithCurve(e.target.checked)}
            />
            <Label htmlFor="rotcurve-side" className="text-xs font-normal">
              Rotate seats with arc
            </Label>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full gap-1.5"
            disabled={selectedKeys.size < 2}
            onClick={applyCurve}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Apply curve
          </Button>
        </div>
      </Section>
    </aside>
  );
}
