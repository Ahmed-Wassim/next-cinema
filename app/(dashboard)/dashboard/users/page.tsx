"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, KeyRound } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { extractPaginated } from "@/lib/extract-paginated";
import { deleteUser, getUsers } from "@/services/userService";
import type { User } from "@/types/user";
import type { PaginationMeta } from "@/types/pagination";
import { Can } from "@/components/can";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

export default function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<User | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers({ page, per_page: perPage });
      const { data, meta: nextMeta } = extractPaginated<User>(response);
      setRows(data);
      setMeta(nextMeta);
    } catch {
      setError("Failed to load users.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void load();
  }, [load]);

  async function executeDelete(row: User) {
    setDeleteBusy(true);
    try {
      await deleteUser(row.id);
      setDeleting(null);
      await load();
    } catch {
      setError("Could not delete user.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="dashboard-content-grid">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Users</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create staff profiles and bind them to functional roles securely.
          </p>
        </div>
        <Can permission="user-create">
          <Button asChild>
            <Link href="/dashboard/users/create">New user</Link>
          </Button>
        </Can>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardStatCard
          label="Total staff"
          value={meta.total || rows.length}
          hint="Active tenant administrators in your namespace."
          progress={100}
          icon={Users}
        />
        <DashboardStatCard
          label="Accounts generated"
          value={rows.length}
          hint="Operational overhead inside current list view."
          progress={100}
          icon={UserPlus}
          tone="secondary"
        />
        <DashboardStatCard
          label="Secure binds"
          value={rows.reduce((sum, r) => sum + (r.roles?.length || 0), 0)}
          hint="Count of roles distributed across visible staff."
          progress={100}
          icon={KeyRound}
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
        <DashboardTableSkeleton rows={6} columns={4} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Staff directory</CardTitle>
            <CardDescription>
              Manage administrative capabilities and restrict platform access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-[140px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.roles && user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 font-medium whitespace-nowrap"
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-sm italic">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Can permission="user-update">
                          <Button asChild variant="outline" size="sm" className="min-w-[72px]">
                            <Link href={`/dashboard/users/${user.id}`}>Edit</Link>
                          </Button>
                        </Can>
                        <Can permission="user-delete">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="min-w-[72px]"
                            onClick={() => setDeleting(user)}
                          >
                            Delete
                          </Button>
                        </Can>
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

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete User"
        description={
          deleting
            ? `This action will permanently purge "${deleting.name}" from your organization.`
            : ""
        }
        onConfirm={() => (deleting ? executeDelete(deleting) : undefined)}
        loading={deleteBusy}
      />
    </div>
  );
}
