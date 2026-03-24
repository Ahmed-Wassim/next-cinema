"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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

  const branchNameById = useMemo(() => {
    const m = new Map<number, string>();
    branches.forEach((b) => m.set(b.id, b.name));
    return m;
  }, [branches]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHalls({ page, per_page: perPage });
      const { data, meta: m } = extractPaginated<Hall>(res);
      setRows(data);
      setMeta(m);
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
        const res = await getBranches({ per_page: 500 });
        const { data } = extractPaginated<Branch>(res);
        setBranches(data);
      } catch {
        /* labels only */
      }
    })();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      setCreateValues((v) =>
        v.branch_id === 0 ? { ...v, branch_id: branches[0]!.id } : v,
      );
    }
  }, [branches]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
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

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
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

  async function handleDelete(row: Hall) {
    if (!window.confirm(`Delete hall “${row.name}”?`)) return;
    try {
      await deleteHall(row.id);
      await load();
    } catch {
      setError("Could not delete hall.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Halls</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Screens linked to a branch.
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
                    onValueChange={(v) =>
                      setCreateValues((s) => ({
                        ...s,
                        branch_id: Number(v),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
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
                    onChange={(e) =>
                      setCreateValues((s) => ({ ...s, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-type">Type</Label>
                  <Input
                    id="h-type"
                    value={createValues.type}
                    onChange={(e) =>
                      setCreateValues((s) => ({ ...s, type: e.target.value }))
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
                    onChange={(e) =>
                      setCreateValues((s) => ({
                        ...s,
                        total_seats: e.target.value === "" ? 0 : Number(e.target.value),
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
                    onChange={(e) =>
                      setCreateValues((s) => ({
                        ...s,
                        layout_type: e.target.value,
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

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
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
              {rows.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    {branchNameById.get(h.branch_id) ?? h.branch_id}
                  </TableCell>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{h.type}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {h.total_seats ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-700 dark:text-zinc-300">
                    {h.layout_type ?? "—"}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing({
                          ...h,
                          total_seats: h.total_seats ?? 0,
                          layout_type: h.layout_type ?? "",
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
                      onClick={() => void handleDelete(h)}
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
                <DialogTitle>Edit hall</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={String(editing.branch_id)}
                    onValueChange={(v) =>
                      setEditing((s) =>
                        s ? { ...s, branch_id: Number(v) } : s,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing((s) =>
                        s ? { ...s, name: e.target.value } : s,
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input
                    value={editing.type}
                    onChange={(e) =>
                      setEditing((s) =>
                        s ? { ...s, type: e.target.value } : s,
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
                    onChange={(e) =>
                      setEditing((s) =>
                        s
                          ? {
                              ...s,
                              total_seats:
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value),
                            }
                          : s,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Layout type</Label>
                  <Input
                    placeholder="e.g. stadium"
                    value={editing.layout_type ?? ""}
                    onChange={(e) =>
                      setEditing((s) =>
                        s ? { ...s, layout_type: e.target.value } : s,
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
