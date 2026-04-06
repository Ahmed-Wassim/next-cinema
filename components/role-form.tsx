"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PermissionGroup } from "@/types/role";

export type RoleFormValues = {
  name: string;
  permissions: number[];
};

export function RoleForm({
  values,
  onChange,
  permissionGroups,
}: {
  values: RoleFormValues;
  onChange: (value: RoleFormValues) => void;
  permissionGroups: PermissionGroup[];
}) {
  const togglePermission = (id: number, checked: boolean) => {
    const numId = Number(id);
    if (checked) {
      onChange({ ...values, permissions: [...values.permissions, numId] });
    } else {
      onChange({
        ...values,
        permissions: values.permissions.filter((pId) => Number(pId) !== numId),
      });
    }
  };

  const toggleGroup = (groupIndex: number, checked: boolean) => {
    const groupPerms = permissionGroups[groupIndex].permissions.map((p) =>
      Number(p.id)
    );
    if (checked) {
      const newPerms = Array.from(
        new Set([...values.permissions, ...groupPerms])
      );
      onChange({ ...values, permissions: newPerms });
    } else {
      onChange({
        ...values,
        permissions: values.permissions.filter(
          (id) => !groupPerms.includes(Number(id))
        ),
      });
    }
  };

  return (
    <div className="grid gap-6">
      <div className="space-y-2">
        <Label htmlFor="r-name">Role Name</Label>
        <Input
          id="r-name"
          placeholder="e.g. Manager"
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          required
        />
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label>Assign Permissions</Label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:gap-6">
          {permissionGroups.map((group, gIdx) => {
            const groupPermIds = group.permissions.map((p) => Number(p.id));
            const allSelected =
              groupPermIds.length > 0 &&
              groupPermIds.every((id) =>
                values.permissions.includes(id)
              );
            const someSelected =
              groupPermIds.some((id) => values.permissions.includes(id)) &&
              !allSelected;

            return (
              <div
                key={group.group}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <Checkbox
                    id={`group-${gIdx}`}
                    checked={
                      allSelected ? true : someSelected ? "indeterminate" : false
                    }
                    onCheckedChange={(c: boolean | "indeterminate") =>
                      toggleGroup(gIdx, c === true)
                    }
                  />
                  <Label
                    htmlFor={`group-${gIdx}`}
                    className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-xs tracking-wider cursor-pointer"
                  >
                    {group.group}
                  </Label>
                </div>
                <div className="space-y-3">
                  {group.permissions.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`perm-${perm.id}`}
                        checked={values.permissions.includes(Number(perm.id))}
                        onCheckedChange={(c: boolean | "indeterminate") =>
                          togglePermission(Number(perm.id), c === true)
                        }
                      />
                      <Label
                        htmlFor={`perm-${perm.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-600 dark:text-zinc-300 font-normal cursor-pointer"
                      >
                        {perm.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
