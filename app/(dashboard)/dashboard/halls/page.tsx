"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Armchair, Building2, LayoutTemplate } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { DashboardTableSkeleton } from "@/components/dashboard-table-skeleton";
import { PaginationBar } from "@/components/pagination-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { extractPaginated } from "@/lib/extract-paginated";
import { getBranches } from "@/services/branchService";
import {
  createHall,
  deleteHall,
  getHalls,
  updateHall,
} from "@/services/hallService";
import type { Branch } from "@/types/branch";
import type { Hall } from "@/types/hall";
import type { PaginationMeta } from "@/types/pagination";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

export default function HallsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rows, setRows] = useState<Hall[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<Omit<Hall, "id">>({
    branch_id: 0,
    name: "",
    type: "",
    total_seats: 0,
    layout_type: "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Hall | null>(null);
  const [deleting, setDeleting] = useState<Hall | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const branchNameById = useMemo(() => {
    const map = new Map<number, string>();
    branches.forEach((branch) => map.set(branch.id, branch.name));
    return map;
  }, [branches]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHalls({ page, per_page: perPage });
      const { data, meta: nextMeta } = extractPaginated<Hall>(response);
      setRows(data);
      setMeta(nextMeta);
    } catch {
      setError("Failed to load halls.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await getBranches({ per_page: 500 });
        const { data } = extractPaginated<Branch>(response);
        setBranches(data);
      } catch {
        /* labels only */
      }
    })();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      setCreateValues((value) =>
        value.branch_id === 0 ? { ...value, branch_id: branches[0]!.id } : value,
      );
    }
  }, [branches]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalSeats = rows.reduce(
    (sum, hall) => sum + Number(hall.total_seats ?? 0),
    0,
  );
  const configuredLayouts = rows.filter((hall) => hall.layout_type?.trim()).length;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!createValues.branch_id) {
      setError("Pick a branch.");
      return;
    }
    try {
      await createHall(createValues);
      setCreateOpen(false);
      setCreateValues({
        branch_id: branches[0]?.id ?? 0,
        name: "",
        type: "",
        total_seats: 0,
        layout_type: "",
      });
      await load();
    } catch {
      setError("Could not create hall.");
    }
  }

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    try {
      await updateHall(editing.id, {
        branch_id: editing.branch_id,
        name: editing.name,
        type: editing.type,
        total_seats: Number(editing.total_seats ?? 0),
        layout_type: editing.layout_type ?? "",
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch {
      setError("Could not update hall.");
    }
  }

  async function confirmDelete(row: Hall) {
    setDeleteBusy(true);
    try {
      await deleteHall(row.id);
      setDeleting(null);
      await load();
    } catch {
      setError("Could not delete hall.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="dashboard-content-grid">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Venue setup
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Halls</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Screen inventory connected to branches with better readability and editing flow.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button">New hall</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New hall</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={String(createValues.branch_id || "")}
                    onValueChange={(value) =>
                      setCreateValues((state) => ({
                        ...state,
                        branch_id: Number(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-name">Name</Label>
                  <Input
                    id="h-name"
                    value={createValues.name}
                    onChange={(event) =>
                      setCreateValues((state) => ({ ...state, name: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-type">Type</Label>
                  <Input
                    id="h-type"
                    value={createValues.type}
                    onChange={(event) =>
                      setCreateValues((state) => ({ ...state, type: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-total-seats">Total seats</Label>
                  <Input
                    id="h-total-seats"
                    type="number"
                    min={0}
                    step={1}
                    value={createValues.total_seats ?? ""}
                    onChange={(event) =>
                      setCreateValues((state) => ({
                        ...state,
                        total_seats:
                          event.target.value === "" ? 0 : Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-layout-type">Layout type</Label>
                  <Input
                    id="h-layout-type"
                    placeholder="e.g. stadium"
                    value={createValues.layout_type ?? ""}
                    onChange={(event) =>
                      setCreateValues((state) => ({
                        ...state,
                        layout_type: event.target.value,
                      }))
                    }
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

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardStatCard
          label="Halls in view"
          value={rows.length}
          hint="Responsive cards keep the main metrics visible above the data table."
          progress={100}
          icon={Building2}
        />
        <DashboardStatCard
          label="Seat capacity"
          value={totalSeats}
          hint="Combined seat totals for the currently visible collection."
          progress={Math.min(totalSeats / 10, 100)}
          icon={Armchair}
          tone="secondary"
        />
        <DashboardStatCard
          label="Layout coverage"
          value={`${configuredLayouts}/${rows.length || 0}`}
          hint="See which halls already carry layout metadata for downstream seat tooling."
          progress={rows.length ? (configuredLayouts / rows.length) * 100 : 0}
          icon={LayoutTemplate}
          tone="accent"
        />
      </div>

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-red-600 dark:text-red-400">
            {error}
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <DashboardTableSkeleton rows={6} columns={6} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Hall directory</CardTitle>
            <CardDescription>
              The table keeps the existing fields intact while improving scan rhythm, spacing, and hover feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24 text-right">Seats</TableHead>
                  <TableHead className="w-28">Layout</TableHead>
                  <TableHead className="w-[140px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((hall) => (
                  <TableRow key={hall.id}>
                    <TableCell>
                      {branchNameById.get(hall.branch_id) ?? hall.branch_id}
                    </TableCell>
                    <TableCell className="font-medium">{hall.name}</TableCell>
                    <TableCell>{hall.type}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {hall.total_seats ?? "-"}
                    </TableCell>
                    <TableCell className="text-zinc-700 dark:text-zinc-300">
                      {hall.layout_type ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-w-[72px]"
                          onClick={() => {
                            setEditing({
                              ...hall,
                              total_seats: hall.total_seats ?? 0,
                              layout_type: hall.layout_type ?? "",
                            });
                            setEditOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="min-w-[72px]"
                          onClick={() => setDeleting(hall)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <PaginationBar
              meta={meta}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          {editing ? (
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>Edit hall</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={String(editing.branch_id)}
                    onValueChange={(value) =>
                      setEditing((state) =>
                        state ? { ...state, branch_id: Number(value) } : state,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editing.name}
                    onChange={(event) =>
                      setEditing((state) =>
                        state ? { ...state, name: event.target.value } : state,
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input
                    value={editing.type}
                    onChange={(event) =>
                      setEditing((state) =>
                        state ? { ...state, type: event.target.value } : state,
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total seats</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={editing.total_seats ?? ""}
                    onChange={(event) =>
                      setEditing((state) =>
                        state
                          ? {
                              ...state,
                              total_seats:
                                event.target.value === ""
                                  ? 0
                                  : Number(event.target.value),
                            }
                          : state,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Layout type</Label>
                  <Input
                    placeholder="e.g. stadium"
                    value={editing.layout_type ?? ""}
                    onChange={(event) =>
                      setEditing((state) =>
                        state ? { ...state, layout_type: event.target.value } : state,
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

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete hall"
        description={
          deleting ? `This will permanently remove "${deleting.name}".` : ""
        }
        onConfirm={() => (deleting ? confirmDelete(deleting) : undefined)}
        loading={deleteBusy}
      />
    </div>
  );
}
