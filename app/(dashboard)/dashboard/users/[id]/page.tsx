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
import { UserForm, type UserFormValues } from "@/components/user-form";
import { getUser, updateUser } from "@/services/userService";
import { getRoles } from "@/services/roleService";
import { extractPaginated } from "@/lib/extract-paginated";
import type { Role } from "@/types/role";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params?.id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  const [values, setValues] = useState<UserFormValues>({
    name: "",
    email: "",
    roles: [],
  });

  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      try {
        const [rolesRes, userRes] = await Promise.all([
          getRoles({ page: 1, per_page: 100 }),
          getUser(userId),
        ]);

        const { data: rolesData } = extractPaginated<Role>(rolesRes);
        setAvailableRoles(rolesData);

        const userData = userRes.data?.data || userRes.data;
        const assignedRoles =
          userData.roles?.map((r: any) => Number(r.id ?? r)) || [];

        setValues({
          name: userData.name,
          email: userData.email,
          roles: assignedRoles,
        });
      } catch {
        setError("Failed to fetch member configuration.");
      } finally {
        setInitialLoading(false);
      }
    }
    
    void loadData();
  }, [userId]);

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateUser(userId, values);
      router.push("/dashboard/users");
      router.refresh();
    } catch {
      setError("Could not update member profile.");
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="text-zinc-500 text-sm">Loading security payload...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-content-grid max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Edit Member</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Modify administrative profile and access roles.
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
          <CardTitle>Profile Configuration</CardTitle>
          <CardDescription>
            Changes to security credentials apply immediately on save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate}>
            <UserForm
              values={values}
              onChange={setValues}
              availableRoles={availableRoles}
              isEdit={true}
            />
            <div className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/users")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
