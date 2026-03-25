"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Seat } from "@/types/seat";

interface SeatViewerCanvasProps {
  seats: Seat[];
  onSeatClick?: (seat: Seat) => void;
  className?: string;
}

export function SeatViewerCanvas({ seats, onSeatClick, className }: SeatViewerCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Viewport tracking (Pan / Zoom)
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(-20);
  const [panY, setPanY] = useState(-20);
  const [isPanning, setIsPanning] = useState(false);

  // Hover state
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  /* ---- Compute Bounds ---- */
  const bounds = useMemo(() => {
    if (seats.length === 0) return { minX: 0, minY: 0, maxX: 500, maxY: 400 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const s of seats) {
      // Cast properties as backend fields might not be perfectly typed in Seat yet
      const px = Number(s.pos_x) || 0;
      const py = Number(s.pos_y) || 0;
      const w = Number(s.width) || 15;
      const h = Number(s.height) || 15;
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px + w > maxX) maxX = px + w;
      if (py + h > maxY) maxY = py + h;
    }
    return { minX, minY, maxX, maxY };
  }, [seats]);

  /* ---- Handlers ---- */
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgP = pt.matrixTransform(ctm.inverse());

      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(6, Math.max(0.15, zoom * factor));
      const deltaZoom = newZoom - zoom;

      setPanX((px) => px + svgP.x * deltaZoom);
      setPanY((py) => py + svgP.y * deltaZoom);
      setZoom(newZoom);
    } else {
      // Pan
      setPanX((px) => px + e.deltaX);
      setPanY((py) => py + e.deltaY);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPanning) return;
    setPanX((px) => px - e.movementX);
    setPanY((py) => py - e.movementY);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsPanning(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const zoomBy = (factor: number) => {
    setZoom((z) => Math.min(6, Math.max(0.15, z * factor)));
  };

  const fitToView = () => {
    const svg = svgRef.current;
    if (!svg || seats.length === 0 || bounds.minX === Infinity) {
      setPanX(-20);
      setPanY(-20);
      setZoom(1);
      return;
    }

    const padding = 40;
    const contentW = bounds.maxX - bounds.minX;
    const contentH = bounds.maxY - bounds.minY;
    
    const rect = svg.getBoundingClientRect();
    const viewW = rect.width || 800;
    const viewH = rect.height || 500;
    
    // Add space for screen line indicator at the bottom
    const scaleX = (viewW - padding * 2) / (contentW || 1);
    const scaleY = (viewH - padding * 2 - 40) / (contentH || 1);
    const newZoom = Math.min(scaleX, scaleY, 4); 
    
    const scaledW = contentW * newZoom;
    const scaledH = contentH * newZoom;
    const offsetX = (viewW - scaledW) / 2;
    const offsetY = (viewH - 40 - scaledH) / 2; // Shift up slightly for line
    
    setPanX(bounds.minX - offsetX / newZoom);
    setPanY(bounds.minY - offsetY / newZoom);
    setZoom(newZoom);
  };

  // Auto-fit on initial load or seats change
  useEffect(() => {
    if (seats.length > 0) {
      const t = setTimeout(fitToView, 30);
      return () => clearTimeout(t);
    }
  }, [seats, bounds]);

  /* ---- Render ---- */
  const gw = bounds.maxX + 40;
  const gh = bounds.maxY + 60;

  return (
    <div className={cn("relative h-[500px] w-full overflow-hidden rounded-xl border border-zinc-200 bg-[#f6f7f9] dark:border-zinc-700 dark:bg-[#111214]", className)}>
      {/* HUD overlay */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md border border-zinc-200 bg-white/90 p-1 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800/90">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => zoomBy(0.8)}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-9 text-center text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => zoomBy(1.25)}>
          <Plus className="h-3 w-3" />
        </Button>
        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-600" />
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fitToView}>
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="absolute inset-0 select-none touch-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setIsPanning(false)}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        <defs>
          <filter id="viewer-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.4" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`scale(${zoom}) translate(${-panX},${-panY})`} style={{ willChange: "transform" }}>
          {/* Screen indicator */}
          <line
            x1={bounds.minX + (bounds.maxX - bounds.minX) / 2 - 80}
            y1={bounds.maxY + 8}
            x2={bounds.minX + (bounds.maxX - bounds.minX) / 2 + 80}
            y2={bounds.maxY + 8}
            stroke="rgba(217,119,6,0.45)"
            strokeWidth={2}
            strokeDasharray="4 2.5"
            strokeLinecap="round"
          />
          <rect
            x={bounds.minX + (bounds.maxX - bounds.minX) / 2 - 12}
            y={bounds.maxY + 10}
            width={24}
            height={6}
            rx={2}
            fill="rgba(217,119,6,0.3)"
          />

          {seats.map((seat) => {
            const px = Number(seat.pos_x) || 0;
            const py = Number(seat.pos_y) || 0;
            const w = Number(seat.width) || 15;
            const h = Number(seat.height) || 15;
            const rot = Number(seat.rotation) || 0;
            const shape = seat.shape || "rect";
            const isActive = seat.status === "active" || seat.is_active !== false;

            const rx = shape === "circle" ? w / 2 : shape === "rounded_rect" ? 0.8 : 0.4;
            const ry = shape === "circle" ? h / 2 : shape === "rounded_rect" ? 0.8 : 0.4;
            const isHovered = hoveredSeat?.id === seat.id;

            return (
              <g
                key={seat.id}
                transform={`rotate(${rot} ${px + w / 2} ${py + h / 2})`}
                onPointerEnter={() => setHoveredSeat(seat)}
                onPointerLeave={() => setHoveredSeat(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeatClick?.(seat);
                }}
                className="cursor-pointer"
                style={{ transition: "opacity 80ms ease" }}
              >
                <rect
                  x={px}
                  y={py}
                  width={w}
                  height={h}
                  rx={rx}
                  ry={ry}
                  fill={isActive ? (isHovered ? "#60a5fa" : "#94a3b8") : "#cbd5e1"}
                  stroke={isHovered ? "#2563eb" : "#475569"}
                  strokeWidth={isHovered ? 1 : 0.5}
                  filter={isHovered ? "url(#viewer-glow)" : undefined}
                />
                
                {/* Small inner highlight */}
                <rect
                  x={px + 2}
                  y={py + 2}
                  width={Math.max(0, w - 4)}
                  height={Math.max(0, h - 4)}
                  rx={shape === "circle" ? Math.max(0, rx - 2) : 0}
                  ry={shape === "circle" ? Math.max(0, ry - 2) : 0}
                  fill="white"
                  fillOpacity={isActive ? 0.3 : 0.1}
                  className="pointer-events-none"
                />
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* Tooltip */}
      {hoveredSeat && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 shadow-lg dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200">
          <span className="font-semibold">
            {hoveredSeat.row_label || String(hoveredSeat.row || "")}
            {hoveredSeat.col_label || String(hoveredSeat.number || "")}
          </span>
          {hoveredSeat.label && <span className="ml-1 opacity-70">({String(hoveredSeat.label)})</span>}
        </div>
      )}
    </div>
  );
}
