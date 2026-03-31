"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CircleDashed,
  CreditCard,
  ReceiptText,
} from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { DashboardTableSkeleton } from "@/components/dashboard-table-skeleton";
import { PaginationBar } from "@/components/pagination-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { extractPaginated } from "@/lib/extract-paginated";
import { getPayments } from "@/services/paymentService";
import type { Payment } from "@/types/payment";
import type { PaginationMeta } from "@/types/pagination";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

const successStatuses = new Set([
  "paid",
  "completed",
  "success",
  "successful",
  "captured",
]);

const pendingStatuses = new Set(["pending", "processing", "initiated"]);

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase();
}

function formatAmount(value: number | string, currency?: string | null) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || ""}`.trim();
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getCustomerLabel(payment: Payment) {
  return (
    payment.booking?.customer?.name ||
    payment.booking?.user?.name ||
    payment.booking?.customer?.email ||
    payment.booking?.user?.email ||
    "Guest customer"
  );
}

function getShowLabel(payment: Payment) {
  const movie = payment.booking?.showtime?.movie?.title;
  const hall = payment.booking?.showtime?.hall?.name;

  if (movie && hall) return `${movie} - ${hall}`;
  if (movie) return movie;
  if (hall) return hall;
  return `Booking #${payment.booking_id}`;
}

export default function PaymentsPage() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayments({ page, per_page: perPage });
      const { data, meta: nextMeta } = extractPaginated<Payment>(response);
      setRows(data);
      setMeta(nextMeta);
    } catch {
      setError("Failed to load payments.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const paidCount = useMemo(
    () =>
      rows.filter((payment) =>
        successStatuses.has(normalizeStatus(payment.status)),
      ).length,
    [rows],
  );

  const pendingCount = useMemo(
    () =>
      rows.filter((payment) =>
        pendingStatuses.has(normalizeStatus(payment.status)),
      ).length,
    [rows],
  );

  const totalVisibleAmount = useMemo(
    () =>
      rows.reduce((sum, payment) => {
        const amount = Number(payment.amount);
        return Number.isNaN(amount) ? sum : sum + amount;
      }, 0),
    [rows],
  );

  const primaryCurrency = rows[0]?.currency || "USD";

  return (
    <div className="dashboard-content-grid">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
          Finance
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Payments</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Monitor payment attempts, booking links, and gateway references from the
          tenant dashboard.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardStatCard
          label="Payments loaded"
          value={rows.length}
          hint="Visible payment records for the active dashboard page."
          progress={100}
          icon={ReceiptText}
        />
        <DashboardStatCard
          label="Marked successful"
          value={paidCount}
          hint="Counts rows whose status looks like a completed or captured payment."
          progress={rows.length ? (paidCount / rows.length) * 100 : 0}
          icon={BadgeCheck}
          tone="secondary"
        />
        <DashboardStatCard
          label="Visible total"
          value={formatAmount(totalVisibleAmount, primaryCurrency)}
          hint="Adds the amounts on the current page so finance can spot-check today’s payload quickly."
          progress={rows.length ? (pendingCount / rows.length) * 100 : 0}
          icon={CreditCard}
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
        <DashboardTableSkeleton rows={6} columns={7} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment ledger</CardTitle>
            <CardDescription>
              Each row keeps the payment status, booking context, customer identity,
              and gateway reference within one scan-friendly table.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Show / booking</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((payment) => {
                  const status = normalizeStatus(payment.status);
                  const statusClassName = successStatuses.has(status)
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : pendingStatuses.has(status)
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";

                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">#{payment.id}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            Booking #{payment.booking_id}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            Ref: {payment.transaction_ref || "n/a"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{getCustomerLabel(payment)}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {payment.booking?.customer?.email ||
                              payment.booking?.user?.email ||
                              "No email available"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{getShowLabel(payment)}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {formatDateTime(payment.booking?.showtime?.start_time)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClassName}`}
                        >
                          {payment.status || "unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{payment.gateway || "n/a"}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {payment.booking?.status || "No booking status"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(payment.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      No payments found for this page yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-2 shadow-sm dark:bg-zinc-950">
                  <CircleDashed className="h-4 w-4 text-[color:var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status mapping note</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Success and pending cards use a small normalized status set so
                    unknown gateway values still render safely in the table.
                  </p>
                </div>
              </div>
            </div>

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
    </div>
  );
}
