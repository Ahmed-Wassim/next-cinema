"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleForm, type RoleFormValues } from "@/components/role-form";
import { createRole, getPermissions } from "@/services/roleService";
import type { PermissionGroup } from "@/types/role";

export default function CreateRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);

  const [values, setValues] = useState<RoleFormValues>({
    name: "",
    permissions: [],
  });

  useEffect(() => {
    async function loadPermissions() {
      try {
        const res = await getPermissions();
        const pRaw: any[][] = res.data?.data || res.data || [];
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
      } catch {
        setError("Failed to load permissions list.");
      }
    }
    loadPermissions();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createRole(values);
      router.push("/dashboard/roles");
      router.refresh();
    } catch {
      setError("Could not create role. Ensure the name is unique.");
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-content-grid max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Create Role</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Construct a new security policy group and assign permissions.
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
          <CardTitle>Role Details</CardTitle>
          <CardDescription>
            Specify the identifier and all associated capabilities for this role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate}>
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
                {loading ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
