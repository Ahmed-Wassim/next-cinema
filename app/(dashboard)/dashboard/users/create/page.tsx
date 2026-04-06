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
import { UserForm, type UserFormValues } from "@/components/user-form";
import { createUser } from "@/services/userService";
import { getRoles } from "@/services/roleService";
import { extractPaginated } from "@/lib/extract-paginated";
import type { Role } from "@/types/role";

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  const [values, setValues] = useState<UserFormValues>({
    name: "",
    email: "",
    password: "",
    roles: [],
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await getRoles({ page: 1, per_page: 100 });
        const { data } = extractPaginated<Role>(res);
        setAvailableRoles(data);
      } catch {
        setError("Failed to load organizational roles.");
      } finally {
        setLoadingRoles(false);
      }
    }
    loadConfig();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createUser(values);
      router.push("/dashboard/users");
      router.refresh();
    } catch {
      setError("Could not register user. Ensure the email is unique.");
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-content-grid max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Register Team Member</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Create an administrative account and bind it to specific roles.
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
          <CardTitle>Member Profile</CardTitle>
          <CardDescription>
            Specify credentials and access boundaries for this individual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate}>
            <UserForm
              values={values}
              onChange={setValues}
              availableRoles={availableRoles}
              loadingRoles={loadingRoles}
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
                {loading ? "Creating..." : "Create account"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
