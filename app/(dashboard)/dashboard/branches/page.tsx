"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Globe2, MapPinned } from "lucide-react";

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
  onChange: (value: Omit<Branch, "id">) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="b-name">Name</Label>
        <Input
          id="b-name"
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-city">City</Label>
        <Input
          id="b-city"
          value={values.city}
          onChange={(event) => onChange({ ...values, city: event.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-address">Address</Label>
        <Input
          id="b-address"
          value={values.address}
          onChange={(event) =>
            onChange({ ...values, address: event.target.value })
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-tz">Timezone</Label>
        <Input
          id="b-tz"
          placeholder="e.g. Africa/Cairo"
          value={values.timezone}
          onChange={(event) =>
            onChange({ ...values, timezone: event.target.value })
          }
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
      const response = await getBranches({ page, per_page: perPage });
      const { data, meta: nextMeta } = extractPaginated<Branch>(response);
      setRows(data);
      setMeta(nextMeta);
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

  const uniqueCities = new Set(rows.map((branch) => branch.city)).size;
  const timezonesConfigured = rows.filter((branch) => branch.timezone.trim()).length;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
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

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
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

  return (
    <div className="dashboard-content-grid">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Network
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Branches</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Location management with clearer editing, richer spacing, and faster scanning.
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
                <BranchFormFields values={createValues} onChange={setCreateValues} />
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
          label="Branch count"
          value={rows.length}
          hint="Current rows in view with pagination-ready interactions."
          progress={100}
          icon={Building2}
        />
        <DashboardStatCard
          label="Cities covered"
          value={uniqueCities}
          hint="Track how broadly your branch network is distributed."
          progress={rows.length ? (uniqueCities / rows.length) * 100 : 0}
          icon={MapPinned}
          tone="secondary"
        />
        <DashboardStatCard
          label="Timezones set"
          value={timezonesConfigured}
          hint="Useful for validating scheduling readiness before showtime setup."
          progress={rows.length ? (timezonesConfigured / rows.length) * 100 : 0}
          icon={Globe2}
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
        <DashboardTableSkeleton rows={6} columns={5} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Branch directory</CardTitle>
            <CardDescription>
              Edit and delete actions now sit in a cleaner responsive container that behaves well on smaller screens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
                {rows.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.city}</TableCell>
                    <TableCell>{branch.address}</TableCell>
                    <TableCell>{branch.timezone}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-w-[72px]"
                          onClick={() => {
                            setEditing(branch);
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
                          onClick={() => setDeleting(branch)}
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
                  onChange={(value) => setEditing({ ...editing, ...value })}
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
          deleting ? `This will permanently remove "${deleting.name}".` : ""
        }
        onConfirm={() => (deleting ? executeDelete(deleting) : undefined)}
        loading={deleteBusy}
      />
    </div>
  );
}
