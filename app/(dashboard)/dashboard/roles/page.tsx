"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, KeyRound } from "lucide-react";

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
import { deleteRole, getPermissions, getRoles } from "@/services/roleService";
import type { Role, PermissionGroup } from "@/types/role";
import type { PaginationMeta } from "@/types/pagination";
import { Can } from "@/components/can";

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
};

export default function RolesPage() {
  const [rows, setRows] = useState<Role[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [permissionGroupsCount, setPermissionGroupsCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<Role | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadPermissions = useCallback(async () => {
    try {
      const res = await getPermissions();
      const pRaw: any[][] = res.data?.data || res.data || [];
      setPermissionGroupsCount(pRaw.length);
    } catch {
      console.error("Failed to load permissions list.");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRoles({ page, per_page: perPage });
      const { data, meta: nextMeta } = extractPaginated<Role>(response);
      setRows(data);
      setMeta(nextMeta);
    } catch {
      setError("Failed to load roles.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void load();
    void loadPermissions();
  }, [load, loadPermissions]);

  async function executeDelete(row: Role) {
    setDeleteBusy(true);
    try {
      await deleteRole(row.id);
      setDeleting(null);
      await load();
    } catch {
      setError("Could not delete role. It may be assigned to users.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const uniquePermissionsGiven = rows.reduce(
    (sum, r) => sum + (r.permissions_count || 0),
    0,
  );

  return (
    <div className="dashboard-content-grid">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Security
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Roles</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Define structural boundaries by creating roles and assigning targeted permissions.
          </p>
        </div>
        <Can permission="role-create">
          <Button asChild>
            <Link href="/dashboard/roles/create">New role</Link>
          </Button>
        </Can>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardStatCard
          label="Total roles"
          value={meta.total || rows.length}
          hint="Total structural identities available for user assignment."
          progress={100}
          icon={ShieldCheck}
        />
        <DashboardStatCard
          label="Permissions grouped"
          value={permissionGroupsCount}
          hint="Functional domains your security policy governs."
          progress={100}
          icon={ShieldAlert}
          tone="secondary"
        />
        <DashboardStatCard
          label="Total assigned keys"
          value={uniquePermissionsGiven}
          hint="Sum of all permissions actively tethered to visible roles."
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
            <CardTitle>Role Management</CardTitle>
            <CardDescription>
              A robust overview of structural permissions allocated across tenant admins.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permissions Granted</TableHead>
                  <TableHead className="w-[140px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="text-zinc-500 font-mono text-xs">
                      #{role.id}
                    </TableCell>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      {role.permissions_count !== undefined
                        ? `${role.permissions_count} permissions`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Can permission="role-update">
                          <Button asChild variant="outline" size="sm" className="min-w-[72px]">
                            <Link href={`/dashboard/roles/${role.id}`}>Edit</Link>
                          </Button>
                        </Can>
                        <Can permission="role-delete">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="min-w-[72px]"
                            onClick={() => setDeleting(role)}
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
        title="Delete Role"
        description={
          deleting
            ? `This will permanently remove "${deleting.name}". It will fail if users still hold this role.`
            : ""
        }
        onConfirm={() => (deleting ? executeDelete(deleting) : undefined)}
        loading={deleteBusy}
      />
    </div>
  );
}
