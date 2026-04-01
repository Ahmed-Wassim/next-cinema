"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Percent, TicketPercent, ToggleLeft } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { DashboardTableSkeleton } from "@/components/dashboard-table-skeleton";
import { PaginationBar } from "@/components/pagination-bar";
import { Badge } from "@/components/ui/badge";
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
import {
  createDiscount,
  deleteDiscount,
  getDiscounts,
  updateDiscount,
} from "@/services/discountService";
import type { Discount, DiscountPayload, DiscountType } from "@/types/discount";
import type { PaginationMeta } from "@/types/pagination";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

const emptyForm = {
  code: "",
  type: "percentage" as DiscountType,
  value: "",
  max_uses: "",
  is_active: true,
};

type DiscountFormState = typeof emptyForm;

function normalizeDiscountRows(response: unknown): {
  data: Discount[];
  meta: PaginationMeta;
} {
  if (
    response &&
    typeof response === "object" &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    const rows = (response as { data: Discount[] }).data;
    return {
      data: rows,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: rows.length || 15,
        total: rows.length,
      },
    };
  }

  return extractPaginated<Discount>(response as never);
}

function parseDiscountPayload(values: DiscountFormState): DiscountPayload {
  return {
    code: values.code.trim().toUpperCase(),
    type: values.type,
    value: Number(values.value),
    max_uses: values.max_uses ? Number(values.max_uses) : null,
    is_active: values.is_active,
  };
}

function formatValue(discount: Discount) {
  const value = Number(discount.value);
  if (Number.isNaN(value)) return String(discount.value);
  return discount.type === "percentage" ? `${value}%` : value.toFixed(2);
}

function DiscountForm({
  values,
  onChange,
  submitLabel,
}: {
  values: DiscountFormState;
  onChange: (next: DiscountFormState) => void;
  submitLabel: string;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="discount-code">Coupon code</Label>
        <Input
          id="discount-code"
          value={values.code}
          onChange={(event) =>
            onChange({ ...values, code: event.target.value.toUpperCase() })
          }
          placeholder="SUMMER10"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discount-type">Discount type</Label>
          <Select
            value={values.type}
            onValueChange={(value: DiscountType) =>
              onChange({ ...values, type: value })
            }
          >
            <SelectTrigger id="discount-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount-value">Value</Label>
          <Input
            id="discount-value"
            type="number"
            min="0"
            step="0.01"
            value={values.value}
            onChange={(event) =>
              onChange({ ...values, value: event.target.value })
            }
            placeholder={values.type === "percentage" ? "10" : "25.00"}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discount-max-uses">Max uses</Label>
          <Input
            id="discount-max-uses"
            type="number"
            min="1"
            value={values.max_uses}
            onChange={(event) =>
              onChange({ ...values, max_uses: event.target.value })
            }
            placeholder="100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount-status">Status</Label>
          <Select
            value={values.is_active ? "active" : "inactive"}
            onValueChange={(value) =>
              onChange({ ...values, is_active: value === "active" })
            }
          >
            <SelectTrigger id="discount-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter className="pt-2">
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </div>
  );
}

export default function DiscountsPage() {
  const [rows, setRows] = useState<Discount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<DiscountFormState>(emptyForm);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [editValues, setEditValues] = useState<DiscountFormState>(emptyForm);
  const [deleting, setDeleting] = useState<Discount | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDiscounts({ page, per_page: perPage });
      const normalized = normalizeDiscountRows(response.data);
      setRows(normalized.data);
      setMeta(normalized.meta);
    } catch {
      setError("Failed to load discounts.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount = useMemo(
    () => rows.filter((row) => row.is_active).length,
    [rows],
  );
  const percentageCount = useMemo(
    () => rows.filter((row) => row.type === "percentage").length,
    [rows],
  );
  const usageLimitedCount = useMemo(
    () => rows.filter((row) => Number(row.max_uses ?? 0) > 0).length,
    [rows],
  );

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createDiscount(parseDiscountPayload(createValues));
      setCreateOpen(false);
      setCreateValues(emptyForm);
      await load();
    } catch {
      setError("Could not create discount.");
    }
  }

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    try {
      await updateDiscount(editing.id, parseDiscountPayload(editValues));
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch {
      setError("Could not update discount.");
    }
  }

  async function confirmDelete(row: Discount) {
    setDeleteBusy(true);
    try {
      await deleteDiscount(row.id);
      setDeleting(null);
      await load();
    } catch {
      setError("Could not delete discount.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="dashboard-content-grid">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Promotions
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Discounts
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Manage coupon codes, activation status, and usage limits for the
            booking flow.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button">New discount</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create discount</DialogTitle>
              </DialogHeader>
              <DiscountForm
                values={createValues}
                onChange={setCreateValues}
                submitLabel="Create discount"
              />
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardStatCard
          label="Discounts loaded"
          value={rows.length}
          hint="Visible coupon records for the current dashboard page."
          progress={100}
          icon={TicketPercent}
        />
        <DashboardStatCard
          label="Active discounts"
          value={activeCount}
          hint="Codes customers can redeem right now."
          progress={rows.length ? (activeCount / rows.length) * 100 : 0}
          icon={ToggleLeft}
          tone="secondary"
        />
        <DashboardStatCard
          label="Percent / capped"
          value={`${percentageCount}/${usageLimitedCount}`}
          hint="Quick split between percentage promos and codes with usage limits."
          progress={rows.length ? (percentageCount / rows.length) * 100 : 0}
          icon={Percent}
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
            <CardTitle>Coupon directory</CardTitle>
            <CardDescription>
              Review promo codes, values, status, and redemption caps in one
              place.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[160px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.code}</TableCell>
                    <TableCell className="capitalize">{row.type}</TableCell>
                    <TableCell>{formatValue(row)}</TableCell>
                    <TableCell>
                      {row.used_count ?? 0}
                      {row.max_uses ? ` / ${row.max_uses}` : " / unlimited"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.is_active ? "success" : "secondary"}>
                        {row.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(row);
                            setEditValues({
                              code: row.code,
                              type: row.type,
                              value: String(row.value),
                              max_uses: row.max_uses ? String(row.max_uses) : "",
                              is_active: row.is_active,
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
                          onClick={() => setDeleting(row)}
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
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit discount</DialogTitle>
            </DialogHeader>
            <DiscountForm
              values={editValues}
              onChange={setEditValues}
              submitLabel="Save changes"
            />
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete discount"
        description={
          deleting
            ? `This will remove coupon code ${deleting.code} from the dashboard.`
            : ""
        }
        onConfirm={() => (deleting ? confirmDelete(deleting) : undefined)}
        loading={deleteBusy}
      />
    </div>
  );
}
