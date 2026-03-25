"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
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
import {
  createHallSection,
  deleteHallSection,
  getHallSections,
  updateHallSection,
} from "@/services/hallSectionService";
import { getHalls } from "@/services/hallService";
import type { HallSection } from "@/types/hall-section";
import type { Hall } from "@/types/hall";
import type { PaginationMeta } from "@/types/pagination";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

export default function HallSectionsPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [rows, setRows] = useState<HallSection[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState({
    hall_id: 0,
    name: "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<HallSection | null>(null);
  const [deleting, setDeleting] = useState<HallSection | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const hallNameById = useMemo(() => {
    const m = new Map<number, string>();
    halls.forEach((h) => m.set(h.id, h.name));
    return m;
  }, [halls]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHallSections({ page, per_page: perPage });
      const { data, meta: m } = extractPaginated<HallSection>(res);
      setRows(data);
      setMeta(m);
    } catch {
      setError("Failed to load hall sections.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getHalls({ per_page: 500 });
        const { data } = extractPaginated<Hall>(res);
        setHalls(data);
      } catch {
        /* labels */
      }
    })();
  }, []);

  useEffect(() => {
    if (halls.length > 0) {
      setCreateValues((v) =>
        v.hall_id === 0 ? { ...v, hall_id: halls[0]!.id } : v,
      );
    }
  }, [halls]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createValues.hall_id) {
      setError("Pick a hall.");
      return;
    }
    try {
      await createHallSection({
        hall_id: createValues.hall_id,
        name: createValues.name,
      });
      setCreateOpen(false);
      setCreateValues({
        hall_id: halls[0]?.id ?? 0,
        name: "",
      });
      await load();
    } catch {
      setError("Could not create section.");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateHallSection(editing.id, {
        hall_id: editing.hall_id,
        name: editing.name,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch {
      setError("Could not update section.");
    }
  }

  async function handleDelete(row: HallSection) {
    if (!window.confirm(`Delete section “${row.name}”?`)) return;
    try {
      await deleteHallSection(row.id);
      await load();
    } catch {
      setError("Could not delete section.");
    }
  }

  void handleDelete;
  async function confirmDelete(row: HallSection) {
    setDeleteBusy(true);
    try {
      await deleteHallSection(row.id);
      setDeleting(null);
      await load();
    } catch {
      setError("Could not delete section.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hall sections
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Blocks of seating inside a hall.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button">New section</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New hall section</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Hall</Label>
                  <Select
                    value={String(createValues.hall_id || "")}
                    onValueChange={(v) =>
                      setCreateValues((s) => ({
                        ...s,
                        hall_id: Number(v),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hall" />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((h) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hs-name">Name</Label>
                  <Input
                    id="hs-name"
                    value={createValues.name}
                    onChange={(e) =>
                      setCreateValues((s) => ({
                        ...s,
                        name: e.target.value,
                      }))
                    }
                    required
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
                <TableHead>Hall</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {hallNameById.get(r.hall_id) ?? r.hall_id}
                  </TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-w-[72px]"
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
                        className="min-w-[72px]"
                        onClick={() => setDeleting(r)}
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
                <DialogTitle>Edit hall section</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Hall</Label>
                  <Select
                    value={String(editing.hall_id)}
                    onValueChange={(v) =>
                      setEditing((s) =>
                        s ? { ...s, hall_id: Number(v) } : s,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hall" />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((h) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.name}
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
        title="Delete hall section"
        description={
          deleting
            ? `This will permanently remove "${deleting.name}".`
            : ""
        }
        onConfirm={() => (deleting ? confirmDelete(deleting) : undefined)}
        loading={deleteBusy}
      />
    </div>
  );
}
