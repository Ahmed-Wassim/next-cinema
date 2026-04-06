"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleForm, type RoleFormValues } from "@/components/role-form";
import { getRole, updateRole, getPermissions } from "@/services/roleService";
import type { PermissionGroup, Role } from "@/types/role";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = Number(params?.id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);

  const [values, setValues] = useState<RoleFormValues>({
    name: "",
    permissions: [],
  });

  useEffect(() => {
    if (!roleId) return;

    async function loadData() {
      try {
        const [permRes, roleRes] = await Promise.all([
          getPermissions(),
          getRole(roleId),
        ]);

        // Standardize Roles
        const pRaw: any[][] = permRes.data?.data || permRes.data || [];
        const mappedGroups: PermissionGroup[] = pRaw.map((groupArr) => {
          const firstPerm = groupArr[0];
          let groupName = "General";
          if (firstPerm && firstPerm.name) {
            const parts = firstPerm.name.split("-");
            parts.pop();
            groupName = parts.length > 0 ? parts.join(" ") : firstPerm.name;
          }
          return {
            group: groupName,
            permissions: groupArr,
          };
        });
        setPermissionGroups(mappedGroups);

        // Standardize Value
        const roleData: Role = roleRes.data?.data || roleRes.data;
        const permIds =
          roleData.permissions?.map((p: any) => Number(p.id ?? p)) || [];
        setValues({
          name: roleData.name,
          permissions: permIds,
        });
      } catch {
        setError("Failed to fetch role data context.");
      } finally {
        setInitialLoading(false);
      }
    }
    
    void loadData();
  }, [roleId]);

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateRole(roleId, values);
      router.push("/dashboard/roles");
      router.refresh();
    } catch {
      setError("Could not save changes to role.");
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="text-zinc-500 text-sm">Loading config...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-content-grid max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Edit Role</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Modify the security credentials tied to this group.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="p-5 text-sm text-red-600 dark:text-red-400">
            {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Role Configuration</CardTitle>
          <CardDescription>
            Toggling configurations here will instantly apply to all assigned users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate}>
            <RoleForm
              values={values}
              onChange={setValues}
              permissionGroups={permissionGroups}
            />
            <div className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/roles")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Role"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
