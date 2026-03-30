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
import currencyCodes from "currency-codes";
import { getHalls } from "@/services/hallService";
import {
  createPriceTier,
  deletePriceTier,
  getPriceTiers,
  updatePriceTier,
} from "@/services/priceTierService";
import type { Hall } from "@/types/hall";
import type { PaginationMeta } from "@/types/pagination";
import type { PriceTier } from "@/types/price-tier";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

export default function PriceTiersPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [rows, setRows] = useState<PriceTier[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<Omit<PriceTier, "id">>({
    hall_id: 0,
    name: "",
    price: 0,
    currency: "USD",
    color: "#6366f1",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PriceTier | null>(null);
  const [deleting, setDeleting] = useState<PriceTier | null>(null);
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
      const res = await getPriceTiers({ page, per_page: perPage });
      const { data, meta: m } = extractPaginated<PriceTier>(res);
      setRows(data);
      setMeta(m);
    } catch {
      setError("Failed to load price tiers.");
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
      await createPriceTier({
        ...createValues,
        price: Number(createValues.price),
      });
      setCreateOpen(false);
      setCreateValues({
        hall_id: halls[0]?.id ?? 0,
        name: "",
        price: 0,
        currency: "USD",
        color: "#6366f1",
      });
      await load();
    } catch {
      setError("Could not create price tier.");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await updatePriceTier(editing.id, {
        hall_id: editing.hall_id,
        name: editing.name,
        price: Number(editing.price),
        currency: editing.currency,
        color: editing.color,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch {
      setError("Could not update price tier.");
    }
  }

  async function handleDelete(row: PriceTier) {
    if (!window.confirm(`Delete tier “${row.name}”?`)) return;
    try {
      await deletePriceTier(row.id);
      await load();
    } catch {
      setError("Could not delete price tier.");
    }
  }

  void handleDelete;
  async function confirmDelete(row: PriceTier) {
    setDeleteBusy(true);
    try {
      await deletePriceTier(row.id);
      setDeleting(null);
      await load();
    } catch {
      setError("Could not delete price tier.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Price tiers
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Per-hall pricing with a visible color swatch.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button">New tier</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New price tier</DialogTitle>
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
                  <Label htmlFor="pt-name">Name</Label>
                  <Input
                    id="pt-name"
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
                <div className="space-y-2">
                  <Label htmlFor="pt-price">Price</Label>
                  <Input
                    id="pt-price"
                    type="number"
                    step="0.01"
                    min={0}
                    value={createValues.price}
                    onChange={(e) =>
                      setCreateValues((s) => ({
                        ...s,
                        price: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={createValues.currency || ""}
                    onValueChange={(v) =>
                      setCreateValues((s) => ({ ...s, currency: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyCodes.data.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} - {c.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pt-color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pt-color"
                      type="color"
                      className="h-9 w-14 cursor-pointer p-1"
                      value={createValues.color}
                      onChange={(e) =>
                        setCreateValues((s) => ({
                          ...s,
                          color: e.target.value,
                        }))
                      }
                    />
                    <Input
                      value={createValues.color}
                      onChange={(e) =>
                        setCreateValues((s) => ({
                          ...s,
                          color: e.target.value,
                        }))
                      }
                      placeholder="#RRGGBB"
                      className="flex-1"
                    />
                  </div>
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
                <TableHead>Price</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="w-32">Color</TableHead>
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
                  <TableCell>{r.price}</TableCell>
                  <TableCell>{r.currency}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-6 w-6 rounded border border-zinc-300 dark:border-zinc-600"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {r.color}
                      </span>
                    </div>
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
                            ...r,
                            price:
                              typeof r.price === "number"
                                ? r.price
                                : Number(r.price),
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
                <DialogTitle>Edit price tier</DialogTitle>
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
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={editing.price}
                    onChange={(e) =>
                      setEditing((s) =>
                        s ? { ...s, price: e.target.value } : s,
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={editing.currency || ""}
                    onValueChange={(v) =>
                      setEditing((s) => (s ? { ...s, currency: v } : s))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyCodes.data.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} - {c.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="h-9 w-14 cursor-pointer p-1"
                      value={editing.color}
                      onChange={(e) =>
                        setEditing((s) =>
                          s ? { ...s, color: e.target.value } : s,
                        )
                      }
                    />
                    <Input
                      value={editing.color}
                      onChange={(e) =>
                        setEditing((s) =>
                          s ? { ...s, color: e.target.value } : s,
                        )
                      }
                      className="flex-1"
                    />
                  </div>
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
        title="Delete price tier"
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
