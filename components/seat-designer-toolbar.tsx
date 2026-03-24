"use client";

import {
  Minus,
  MousePointer2,
  Paintbrush2,
  Plus,
  Rows3,
  Maximize2,
  Grid3X3,
  Hand,
  Undo2,
  Redo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CanvasViewport, DesignerTool } from "@/types/designer-types";
import type { Dispatch, SetStateAction } from "react";

interface SeatDesignerToolbarProps {
  activeTool: DesignerTool;
  onToolChange: (tool: DesignerTool) => void;
  viewport: CanvasViewport;
  onViewportChange: Dispatch<SetStateAction<CanvasViewport>>;
  snapEnabled: boolean;
  onSnapEnabledChange: (v: boolean) => void;
  snapStep: number;
  onSnapStepChange: (v: number) => void;
  selectedCount: number;
  totalSeats: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFitToView?: () => void;
  className?: string;
}

const tools: { tool: DesignerTool; label: string; icon: typeof MousePointer2 }[] = [
  { tool: "select", label: "Select", icon: MousePointer2 },
  { tool: "pan", label: "Pan", icon: Hand },
  { tool: "place", label: "Place", icon: Plus },
  { tool: "row", label: "Add Row", icon: Rows3 },
  { tool: "tier-paint", label: "Paint Tier", icon: Paintbrush2 },
];

export function SeatDesignerToolbar({
  activeTool,
  onToolChange,
  viewport,
  onViewportChange,
  snapEnabled,
  onSnapEnabledChange,
  snapStep,
  onSnapStepChange,
  selectedCount,
  totalSeats,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onFitToView,
  className,
}: SeatDesignerToolbarProps) {
  function zoomBy(factor: number) {
    onViewportChange((v) => ({
      ...v,
      zoom: Math.min(6, Math.max(0.15, v.zoom * factor)),
    }));
  }

  function handleFit() {
    if (onFitToView) onFitToView();
    else onViewportChange({ panX: -5, panY: -5, zoom: 1 });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95",
        className,
      )}
    >
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
        {tools.map(({ tool, label, icon: Icon }) => (
          <button
            key={tool}
            type="button"
            title={label}
            onClick={() => onToolChange(tool)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
              activeTool === tool
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="mx-1.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mx-1.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => zoomBy(1 / 1.25)}
          title="Zoom out"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-10 text-center text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-400">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => zoomBy(1.25)}
          title="Zoom in"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleFit}
          title="Fit to view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mx-1.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />

      {/* Snap */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            snapEnabled
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400",
          )}
          onClick={() => onSnapEnabledChange(!snapEnabled)}
          title="Toggle snap to grid"
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Snap</span>
        </button>
        {snapEnabled && (
          <Input
            type="number"
            min={0.5}
            step={0.5}
            value={snapStep}
            onChange={(e) => onSnapStepChange(Math.max(0.5, Number(e.target.value) || 1))}
            className="h-7 w-14 text-xs"
            title="Snap step"
          />
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Selection info */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        {selectedCount > 0 && (
          <span className="rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            {selectedCount} selected
          </span>
        )}
        <span className="tabular-nums">{totalSeats} seats</span>
      </div>
    </div>
  );
}
