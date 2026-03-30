"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { cn } from "@/lib/utils";
import type { LayoutSeat } from "@/types/seat-layout";

const DRAG_THRESHOLD_PX = 6;

function seatShapeClass(shape: string): string {
  if (shape === "circle") return "rounded-full";
  if (shape === "rounded_rect") return "rounded-md";
  return "rounded-sm";
}

type Gesture =
  | {
      phase: "pick";
      layoutKey: string;
      sx: number;
      sy: number;
      ctrl: boolean;
      meta: boolean;
      shift: boolean;
      ox: number;
      oy: number;
    }
  | {
      phase: "drag";
      layoutKey: string;
      ox: number;
      oy: number;
      sx: number;
      sy: number;
    };

interface HallLayoutCanvasProps {
  seats: LayoutSeat[];
  onSeatsChange: (next: LayoutSeat[]) => void;
  selectedKeys: Set<string>;
  onSelectionChange: Dispatch<SetStateAction<Set<string>>>;
  onRequestClearSelection?: () => void;
  tierColorById: Map<number, string>;
  scale: number;
  snapEnabled: boolean;
  snapStep: number;
  className?: string;
}

export function HallLayoutCanvas({
  seats,
  onSeatsChange,
  selectedKeys,
  onSelectionChange,
  onRequestClearSelection,
  tierColorById,
  scale,
  snapEnabled,
  snapStep,
  className,
}: HallLayoutCanvasProps) {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const seatsRef = useRef(seats);

  useEffect(() => {
    seatsRef.current = seats;
  }, [seats]);

  const snap = useCallback(
    (v: number) => {
      if (!snapEnabled || snapStep <= 0) return v;
      return Math.round(v / snapStep) * snapStep;
    },
    [snapEnabled, snapStep],
  );

  const { contentWLogical, contentHLogical, innerW, innerH } = useMemo(() => {
    const logicalPad = 6;
    const screenGapPx = 10;
    const screenBarPx = 32;
    if (!seats.length) {
      const w = 80;
      const h = 60;
      return {
        contentWLogical: w,
        contentHLogical: h,
        innerW: w * scale + 48,
        innerH: h * scale + screenGapPx + screenBarPx + 48,
      };
    }
    let maxR = 0;
    let maxB = 0;
    for (const s of seats) {
      maxR = Math.max(maxR, s.pos_x + s.width);
      maxB = Math.max(maxB, s.pos_y + s.height);
    }
    const cw = Math.max(40, maxR + logicalPad);
    const ch = Math.max(40, maxB + logicalPad);
    return {
      contentWLogical: cw,
      contentHLogical: ch,
      innerW: cw * scale + 48,
      innerH: ch * scale + screenGapPx + screenBarPx + 48,
    };
  }, [seats, scale]);

  const tierTint = useCallback(
    (tierId: number) => tierColorById.get(tierId) ?? undefined,
    [tierColorById],
  );

  const beginSeatInteraction = useCallback(
    (s: LayoutSeat, e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      gestureRef.current = {
        phase: "pick",
        layoutKey: s.layoutKey,
        sx: e.clientX,
        sy: e.clientY,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        shift: e.shiftKey,
        ox: s.pos_x,
        oy: s.pos_y,
      };

      const onMove = (ev: PointerEvent) => {
        const g = gestureRef.current;
        if (!g) return;

        if (g.phase === "pick") {
          const dist = Math.hypot(ev.clientX - g.sx, ev.clientY - g.sy);
          if (dist <= DRAG_THRESHOLD_PX) return;
          gestureRef.current = {
            phase: "drag",
            layoutKey: g.layoutKey,
            ox: g.ox,
            oy: g.oy,
            sx: g.sx,
            sy: g.sy,
          };
          setDraggingKey(g.layoutKey);
          return;
        }

        const dx = (ev.clientX - g.sx) / scale;
        const dy = (ev.clientY - g.sy) / scale;
        const nx = Math.max(0, g.ox + dx);
        const ny = Math.max(0, g.oy + dy);
        const key = g.layoutKey;
        onSeatsChange(
          seatsRef.current.map((seat) =>
            seat.layoutKey === key
              ? { ...seat, pos_x: nx, pos_y: ny }
              : seat,
          ),
        );
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);

        const g = gestureRef.current;
        gestureRef.current = null;
        setDraggingKey(null);

        if (!g) return;

        if (g.phase === "drag") {
          if (snapEnabled) {
            const key = g.layoutKey;
            onSeatsChange(
              seatsRef.current.map((seat) =>
                seat.layoutKey === key
                  ? {
                      ...seat,
                      pos_x: snap(seat.pos_x),
                      pos_y: snap(seat.pos_y),
                    }
                  : seat,
              ),
            );
          }
          return;
        }

        const key = g.layoutKey;
        if (g.ctrl || g.meta) {
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
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [onSeatsChange, onSelectionChange, scale, snap, snapEnabled],
  );

  return (
    <div
      className={cn(
        "max-h-[min(72vh,900px)] overflow-auto rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80",
        className,
      )}
    >
      <div
        className="relative touch-none select-none p-6"
        style={{
          width: innerW,
          minHeight: innerH,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,.06) 1px, transparent 1px)
          `,
          backgroundSize: `${scale}px ${scale}px`,
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onRequestClearSelection?.();
        }}
      >
        <div
          className="relative"
          style={{
            width: contentWLogical * scale,
            height: contentHLogical * scale + 10 + 32,
          }}
        >
          {seats.map((s) => {
            const dragging = draggingKey === s.layoutKey;
            const selected = selectedKeys.has(s.layoutKey);
            const tint = tierTint(s.price_tier_id);
            return (
              <button
                key={s.layoutKey}
                type="button"
                title={`${s.row}${s.number} — click: select · drag: move · ⌘/Ctrl+click: toggle`}
                className={cn(
                  "absolute flex cursor-grab items-center justify-center border-2 text-[10px] font-semibold leading-tight shadow-sm hover:z-10 hover:shadow-md active:cursor-grabbing",
                  seatShapeClass(s.shape),
                  selected
                    ? "z-10 border-blue-600 bg-blue-50/95 text-blue-950 ring-1 ring-blue-400 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-50"
                    : "border-zinc-700 bg-white/95 text-zinc-900 dark:border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100",
                  dragging && "z-20 ring-2 ring-amber-500 ring-offset-1",
                )}
                style={{
                  left: s.pos_x * scale,
                  top: s.pos_y * scale,
                  width: Math.max(10, s.width * scale),
                  height: Math.max(10, s.height * scale),
                  transform: `rotate(${s.rotation}deg)`,
                  transformOrigin: "center center",
                  ...(tint && !selected
                    ? {
                        borderColor: tint,
                        boxShadow:
                          "inset 0 0 0 2px rgba(0,0,0,0.06)",
                      }
                    : {}),
                }}
                onPointerDown={(e) => beginSeatInteraction(s, e)}
              >
                <span className="pointer-events-none px-0.5 text-center">
                  {s.row}
                  <span className="opacity-80">{s.number}</span>
                </span>
              </button>
            );
          })}

          <div
            className="absolute flex items-center justify-center border-t-2 border-dashed border-amber-600/70 bg-amber-100/50 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-950/90 dark:border-amber-400 dark:bg-amber-950/50 dark:text-amber-100/95"
            style={{
              left: 0,
              top: contentHLogical * scale + 10,
              width: contentWLogical * scale,
              height: 32,
            }}
          >
            Screen
          </div>
        </div>
      </div>
    </div>
  );
}
