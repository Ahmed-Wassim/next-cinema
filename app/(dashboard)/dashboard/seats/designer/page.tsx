"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";

import { SeatDesignerCanvas } from "@/components/seat-designer-canvas";
import { SeatDesignerSidebar } from "@/components/seat-designer-sidebar";
import { SeatDesignerToolbar } from "@/components/seat-designer-toolbar";
import { SeatsSubnav } from "@/components/seats-subnav";
import { Button } from "@/components/ui/button";
import { consumeLayoutDraft } from "@/lib/layout-draft";
import { extractPaginated } from "@/lib/extract-paginated";
import { getHallSections } from "@/services/hallSectionService";
import { getHalls } from "@/services/hallService";
import { getPriceTiers } from "@/services/priceTierService";
import { bulkInsertSeats } from "@/services/seatService";
import type { Hall } from "@/types/hall";
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

  /* ---- Submit state ---- */
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
    setSeats(withLayoutKeys(draft.seats));
    setMessage("Loaded layout draft from the seat builder.");
  }, []);

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
            disabled={submitting || seats.length === 0 || !hallId || !sectionId || !tierId || hasSubmitted}
            onClick={() => void handleSubmit()}
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? "Submitting…" : hasSubmitted ? "Saved!" : `Insert ${seats.length} seats`}
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
