"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Send } from "lucide-react";

import { SeatDesignerCanvas } from "@/components/seat-designer-canvas";
import { SeatDesignerSidebar } from "@/components/seat-designer-sidebar";
import { SeatDesignerToolbar } from "@/components/seat-designer-toolbar";
import { SeatsSubnav } from "@/components/seats-subnav";
import { Button } from "@/components/ui/button";
import { consumeLayoutDraft } from "@/lib/layout-draft";
import { extractPaginated } from "@/lib/extract-paginated";
import { generateBulkSeatsFromCustomRows } from "@/lib/generate-bulk-seats";
import { getHallSections } from "@/services/hallSectionService";
import { getHalls } from "@/services/hallService";
import { getPriceTiers } from "@/services/priceTierService";
import { bulkInsertSeats, getSeats } from "@/services/seatService";
import type { Hall } from "@/types/hall";
import type { Seat } from "@/types/seat";
import type { BulkSeatItem } from "@/types/seat-bulk";
import type { HallSection } from "@/types/hall-section";
import type { PriceTier } from "@/types/price-tier";
import type { LayoutSeat } from "@/types/seat-layout";
import { stripLayoutKey, withLayoutKeys } from "@/types/seat-layout";
import type {
  CanvasViewport,
  DesignerBounds,
  DesignerTool,
  SeatDefaults,
} from "@/types/designer-types";

function seatApiToBulkSeatItem(
  seat: Seat,
  ctx: { hallId: number; sectionId: number; fallbackTierId: number },
): BulkSeatItem & { id?: number } {
  const s = seat as Record<string, unknown>;
  return {
    id: typeof s.id === "number" ? s.id : undefined,
    hall_id: ctx.hallId,
    section_id: ctx.sectionId,
    price_tier_id: (typeof s.price_tier_id === "number"
      ? (s.price_tier_id as number)
      : ctx.fallbackTierId) as number,
    row: (typeof s.row === "string"
      ? (s.row as string)
      : typeof s.row_label === "string"
        ? (s.row_label as string)
        : "?") as string,
    number: (typeof s.number === "string"
      ? (s.number as string)
      : typeof s.col_label === "string"
        ? (s.col_label as string)
        : "1") as string,
    pos_x: Number(s.pos_x) || 0,
    pos_y: Number(s.pos_y) || 0,
    rotation: Number(s.rotation) || 0,
    width: Math.max(1, Number(s.width) || 15),
    height: Math.max(1, Number(s.height) || 15),
    shape: (typeof s.shape === "string"
      ? (s.shape as string)
      : "rect") as string,
    sort_order: Number(s.sort_order) || 1,
    is_active:
      typeof s.is_active === "boolean"
        ? (s.is_active as boolean)
        : typeof s.status === "string"
          ? String(s.status) === "active"
          : true,
  };
}

export default function SeatDesignerPage() {
  const designerBounds: DesignerBounds = useMemo(
    () => ({ x: 0, y: 0, width: 600, height: 400 }),
    [],
  );

  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
    w: 900,
    h: 520,
  });

  /* ---- Reference data ---- */
  const [halls, setHalls] = useState<Hall[]>([]);
  const [sections, setSections] = useState<HallSection[]>([]);
  const [tiers, setTiers] = useState<PriceTier[]>([]);

  const [hallId, setHallId] = useState(0);
  const [sectionId, setSectionId] = useState(0);
  const [tierId, setTierId] = useState(0);

  /* ---- Canvas state & History ---- */
  const [seats, setSeats] = useState<LayoutSeat[]>([]);
  const [past, setPast] = useState<LayoutSeat[][]>([]);
  const [future, setFuture] = useState<LayoutSeat[][]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const seatsRef = useRef<LayoutSeat[]>(seats);
  useEffect(() => {
    seatsRef.current = seats;
  }, [seats]);

  const clampSeatsToBounds = useCallback(
    (next: LayoutSeat[]) => {
      const minX = designerBounds.x;
      const minY = designerBounds.y;
      return next.map((s) => {
        const maxX = designerBounds.x + designerBounds.width - s.width;
        const maxY = designerBounds.y + designerBounds.height - s.height;
        const x = Math.min(maxX, Math.max(minX, s.pos_x));
        const y = Math.min(maxY, Math.max(minY, s.pos_y));
        return x === s.pos_x && y === s.pos_y
          ? s
          : { ...s, pos_x: x, pos_y: y };
      });
    },
    [designerBounds],
  );

  const alignSeatsBottomCenter = useCallback(
    (next: LayoutSeat[]) => {
      if (next.length === 0) return next;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const s of next) {
        minX = Math.min(minX, s.pos_x);
        minY = Math.min(minY, s.pos_y);
        maxX = Math.max(maxX, s.pos_x + s.width);
        maxY = Math.max(maxY, s.pos_y + s.height);
      }
      if (minX === Infinity) return next;

      const seatsW = Math.max(1, maxX - minX);
      const seatsH = Math.max(1, maxY - minY);

      const boundsLeft = designerBounds.x;
      const boundsRight = designerBounds.x + designerBounds.width;
      const boundsBottom = designerBounds.y + designerBounds.height;

      // Keep a little breathing room above the bottom edge (like a cinema).
      const bottomInset = 24;

      const targetCenterX = (boundsLeft + boundsRight) / 2;
      const currentCenterX = (minX + maxX) / 2;
      const dx = targetCenterX - currentCenterX;

      const targetMaxY = boundsBottom - bottomInset;
      const dy = targetMaxY - maxY;

      // Apply translation then clamp so we never exit the box.
      const moved = next.map((s) => ({
        ...s,
        pos_x: s.pos_x + dx,
        pos_y: s.pos_y + dy,
      }));
      // If seats are larger than the box, clamping will pin them; still okay.
      return clampSeatsToBounds(moved);
    },
    [designerBounds, clampSeatsToBounds],
  );

  const handleSeatsChange = useCallback(
    (nextSeats: LayoutSeat[] | ((prev: LayoutSeat[]) => LayoutSeat[])) => {
      setSeats((prev) => {
        const rawNext =
          typeof nextSeats === "function" ? nextSeats(prev) : nextSeats;
        const next = clampSeatsToBounds(rawNext);
        if (next !== prev) {
          setPast((p) => [...p, prev]);
          setFuture([]);
          setHasSubmitted(false);
        }
        return next;
      });
    },
    [clampSeatsToBounds],
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    setPast((p) => p.slice(0, p.length - 1));
    setHasSubmitted(false);
    setSeats((prev) => {
      setFuture((f) => [prev, ...f]);
      return past[past.length - 1]!;
    });
  }, [past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    setFuture((f) => f.slice(1));
    setHasSubmitted(false);
    setSeats((prev) => {
      setPast((p) => [...p, prev]);
      return future[0]!;
    });
  }, [future]);

  // Global Undo/Redo shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [viewport, setViewport] = useState<CanvasViewport>({
    panX: 0,
    panY: 0,
    zoom: 1.1,
  });

  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      setCanvasSize({
        w: Math.max(320, Math.round(r.width)),
        h: Math.max(320, Math.round(r.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getCanvasViewportSize = useCallback(() => {
    const el = canvasWrapRef.current;
    if (!el) return canvasSize;
    const r = el.getBoundingClientRect();
    return {
      w: Math.max(320, Math.round(r.width || canvasSize.w)),
      h: Math.max(320, Math.round(r.height || canvasSize.h)),
    };
  }, [canvasSize]);

  const fitToView = useCallback(() => {
    const { w: viewW, h: viewH } = getCanvasViewportSize();
    const zoom = 1.1;

    const contentCenterX = designerBounds.x + designerBounds.width / 2;
    const contentCenterY = designerBounds.y + designerBounds.height / 2;

    const panX = contentCenterX - viewW / 2 / zoom;
    const panY = contentCenterY - viewH / 2 / zoom;

    setViewport({ panX, panY, zoom });
  }, [designerBounds, getCanvasViewportSize]);

  // NOTE: fitToView is only triggered manually from toolbar or explicit actions.
  const [activeTool, setActiveTool] = useState<DesignerTool>("select");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapStep, setSnapStep] = useState(1);
  const [seatDefaults, setSeatDefaults] = useState<SeatDefaults>({
    width: 15,
    height: 15,
    shape: "rect",
    rotation: 0,
    is_active: true,
  });

  /* ---- Tier paint ---- */
  const [paintTierId, setPaintTierId] = useState(0);

  /* ---- Auto-incrementing labels for "place" tool ---- */
  const [nextRowLabel, setNextRowLabel] = useState("A");
  const [nextSeatNumber, setNextSeatNumber] = useState(1);

  const [draftLoaded, setDraftLoaded] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---- Load reference data ---- */
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
  }, [designerBounds]);

  /* ---- Load draft from builder (if any) ---- */
  useEffect(() => {
    const draft = consumeLayoutDraft();
    if (!draft) return;
    setHallId(draft.hallId);
    setSectionId(draft.sectionId);
    setTierId(draft.tierId);
    const layoutSts = withLayoutKeys(draft.seats);
    setSeats(alignSeatsBottomCenter(layoutSts));
    setDraftLoaded(true);
    setMessage("Loaded layout draft from the seat builder.");
  }, [fitToView, alignSeatsBottomCenter]);

  const loadExistingSeats = useCallback(async () => {
    if (!sectionId || !hallId) return;
    setError(null);
    setMessage(null);
    setLoadingExisting(true);
    try {
      const res = await getSeats({
        hall_section_id: sectionId,
        per_page: 1000,
      });
      const data = extractPaginated<Seat>(res).data;
      const bulk = data.map((s) =>
        seatApiToBulkSeatItem(s, {
          hallId,
          sectionId,
          fallbackTierId: tierId || 0,
        }),
      );
      const layout = withLayoutKeys(bulk);
      handleSeatsChange(alignSeatsBottomCenter(layout));
      setHasSubmitted(true); // this mirrors server state
      setMessage(`Loaded ${layout.length} existing seats for this section.`);
    } catch {
      setError("Could not load existing seats for this section.");
    } finally {
      setLoadingExisting(false);
    }
  }, [
    sectionId,
    hallId,
    tierId,
    handleSeatsChange,
    fitToView,
    alignSeatsBottomCenter,
  ]);

  /* ---- Auto-load existing seats (only when empty, and no draft handoff) ---- */
  useEffect(() => {
    if (!hallId || !sectionId) return;
    if (draftLoaded) return;
    if (seatsRef.current.length > 0) return;
    void loadExistingSeats();
  }, [hallId, sectionId, draftLoaded, loadExistingSeats]);

  /* ---- Derived: sections & tiers for selected hall ---- */
  const sectionsForHall = useMemo(
    () => sections.filter((s) => s.hall_id === hallId),
    [sections, hallId],
  );
  const tiersForHall = useMemo(
    () => tiers.filter((t) => t.hall_id === hallId),
    [tiers, hallId],
  );

  /* ---- Auto-select defaults when hall changes ---- */
  useEffect(() => {
    if (halls.length && !hallId) setHallId(halls[0]!.id);
  }, [halls, hallId]);

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
    if (tierId && !paintTierId) setPaintTierId(tierId);
  }, [tierId, paintTierId]);

  /* ---- Tier color map ---- */
  const tierColorById = useMemo(() => {
    const m = new Map<number, string>();
    tiers.forEach((t) => {
      if (t.color) m.set(t.id, t.color);
    });
    return m;
  }, [tiers]);

  /* ---- Place tool: auto-increment seat number ---- */
  const handleSeatPlaced = useCallback(() => {
    setNextSeatNumber((n) => n + 1);
  }, []);

  /* ---- Submit ---- */
  const handleSubmit = useCallback(async () => {
    setError(null);
    setMessage(null);
    if (!hallId || !sectionId || !tierId) {
      setError("Select hall, section, and tier.");
      return;
    }
    if (seats.length === 0) {
      setError("No seats to submit.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = seats.map(stripLayoutKey);
      await bulkInsertSeats(payload);
      setMessage(`Created ${payload.length} seats via bulk API.`);
      setHasSubmitted(true);
    } catch (e: unknown) {
      setError(
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Bulk insert failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [hallId, sectionId, tierId, seats]);

  /* ---- Example Layout ---- */
  function loadExampleLayout() {
    if (!hallId || !sectionId || !tierId) {
      setError("Select hall, section, and tier first.");
      return;
    }
    setError(null);
    const draftRows = [
      {
        start_pos_x: 100,
        start_pos_y: 100,
        step_x: 19,
        seat_count: 12,
        row: "A",
        mirror: false,
        price_tier_id: tierId,
      },
      {
        start_pos_x: 100,
        start_pos_y: 119,
        step_x: 19,
        seat_count: 14,
        row: "B",
        mirror: false,
        price_tier_id: tierId,
      },
      {
        start_pos_x: 100,
        start_pos_y: 138,
        step_x: 19,
        seat_count: 16,
        row: "C",
        mirror: false,
        price_tier_id: tierId,
      },
      {
        start_pos_x: 100,
        start_pos_y: 157,
        step_x: 19,
        seat_count: 18,
        row: "D",
        mirror: false,
        price_tier_id: tierId,
      },
      {
        start_pos_x: 100,
        start_pos_y: 176,
        step_x: 19,
        seat_count: 18,
        row: "E",
        mirror: false,
        price_tier_id: tierId,
      },
      {
        start_pos_x: 81,
        start_pos_y: 215,
        step_x: 19,
        seat_count: 20,
        row: "F",
        mirror: false,
        price_tier_id: tierId,
      },
      {
        start_pos_x: 81,
        start_pos_y: 234,
        step_x: 19,
        seat_count: 20,
        row: "G",
        mirror: false,
        price_tier_id: tierId,
      },
      {
        start_pos_x: 81,
        start_pos_y: 253,
        step_x: 19,
        seat_count: 20,
        row: "H",
        mirror: false,
        price_tier_id: tierId,
      },
    ];
    const generated = generateBulkSeatsFromCustomRows({
      hall_id: hallId,
      section_id: sectionId,
      default_price_tier_id: tierId,
      rows: draftRows,
      seat_number_start: 1,
      width: 15,
      height: 15,
      shape: "rect",
      rotation: 0,
      is_active: true,
    });
    const layoutSts = withLayoutKeys(generated);
    handleSeatsChange(layoutSts);
    setMessage("Loaded example layout.");
    setTimeout(() => fitToView(), 50);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 overflow-hidden px-4 pb-4">
      <SeatsSubnav />

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Seats · Designer
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Drag-and-drop seat designer
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <p className="max-w-sm truncate rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}
          {message && (
            <p className="max-w-sm truncate rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              {message}
            </p>
          )}
          <Button
            type="button"
            className="gap-1.5"
            disabled={
              submitting || !hallId || !sectionId || !tierId || hasSubmitted
            }
            onClick={() => void handleSubmit()}
          >
            <Send className="h-3.5 w-3.5" />
            {submitting
              ? "Syncing…"
              : hasSubmitted
                ? "Saved!"
                : "Sync current layout"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-zinc-600 dark:text-zinc-400"
            disabled={loadingExisting || !hallId || !sectionId}
            onClick={() => void loadExistingSeats()}
          >
            {loadingExisting ? "Loading…" : "Load existing seats"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-zinc-600 dark:text-zinc-400"
            onClick={loadExampleLayout}
          >
            Load Example Template
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <SeatDesignerToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        viewport={viewport}
        onViewportChange={setViewport}
        snapEnabled={snapEnabled}
        onSnapEnabledChange={setSnapEnabled}
        snapStep={snapStep}
        onSnapStepChange={setSnapStep}
        selectedCount={selectedKeys.size}
        totalSeats={seats.length}
        onUndo={undo}
        onRedo={redo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onFitToView={() => fitToView()}
      />

      {/* Canvas + Sidebar */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="grid gap-3 lg:grid-cols-5">
          <div ref={canvasWrapRef} className="min-w-0 lg:col-span-3">
            <SeatDesignerCanvas
              seats={seats}
              onSeatsChange={handleSeatsChange}
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              tierColorById={tierColorById}
              viewport={viewport}
              onViewportChange={setViewport}
              activeTool={activeTool}
              seatDefaults={seatDefaults}
              snapEnabled={snapEnabled}
              snapStep={snapStep}
              hallId={hallId}
              sectionId={sectionId}
              defaultTierId={tierId}
              paintTierId={paintTierId}
              nextRowLabel={nextRowLabel}
              nextSeatNumber={nextSeatNumber}
              designerBounds={designerBounds}
              constrainToBounds
              onSeatPlaced={handleSeatPlaced}
              className="h-full"
            />
          </div>
          <SeatDesignerSidebar
            halls={halls}
            sections={sections}
            tiers={tiers}
            hallId={hallId}
            sectionId={sectionId}
            tierId={tierId}
            onHallChange={setHallId}
            onSectionChange={setSectionId}
            onTierChange={setTierId}
            sectionsForHall={sectionsForHall}
            tiersForHall={tiersForHall}
            seats={seats}
            onSeatsChange={handleSeatsChange}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            activeTool={activeTool}
            paintTierId={paintTierId}
            onPaintTierChange={setPaintTierId}
            seatDefaults={seatDefaults}
            onSeatDefaultsChange={setSeatDefaults}
            nextRowLabel={nextRowLabel}
            defaultTierId={tierId}
            className="lg:col-span-2"
          />
        </div>
      </div>
    </div>
  );
}
