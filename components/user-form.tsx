"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/types/role";

export type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  roles: number[];
};

export function UserForm({
  values,
  onChange,
  availableRoles,
  loadingRoles,
  isEdit = false,
}: {
  values: UserFormValues;
  onChange: (value: UserFormValues) => void;
  availableRoles: Role[];
  loadingRoles?: boolean;
  isEdit?: boolean;
}) {
  const toggleRole = (id: number, checked: boolean) => {
    const numId = Number(id);
    if (checked) {
      onChange({ ...values, roles: [...values.roles, numId] });
    } else {
      onChange({
        ...values,
        roles: values.roles.filter((rId) => Number(rId) !== numId),
      });
    }
  };

  return (
    <div className="grid gap-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="u-name">Full Name</Label>
          <Input
            id="u-name"
            value={values.name}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            required
            placeholder="e.g. John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-email">Email Address</Label>
          <Input
            id="u-email"
            type="email"
            value={values.email}
            onChange={(e) => onChange({ ...values, email: e.target.value })}
            required
            placeholder="name@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-pass">
            Password{" "}
            {isEdit && (
              <span className="text-zinc-400 font-normal text-xs ml-1">
                (leave blank to keep current)
              </span>
            )}
          </Label>
          <Input
            id="u-pass"
            type="password"
            value={values.password || ""}
            onChange={(e) => onChange({ ...values, password: e.target.value })}
            required={!isEdit}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Label>Assigned Roles</Label>
        {loadingRoles ? (
          <div className="text-sm text-zinc-500 py-2">Loading core roles...</div>
        ) : availableRoles.length === 0 ? (
          <div className="text-sm text-zinc-400 py-2 italic">
            No organizational roles configured.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2 sm:grid-cols-2">
            {availableRoles.map((r) => {
              const rId = Number(r.id);
              return (
                <div
                  key={rId}
                  className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm bg-zinc-50/50 dark:bg-zinc-900/20"
                >
                  <Checkbox
                    id={`role-${rId}`}
                    checked={values.roles.includes(rId)}
                    onCheckedChange={(c: boolean | "indeterminate") =>
                      toggleRole(rId, c === true)
                    }
                  />
                  <div className="space-y-1 leading-none w-full">
                    <Label
                      htmlFor={`role-${rId}`}
                      className="cursor-pointer text-sm font-medium"
                    >
                      {r.name}
                    </Label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
