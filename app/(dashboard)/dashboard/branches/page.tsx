"use client";

import { useCallback, useEffect, useState } from "react";

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
  createBranch,
  deleteBranch,
  getBranches,
  updateBranch,
} from "@/services/branchService";
import type { Branch } from "@/types/branch";
import type { PaginationMeta } from "@/types/pagination";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

function BranchFormFields({
  values,
  onChange,
}: {
  values: Omit<Branch, "id">;
  onChange: (v: Omit<Branch, "id">) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="b-name">Name</Label>
        <Input
          id="b-name"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-city">City</Label>
        <Input
          id="b-city"
          value={values.city}
          onChange={(e) => onChange({ ...values, city: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-address">Address</Label>
        <Input
          id="b-address"
          value={values.address}
          onChange={(e) => onChange({ ...values, address: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-tz">Timezone</Label>
        <Input
          id="b-tz"
          placeholder="e.g. Africa/Cairo"
          value={values.timezone}
          onChange={(e) => onChange({ ...values, timezone: e.target.value })}
          required
        />
      </div>
    </div>
  );
}

export default function BranchesPage() {
  const [rows, setRows] = useState<Branch[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<Omit<Branch, "id">>({
    name: "",
    city: "",
    address: "",
    timezone: "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState<Branch | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function executeDelete(row: Branch) {
    setDeleteBusy(true);
    try {
      await deleteBranch(row.id);
      setDeleting(null);
      await load();
    } catch {
      setError("Could not delete branch.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBranches({ page, per_page: perPage });
      const { data, meta: m } = extractPaginated<Branch>(res);
      setRows(data);
      setMeta(m);
    } catch {
      setError("Failed to load branches.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createBranch(createValues);
      setCreateOpen(false);
      setCreateValues({
        name: "",
        city: "",
        address: "",
        timezone: "",
      });
      await load();
    } catch {
      setError("Could not create branch.");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateBranch(editing.id, {
        name: editing.name,
        city: editing.city,
        address: editing.address,
        timezone: editing.timezone,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch {
      setError("Could not update branch.");
    }
  }

  async function confirmDelete(row: Branch) {
    if (!window.confirm(`Delete branch “${row.name}”?`)) return;
    try {
      await deleteBranch(row.id);
      await load();
    } catch {
      setError("Could not delete branch.");
    }
  }
  void confirmDelete;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Branches</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Locations: name, city, address, timezone.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button">New branch</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New branch</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <BranchFormFields
                  values={createValues}
                  onChange={setCreateValues}
                />
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
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.city}</TableCell>
                  <TableCell>{b.address}</TableCell>
                  <TableCell>{b.timezone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-w-[72px]"
                        onClick={() => {
                          setEditing(b);
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
                        onClick={() => setDeleting(b)}
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
                <DialogTitle>Edit branch</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <BranchFormFields
                  values={{
                    name: editing.name,
                    city: editing.city,
                    address: editing.address,
                    timezone: editing.timezone,
                  }}
                  onChange={(v) => setEditing({ ...editing, ...v })}
                />
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
        title="Delete branch"
        description={
          deleting
            ? `This will permanently remove "${deleting.name}".`
            : ""
        }
        onConfirm={() => (deleting ? executeDelete(deleting) : undefined)}
        loading={deleteBusy}
      />
    </div>
  );
}
