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
import { bulkInsertSeats, getSeats, updateSeat, deleteSeat } from "@/services/seatService";
import type { Hall } from "@/types/hall";
import type { Seat } from "@/types/seat";
import type { BulkSeatItem } from "@/types/seat-bulk";
import type { HallSection } from "@/types/hall-section";
import type { PriceTier } from "@/types/price-tier";
import type { LayoutSeat } from "@/types/seat-layout";
import { stripLayoutKey, withLayoutKeys } from "@/types/seat-layout";
import type { CanvasViewport, DesignerTool, SeatDefaults } from "@/types/designer-types";

export default function SeatDesignerPage() {
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


  const handleSeatsChange = useCallback((nextSeats: LayoutSeat[] | ((prev: LayoutSeat[]) => LayoutSeat[])) => {
    setSeats((prev) => {
      const next = typeof nextSeats === "function" ? nextSeats(prev) : nextSeats;
      if (next !== prev) {
         setPast((p) => [...p, prev]);
         setFuture([]);
         setHasSubmitted(false);
      }
      return next;
    });
  }, []);

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
    panX: -2,
    panY: -2,
    zoom: 1.5,
  });

  const fitToView = useCallback((overrideSeats?: LayoutSeat[]) => {
    const targetSeats = overrideSeats || seatsRef.current;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of targetSeats) {
      const px = Number(s.pos_x) || 0;
      const py = Number(s.pos_y) || 0;
      const w = Number(s.width) || 15;
      const h = Number(s.height) || 15;
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px + w > maxX) maxX = px + w;
      if (py + h > maxY) maxY = py + h;
    }
    if (minX === Infinity) {
      setViewport({ panX: -20, panY: -20, zoom: 1.5 });
      return;
    }
    const padding = 60;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    
    // Estimate canvas size (subtracting sidebar width)
    const viewW = typeof window !== "undefined" ? window.innerWidth - 300 : 800;
    const viewH = typeof window !== "undefined" ? window.innerHeight - 150 : 500;
    
    const scaleX = (viewW - padding * 2) / (contentW || 1);
    const scaleY = (viewH - padding * 2) / (contentH || 1);
    const newZoom = Math.min(scaleX, scaleY, 4);
    
    const scaledW = contentW * newZoom;
    const scaledH = contentH * newZoom;
    const offsetX = (viewW - scaledW) / 2;
    const offsetY = (viewH - scaledH) / 2;
    
    setViewport({
      panX: minX - offsetX / newZoom,
      panY: minY - offsetY / newZoom,
      zoom: newZoom,
    });
  }, [setViewport]);
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
  }, []);

  /* ---- Load draft from builder (if any) ---- */
  useEffect(() => {
    const draft = consumeLayoutDraft();
    if (!draft) return;
    setHallId(draft.hallId);
    setSectionId(draft.sectionId);
    setTierId(draft.tierId);
    const layoutSts = withLayoutKeys(draft.seats);
    setSeats(layoutSts);
    setDraftLoaded(true);
    setMessage("Loaded layout draft from the seat builder.");
    setTimeout(() => fitToView(layoutSts), 50);
  }, [fitToView]);

  /* ---- Load Existing Seats from Database ---- */
  // The user explicitly requested to revert this feature to keep the designer strictly as a blank slate builder.
  // Instead of syncing existing layouts across edits, the builder works as a "new layout" factory.
  useEffect(() => {
    // Reverted implementation: No automatic database pull on sectionId change.
    if (draftLoaded) {
      setDraftLoaded(false);
    }
  }, [sectionId, draftLoaded]);

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
      { start_pos_x: 100, start_pos_y: 100, step_x: 19, seat_count: 12, row: "A", mirror: false, price_tier_id: tierId },
      { start_pos_x: 100, start_pos_y: 119, step_x: 19, seat_count: 14, row: "B", mirror: false, price_tier_id: tierId },
      { start_pos_x: 100, start_pos_y: 138, step_x: 19, seat_count: 16, row: "C", mirror: false, price_tier_id: tierId },
      { start_pos_x: 100, start_pos_y: 157, step_x: 19, seat_count: 18, row: "D", mirror: false, price_tier_id: tierId },
      { start_pos_x: 100, start_pos_y: 176, step_x: 19, seat_count: 18, row: "E", mirror: false, price_tier_id: tierId },
      { start_pos_x: 81, start_pos_y: 215, step_x: 19, seat_count: 20, row: "F", mirror: false, price_tier_id: tierId },
      { start_pos_x: 81, start_pos_y: 234, step_x: 19, seat_count: 20, row: "G", mirror: false, price_tier_id: tierId },
      { start_pos_x: 81, start_pos_y: 253, step_x: 19, seat_count: 20, row: "H", mirror: false, price_tier_id: tierId },
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
    setTimeout(() => fitToView(layoutSts), 50);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 px-4 pb-4">
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
            disabled={submitting || !hallId || !sectionId || !tierId || hasSubmitted}
            onClick={() => void handleSubmit()}
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? "Syncing…" : hasSubmitted ? "Saved!" : "Sync current layout"}
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
      <div className="flex flex-1 gap-3 overflow-hidden">
        <div className="min-w-0 flex-1">
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
        />
      </div>
    </div>
  );
}
