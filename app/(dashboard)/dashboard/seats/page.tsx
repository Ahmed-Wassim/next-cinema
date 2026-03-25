"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationBar } from "@/components/pagination-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeatViewerCanvas } from "@/components/seat-viewer-canvas";
import { SeatsSubnav } from "@/components/seats-subnav";
import { extractPaginated } from "@/lib/extract-paginated";
import { getHallSections } from "@/services/hallSectionService";
import type { DesignerBounds } from "@/types/designer-types";
import {
  createSeat,
  deleteSeat,
  getSeats,
  updateSeat,
} from "@/services/seatService";
import type { HallSection } from "@/types/hall-section";
import type { PaginationMeta } from "@/types/pagination";
import type { Seat } from "@/types/seat";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

type SeatFormValues = {
  hall_section_id: number;
  row_label: string;
  col_label: string;
  label: string;
  status: string;
};

export default function SeatsPage() {
  const mapBounds: DesignerBounds = useMemo(
    () => ({ x: 0, y: 0, width: 600, height: 400 }),
    [],
  );
  const [sections, setSections] = useState<HallSection[]>([]);
  const [rows, setRows] = useState<Seat[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [filterSectionId, setFilterSectionId] = useState<number>(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<SeatFormValues>({
    hall_section_id: 0,
    row_label: "",
    col_label: "",
    label: "",
    status: "active",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Seat | null>(null);

  const sectionLabelById = useMemo(() => {
    const m = new Map<number, string>();
    sections.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [sections]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === "map") {
        let current = 1;
        let all: Seat[] = [];
        let fetchedMeta: PaginationMeta | null = null;
        while (true) {
          const res = await getSeats({
            page: current,
            per_page: 500, // Safe bulk chunk to avoid massive payloads
            hall_section_id: filterSectionId || undefined,
          });
          const { data, meta: m } = extractPaginated<Seat>(res);
          all = all.concat(data);
          fetchedMeta = m;
          if (m.current_page >= m.last_page) break;
          current++;
        }
        setRows(all);
        setMeta(fetchedMeta || emptyMeta);
      } else {
        const res = await getSeats({ page, per_page: perPage, hall_section_id: filterSectionId || undefined });
        const { data, meta: m } = extractPaginated<Seat>(res);
        setRows(data);
        setMeta(m);
      }
    } catch {
      setError("Failed to load seats.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, viewMode, filterSectionId]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getHallSections({ per_page: 500 });
        const { data } = extractPaginated<HallSection>(res);
        setSections(data);
      } catch {
        /* labels */
      }
    })();
  }, []);

  useEffect(() => {
    if (sections.length > 0) {
      setCreateValues((v) =>
        v.hall_section_id === 0
          ? { ...v, hall_section_id: sections[0]!.id }
          : v,
      );
    }
  }, [sections]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (viewMode === "map" && !filterSectionId && sections.length > 0) {
      setFilterSectionId(sections[0]!.id);
    }
  }, [viewMode, filterSectionId, sections]);

  function buildSeatPayload(v: SeatFormValues): Omit<Seat, "id"> {
    const label =
      v.label.trim() ||
      [v.row_label.trim(), v.col_label.trim()].filter(Boolean).join("") ||
      `${v.row_label}-${v.col_label}`.replace(/^-|-$/g, "");
    return {
      hall_section_id: v.hall_section_id,
      row_label: v.row_label || undefined,
      col_label: v.col_label || undefined,
      label: label || undefined,
      status: v.status || undefined,
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createValues.hall_section_id) {
      setError("Pick a hall section.");
      return;
    }
    try {
      await createSeat(buildSeatPayload(createValues));
      setCreateOpen(false);
      setCreateValues({
        hall_section_id: sections[0]?.id ?? 0,
        row_label: "",
        col_label: "",
        label: "",
        status: "active",
      });
      await load();
    } catch {
      setError("Could not create seat.");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateSeat(editing.id, {
        hall_section_id: editing.hall_section_id,
        row_label: editing.row_label,
        col_label: editing.col_label,
        label: editing.label,
        status: editing.status,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch {
      setError("Could not update seat.");
    }
  }

  async function handleDelete(row: Seat) {
    const lbl =
      row.label ??
      [row.row_label, row.col_label].filter(Boolean).join("") ??
      `Seat ${row.id}`;
    if (!window.confirm(`Delete ${lbl}?`)) return;
    try {
      await deleteSeat(row.id);
      await load();
    } catch {
      setError("Could not delete seat.");
    }
  }

  function displaySeatLabel(s: Seat) {
    return (
      s.label ||
      [s.row_label, s.col_label].filter(Boolean).join(" · ") ||
      `— (${s.id})`
    );
  }

  return (
    <div className="space-y-6">
      <SeatsSubnav />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Seats</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Table view for one-off edits. Use{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">
              Bulk builder
            </strong>{" "}
            or{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">
              Hall layout
            </strong>{" "}
            for full designs. Use the Map view below to verify data.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button">New seat</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New seat</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Hall section</Label>
                  <Select
                    value={String(createValues.hall_section_id || "")}
                    onValueChange={(v) =>
                      setCreateValues((s) => ({
                        ...s,
                        hall_section_id: Number(v),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="row">Row</Label>
                    <Input
                      id="row"
                      value={createValues.row_label}
                      onChange={(e) =>
                        setCreateValues((s) => ({
                          ...s,
                          row_label: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="col">Seat / col</Label>
                    <Input
                      id="col"
                      value={createValues.col_label}
                      onChange={(e) =>
                        setCreateValues((s) => ({
                          ...s,
                          col_label: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lbl">Label (optional)</Label>
                  <Input
                    id="lbl"
                    value={createValues.label}
                    onChange={(e) =>
                      setCreateValues((s) => ({
                        ...s,
                        label: e.target.value,
                      }))
                    }
                    placeholder="Overrides row/col display"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
        <div className="flex items-center gap-2">
          <Select
            value={filterSectionId ? String(filterSectionId) : "all"}
            onValueChange={(v) => {
              setFilterSectionId(v === "all" ? 0 : Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 shadow-sm">
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
              viewMode === "table" 
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50" 
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            )}
          >
            <List className="w-3.5 h-3.5" /> Table
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
              viewMode === "map" 
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50" 
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Map View
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : viewMode === "map" ? (
        filterSectionId === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
            <LayoutGrid className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Please select a Section to view its seat map.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
            <LayoutGrid className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No seats found in this section.</p>
          </div>
        ) : (
          <SeatViewerCanvas 
            seats={rows} 
            className="h-[600px]"
            designerBounds={mapBounds}
            alignSeatsToBounds
            onSeatClick={(seat) => {
              setEditing(seat);
              setEditOpen(true);
            }} 
          />
        )
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Row</TableHead>
                <TableHead>Col</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {sectionLabelById.get(r.hall_section_id) ??
                      r.hall_section_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {displaySeatLabel(r)}
                  </TableCell>
                  <TableCell>{r.row_label ?? "—"}</TableCell>
                  <TableCell>{r.col_label ?? "—"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(r);
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDelete(r)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <PaginationBar
            meta={meta}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
          />
        </>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          {editing ? (
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>Edit seat</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    value={String(editing.hall_section_id)}
                    onValueChange={(v) =>
                      setEditing((s) =>
                        s ? { ...s, hall_section_id: Number(v) } : s,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Row</Label>
                    <Input
                      value={editing.row_label ?? ""}
                      onChange={(e) =>
                        setEditing((s) =>
                          s ? { ...s, row_label: e.target.value } : s,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Col</Label>
                    <Input
                      value={editing.col_label ?? ""}
                      onChange={(e) =>
                        setEditing((s) =>
                          s ? { ...s, col_label: e.target.value } : s,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={editing.label ?? ""}
                    onChange={(e) =>
                      setEditing((s) =>
                        s ? { ...s, label: e.target.value } : s,
                      )
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
