"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { cn } from "@/lib/utils";
import type { LayoutSeat } from "@/types/seat-layout";
import type {
  CanvasViewport,
  DesignerBounds,
  DesignerTool,
  SeatDefaults,
} from "@/types/designer-types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MIN_ZOOM = 0.153;
const MAX_ZOOM = 63;
const DRAG_THRESHOLD = 4;
const GRID_STEP = 5;
const LONG_PRESS_MS = 350; // ms before long-press triggers panning mode

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clientToSvg(
  e: { clientX: number; clientY: number },
  svgEl: SVGSVGElement | null,
  vp: CanvasViewport,
): { x: number; y: number } {
  if (!svgEl) return { x: 0, y: 0 };
  const rect = svgEl.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / vp.zoom + vp.panX,
    y: (e.clientY - rect.top) / vp.zoom + vp.panY,
  };
}

function seatCenter(s: LayoutSeat) {
  return { x: s.pos_x + s.width / 2, y: s.pos_y + s.height / 2 };
}

/** Clamp a value between min and max. */
function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Marquee = { x1: number; y1: number; x2: number; y2: number };

type Gesture =
  | { type: "idle" }
  | {
      type: "pending-click";
      target: "canvas" | "seat";
      seatKey?: string;
      startClient: { x: number; y: number };
      startSvg: { x: number; y: number };
      shift: boolean;
      ctrl: boolean;
      longPressTimer: ReturnType<typeof setTimeout> | null;
    }
  | {
      type: "dragging-seats";
      startSvg: { x: number; y: number };
      origins: Map<string, { x: number; y: number }>;
    }
  | { type: "marquee"; startSvg: { x: number; y: number } }
  | {
      type: "panning";
      startClient: { x: number; y: number };
      startPan: { x: number; y: number };
    };

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SeatDesignerCanvasProps {
  seats: LayoutSeat[];
  onSeatsChange: (next: LayoutSeat[]) => void;
  selectedKeys: Set<string>;
  onSelectionChange: Dispatch<SetStateAction<Set<string>>>;
  tierColorById: Map<number, string>;
  viewport: CanvasViewport;
  onViewportChange: Dispatch<SetStateAction<CanvasViewport>>;
  activeTool: DesignerTool;
  seatDefaults: SeatDefaults;
  snapEnabled: boolean;
  snapStep: number;
  hallId: number;
  defaultTierId: number;
  paintTierId: number;
  nextRowLabel: string;
  nextSeatNumber: number;
  /** Fixed area the user is allowed to place seats within. */
  designerBounds: DesignerBounds;
  /** If true, clamp drag/place inside `designerBounds`. */
  constrainToBounds?: boolean;
  onSeatPlaced?: () => void;
  className?: string;
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

export function SeatDesignerCanvas({
  seats,
  onSeatsChange,
  selectedKeys,
  onSelectionChange,
  tierColorById,
  viewport,
  onViewportChange,
  activeTool,
  seatDefaults,
  snapEnabled,
  snapStep,
  hallId,
  defaultTierId,
  paintTierId,
  nextRowLabel,
  nextSeatNumber,
  designerBounds,
  constrainToBounds = true,
  onSeatPlaced,
  className,
}: SeatDesignerCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gestureRef = useRef<Gesture>({ type: "idle" });
  const seatsRef = useRef(seats);
  const selectedRef = useRef(selectedKeys);
  const vpRef = useRef(viewport);
  const toolRef = useRef(activeTool);
  const snapRef = useRef({ enabled: snapEnabled, step: snapStep });

  useEffect(() => {
    seatsRef.current = seats;
  }, [seats]);

  useEffect(() => {
    selectedRef.current = selectedKeys;
  }, [selectedKeys]);

  useEffect(() => {
    vpRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    toolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    snapRef.current = { enabled: snapEnabled, step: snapStep };
  }, [snapEnabled, snapStep]);

  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const snap = useCallback((v: number) => {
    if (!snapRef.current.enabled || snapRef.current.step <= 0) return v;
    return Math.round(v / snapRef.current.step) * snapRef.current.step;
  }, []);

  /* ---- Computed Bounds ---- */
  const bounds = useMemo(() => {
    const minX = designerBounds.x;
    const minY = designerBounds.y;
    const maxX = designerBounds.x + designerBounds.width;
    const maxY = designerBounds.y + designerBounds.height;
    return { minX, minY, maxX, maxY };
  }, [designerBounds]);

  const clampSeatToBounds = useCallback(
    (s: LayoutSeat): LayoutSeat => {
      if (!constrainToBounds) return s;
      const minX = designerBounds.x;
      const minY = designerBounds.y;
      const maxX = designerBounds.x + designerBounds.width - s.width;
      const maxY = designerBounds.y + designerBounds.height - s.height;
      return {
        ...s,
        pos_x: clamp(s.pos_x, minX, maxX),
        pos_y: clamp(s.pos_y, minY, maxY),
      };
    },
    [constrainToBounds, designerBounds],
  );

  /* ---- SVG grid pattern (using defs for performance) ---- */
  const gridPatternId = "designer-grid";
  const gridMajorId = "designer-grid-major";

  /* ================================================================ */
  /*  Long-press → pan helper                                          */
  /* ================================================================ */

  const startPanning = useCallback((startClient: { x: number; y: number }) => {
    gestureRef.current = {
      type: "panning",
      startClient,
      startPan: { x: vpRef.current.panX, y: vpRef.current.panY },
    };
    setIsPanning(true);
  }, []);

  /* ================================================================ */
  /*  POINTER HANDLERS                                                 */
  /* ================================================================ */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      // Middle button → instant pan
      if (e.button === 1) {
        e.preventDefault();
        startPanning({ x: e.clientX, y: e.clientY });
        return;
      }
      if (e.button !== 0) return;

      const svg = svgRef.current;
      const pt = clientToSvg(e, svg, vpRef.current);

      // Hit test seats (reverse order for z-order)
      let hit: LayoutSeat | undefined;
      for (let i = seatsRef.current.length - 1; i >= 0; i--) {
        const s = seatsRef.current[i]!;
        if (
          pt.x >= s.pos_x &&
          pt.x <= s.pos_x + s.width &&
          pt.y >= s.pos_y &&
          pt.y <= s.pos_y + s.height
        ) {
          hit = s;
          break;
        }
      }

      const startClient = { x: e.clientX, y: e.clientY };

      if (toolRef.current === "pan") {
        startPanning(startClient);
        (e.target as Element).setPointerCapture?.(e.pointerId);
        return;
      }

      // Set up long-press timer for canvas clicks → pan after 350ms hold
      let longPressTimer: ReturnType<typeof setTimeout> | null = null;
      if (!hit && toolRef.current === "select") {
        longPressTimer = setTimeout(() => {
          const g = gestureRef.current;
          if (g.type === "pending-click" && g.target === "canvas") {
            startPanning(startClient);
          }
        }, LONG_PRESS_MS);
      }

      gestureRef.current = {
        type: "pending-click",
        target: hit ? "seat" : "canvas",
        seatKey: hit?.layoutKey,
        startClient,
        startSvg: pt,
        shift: e.shiftKey,
        ctrl: e.ctrlKey || e.metaKey,
        longPressTimer,
      };

      // Capture pointer for smooth tracking even outside the SVG
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [startPanning],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const g = gestureRef.current;

      /* ---- Panning ---- */
      if (g.type === "panning") {
        const dx = (e.clientX - g.startClient.x) / vpRef.current.zoom;
        const dy = (e.clientY - g.startClient.y) / vpRef.current.zoom;
        onViewportChange((v) => ({
          ...v,
          panX: g.startPan.x - dx,
          panY: g.startPan.y - dy,
        }));
        return;
      }

      /* ---- Threshold check for pending click ---- */
      if (g.type === "pending-click") {
        const dist = Math.hypot(
          e.clientX - g.startClient.x,
          e.clientY - g.startClient.y,
        );
        if (dist < DRAG_THRESHOLD) return;

        // Cancel long-press timer since user started moving
        if (g.longPressTimer) clearTimeout(g.longPressTimer);

        /* Seat drag */
        if (g.target === "seat" && g.seatKey) {
          const key = g.seatKey;
          const sel = selectedRef.current;
          if (!sel.has(key)) {
            onSelectionChange(new Set([key]));
          }
          const activeSelection = sel.has(key) ? sel : new Set([key]);
          const origins = new Map<string, { x: number; y: number }>();
          for (const s of seatsRef.current) {
            if (activeSelection.has(s.layoutKey)) {
              origins.set(s.layoutKey, { x: s.pos_x, y: s.pos_y });
            }
          }
          gestureRef.current = {
            type: "dragging-seats",
            startSvg: g.startSvg,
            origins,
          };
          setIsDragging(true);
          return;
        }

        /* Canvas drag → marquee (select tool) or pan (other tools) */
        if (g.target === "canvas") {
          if (toolRef.current === "select") {
            gestureRef.current = { type: "marquee", startSvg: g.startSvg };
            setMarquee({
              x1: g.startSvg.x,
              y1: g.startSvg.y,
              x2: g.startSvg.x,
              y2: g.startSvg.y,
            });
          } else {
            // Non-select tool: dragging on empty canvas = pan immediately
            startPanning(g.startClient);
          }
          return;
        }
      }

      /* ---- Dragging seats ---- */
      if (g.type === "dragging-seats") {
        const pt = clientToSvg(e, svgRef.current, vpRef.current);
        const dx = pt.x - g.startSvg.x;
        const dy = pt.y - g.startSvg.y;
        onSeatsChange(
          seatsRef.current.map((s) => {
            const origin = g.origins.get(s.layoutKey);
            if (!origin) return s;
            return clampSeatToBounds({
              ...s,
              pos_x: origin.x + dx,
              pos_y: origin.y + dy,
            });
          }),
        );
        return;
      }

      /* ---- Marquee ---- */
      if (g.type === "marquee") {
        const pt = clientToSvg(e, svgRef.current, vpRef.current);
        setMarquee((m) =>
          m
            ? { ...m, x2: pt.x, y2: pt.y }
            : { x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y },
        );
        return;
      }

      /* ---- Hover tracking (idle) ---- */
      if (g.type === "idle") {
        const pt = clientToSvg(e, svgRef.current, vpRef.current);
        let found: string | null = null;
        for (let i = seatsRef.current.length - 1; i >= 0; i--) {
          const s = seatsRef.current[i]!;
          if (
            pt.x >= s.pos_x &&
            pt.x <= s.pos_x + s.width &&
            pt.y >= s.pos_y &&
            pt.y <= s.pos_y + s.height
          ) {
            found = s.layoutKey;
            break;
          }
        }
        setHoveredKey(found);
      }
    },
    [
      onSeatsChange,
      onSelectionChange,
      onViewportChange,
      startPanning,
      clampSeatToBounds,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const g = gestureRef.current;
      gestureRef.current = { type: "idle" };
      setIsDragging(false);
      setIsPanning(false);

      // Release capture
      (e.target as Element).releasePointerCapture?.(e.pointerId);

      if (g.type === "panning") return;

      if (g.type === "dragging-seats") {
        if (snapRef.current.enabled) {
          onSeatsChange(
            seatsRef.current.map((s) => {
              if (!g.origins.has(s.layoutKey)) return s;
              return clampSeatToBounds({
                ...s,
                pos_x: snap(s.pos_x),
                pos_y: snap(s.pos_y),
              });
            }),
          );
        }
        return;
      }

      if (g.type === "marquee") {
        const m = marquee;
        setMarquee(null);
        if (!m) return;
        const rx = Math.min(m.x1, m.x2);
        const ry = Math.min(m.y1, m.y2);
        const rw = Math.abs(m.x2 - m.x1);
        const rh = Math.abs(m.y2 - m.y1);
        const hitKeys = new Set<string>();
        for (const s of seatsRef.current) {
          const c = seatCenter(s);
          if (c.x >= rx && c.x <= rx + rw && c.y >= ry && c.y <= ry + rh) {
            hitKeys.add(s.layoutKey);
          }
        }
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          onSelectionChange((prev) => {
            const next = new Set(prev);
            hitKeys.forEach((k) => next.add(k));
            return next;
          });
        } else {
          onSelectionChange(hitKeys);
        }
        return;
      }

      if (g.type === "pending-click") {
        if (g.longPressTimer) clearTimeout(g.longPressTimer);
        const tool = toolRef.current;

        if (tool === "tier-paint" && g.target === "seat" && g.seatKey) {
          onSeatsChange(
            seatsRef.current.map((s) =>
              s.layoutKey === g.seatKey
                ? { ...s, price_tier_id: paintTierId }
                : s,
            ),
          );
          return;
        }

        if (tool === "place" && g.target === "canvas") {
          const x0 = snap(g.startSvg.x - seatDefaults.width / 2);
          const y0 = snap(g.startSvg.y - seatDefaults.height / 2);
          const newSeat: LayoutSeat = {
            layoutKey: crypto.randomUUID(),
            hall_id: hallId,
            price_tier_id: defaultTierId,
            row: nextRowLabel,
            number: String(nextSeatNumber),
            pos_x: x0,
            pos_y: y0,
            rotation: seatDefaults.rotation,
            width: seatDefaults.width,
            height: seatDefaults.height,
            shape: seatDefaults.shape,
            sort_order: seatsRef.current.length + 1,
            is_active: seatDefaults.is_active,
          };
          const clamped = clampSeatToBounds(newSeat);
          onSeatsChange([...seatsRef.current, clamped]);
          onSelectionChange(new Set([clamped.layoutKey]));
          onSeatPlaced?.();
          return;
        }

        if (g.target === "seat" && g.seatKey) {
          const key = g.seatKey;
          if (g.ctrl) {
            onSelectionChange((prev) => {
              const next = new Set(prev);
              if (next.has(key)) next.delete(key);
              else next.add(key);
              return next;
            });
          } else if (g.shift) {
            onSelectionChange((prev) => new Set(prev).add(key));
          } else {
            onSelectionChange(new Set([key]));
          }
          return;
        }

        if (g.target === "canvas" && tool === "select") {
          onSelectionChange(new Set());
        }
      }
    },
    [
      onSeatsChange,
      onSelectionChange,
      snap,
      paintTierId,
      hallId,
      defaultTierId,
      nextRowLabel,
      nextSeatNumber,
      seatDefaults,
      onSeatPlaced,
      marquee,
      clampSeatToBounds,
    ],
  );

  /* ---- Wheel zoom (smooth, toward cursor) ---- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      onViewportChange((vp) => {
        // Use smaller factor for smoother zoom (trackpads send many small deltas)
        const raw = -e.deltaY * 0.003;
        const factor = Math.exp(clamp(raw, -0.15, 0.15));
        const nextZoom = clamp(vp.zoom * factor, MIN_ZOOM, MAX_ZOOM);
        const worldX = cx / vp.zoom + vp.panX;
        const worldY = cy / vp.zoom + vp.panY;
        return {
          zoom: nextZoom,
          panX: worldX - cx / nextZoom,
          panY: worldY - cy / nextZoom,
        };
      });
    };
    svg.addEventListener("wheel", handler, { passive: false });
    return () => svg.removeEventListener("wheel", handler);
  }, [onViewportChange]);

  /* ---- Keyboard shortcuts ---- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;
      if (e.key === "Escape") {
        onSelectionChange(new Set());
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !inInput) {
        if (selectedRef.current.size > 0) {
          onSeatsChange(
            seatsRef.current.filter(
              (s) => !selectedRef.current.has(s.layoutKey),
            ),
          );
          onSelectionChange(new Set());
        }
      }
      // Ctrl+A: select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a" && !inInput) {
        e.preventDefault();
        onSelectionChange(new Set(seatsRef.current.map((s) => s.layoutKey)));
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onSelectionChange, onSeatsChange]);

  /* ---- Cursor ---- */
  const cursor = useMemo(() => {
    if (isPanning) return "grabbing";
    if (isDragging) return "grabbing";
    if (activeTool === "place") return "crosshair";
    if (activeTool === "tier-paint") return "pointer";
    if (hoveredKey) return "grab";
    return "default";
  }, [isPanning, isDragging, activeTool, hoveredKey]);

  /* ---- Render ---- */
  const gw = bounds.maxX - bounds.minX + 40;
  const gh = bounds.maxY - bounds.minY + 60;

  return (
    <div
      className={cn(
        "relative h-full min-h-[500px] w-full overflow-hidden rounded-xl border border-zinc-200 bg-[#f6f7f9] dark:border-zinc-700 dark:bg-[#111214]",
        className,
      )}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="absolute inset-0 touch-none select-none"
        style={{ cursor, willChange: "transform" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHoveredKey(null)}
      >
        <defs>
          {/* Minor grid */}
          <pattern
            id={gridPatternId}
            width={GRID_STEP}
            height={GRID_STEP}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}`}
              fill="none"
              stroke="rgba(0,0,0,0.04)"
              strokeWidth={0.2}
            />
          </pattern>
          {/* Major grid */}
          <pattern
            id={gridMajorId}
            width={GRID_STEP * 4}
            height={GRID_STEP * 4}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={GRID_STEP * 4}
              height={GRID_STEP * 4}
              fill={`url(#${gridPatternId})`}
            />
            <path
              d={`M ${GRID_STEP * 4} 0 L 0 0 0 ${GRID_STEP * 4}`}
              fill="none"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={0.35}
            />
          </pattern>
          {/* Glow filter for selected seats */}
          <filter id="seat-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.3" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Shadow for hover */}
          <filter id="seat-hover" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0.3"
              stdDeviation="0.6"
              floodColor="rgba(0,0,0,0.15)"
            />
          </filter>
        </defs>

        <g
          transform={`scale(${viewport.zoom}) translate(${-viewport.panX},${-viewport.panY})`}
          style={{ willChange: "transform" }}
        >
          {/* Grid background */}
          <rect
            x={bounds.minX - 100}
            y={bounds.minY - 100}
            width={gw + 200}
            height={gh + 200}
            fill={`url(#${gridMajorId})`}
          />

          {/* Designer working area boundary */}
          <rect
            x={bounds.minX}
            y={bounds.minY}
            width={designerBounds.width}
            height={designerBounds.height}
            fill="rgba(59,130,246,0.03)"
            stroke="rgba(59,130,246,0.35)"
            strokeWidth={0.6}
            strokeDasharray="3 2"
            rx={2}
          />

          {/* Screen indicator */}
          <line
            x1={bounds.minX + (bounds.maxX - bounds.minX) / 2 - 120}
            y1={bounds.maxY + 15}
            x2={bounds.minX + (bounds.maxX - bounds.minX) / 2 + 120}
            y2={bounds.maxY + 15}
            stroke="rgba(217,119,6,0.45)"
            strokeWidth={3}
            strokeDasharray="4 2.5"
            strokeLinecap="round"
          />
          <rect
            x={bounds.minX + (bounds.maxX - bounds.minX) / 2 - 18}
            y={bounds.maxY + 18}
            width={36}
            height={7}
            rx={2}
            fill="rgba(217,119,6,0.08)"
          />
          <text
            x={bounds.minX + (bounds.maxX - bounds.minX) / 2}
            y={bounds.maxY + 24}
            textAnchor="middle"
            fontSize={4.2}
            fontWeight={700}
            fill="rgba(217,119,6,0.6)"
            style={{
              letterSpacing: "0.2em",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            SCREEN
          </text>

          {/* Seats */}
          {seats.map((s) => {
            const selected = selectedKeys.has(s.layoutKey);
            const hovered = hoveredKey === s.layoutKey;
            const tint = tierColorById.get(s.price_tier_id);
            const fill = selected
              ? "rgba(59,130,246,0.15)"
              : tint
                ? tint
                : "rgba(255,255,255,0.92)";
            const stroke = selected
              ? "#2563eb"
              : hovered
                ? "#3b82f6"
                : (tint ?? "rgba(63,63,70,0.45)");
            const strokeW = selected ? 0.5 : hovered ? 0.4 : 0.25;
            const rx =
              s.shape === "circle"
                ? s.width / 2
                : s.shape === "rounded_rect"
                  ? 0.8
                  : 0.4;
            const ry =
              s.shape === "circle"
                ? s.height / 2
                : s.shape === "rounded_rect"
                  ? 0.8
                  : 0.4;
            const cx = s.pos_x + s.width / 2;
            const cy = s.pos_y + s.height / 2;
            const rot = s.rotation
              ? `rotate(${s.rotation} ${cx} ${cy})`
              : undefined;
            const filter = selected
              ? "url(#seat-glow)"
              : hovered
                ? "url(#seat-hover)"
                : undefined;

            return (
              <g key={s.layoutKey} style={{ transition: "opacity 80ms ease" }}>
                {/* Main rect */}
                <rect
                  x={s.pos_x}
                  y={s.pos_y}
                  width={s.width}
                  height={s.height}
                  rx={rx}
                  ry={ry}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeW}
                  transform={rot}
                  filter={filter}
                  className="transition-all duration-150"
                  style={{ cursor: "pointer", pointerEvents: "all" }}
                />

                {/* Label (Row + Number) */}
                {(viewport.zoom > 0.4 || selected || hovered) && (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={2.8}
                    fontWeight={selected ? 700 : 500}
                    fill={selected ? "#1e40af" : "rgba(0,0,0,0.7)"}
                    pointerEvents="none"
                    transform={rot}
                    style={{
                      fontFamily: "system-ui, sans-serif",
                      userSelect: "none",
                    }}
                  >
                    {s.row}
                    {s.number}
                  </text>
                )}

                {/* Custom Label (Smaller, below) */}
                {(viewport.zoom > 0.8 || selected) && s.label && (
                  <text
                    x={cx}
                    y={s.pos_y + s.height - 1.5}
                    textAnchor="middle"
                    fontSize={1.2}
                    fontWeight={600}
                    fill={selected ? "#1e40af" : "rgba(0,0,0,0.5)"}
                    pointerEvents="none"
                    transform={rot}
                    style={{ textTransform: "uppercase", userSelect: "none" }}
                  >
                    {s.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Marquee */}
          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2)}
              y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)}
              height={Math.abs(marquee.y2 - marquee.y1)}
              fill="rgba(59,130,246,0.12)"
              stroke="#3b82f6"
              strokeWidth={0.5}
              strokeDasharray="2 1.5"
            />
          )}

          {/* Selection context visuals (size in units) */}
          {selectedKeys.size === 1 && seatsRef.current.find((x) => x.layoutKey === [...selectedKeys][0]) && (
            <g pointerEvents="none">
              {(() => {
                const s = seatsRef.current.find((x) => x.layoutKey === [...selectedKeys][0])!;
                return (
                  <>
                    {/* Dimension lines */}
                    <path
                      d={`M ${s.pos_x} ${s.pos_y - 2.5} L ${s.pos_x + s.width} ${s.pos_y - 2.5}`}
                      stroke="#3b82f6"
                      strokeWidth={0.2}
                    />
                    <text
                      x={s.pos_x + s.width / 2}
                      y={s.pos_y - 3.8}
                      textAnchor="middle"
                      fontSize={1.6}
                      fill="#3b82f6"
                      fontWeight={600}
                    >
                      {s.width}
                    </text>
                  </>
                );
              })()}
            </g>
          )}
        </g>
      </svg>

      {/* Map coordinates / zoom overlay */}
      <div className="absolute right-3 bottom-3 pointer-events-none flex flex-col items-end gap-1 px-2 py-1.5 rounded-lg bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm shadow-sm group">
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
           <span>{Math.round(viewport.panX)},{Math.round(viewport.panY)}</span>
           <span className="w-px h-2 bg-zinc-300 dark:bg-zinc-700" />
           <span className="font-bold text-zinc-900 dark:text-zinc-100">{Math.round(viewport.zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
