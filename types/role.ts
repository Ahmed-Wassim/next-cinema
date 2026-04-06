export interface PermissionGroup {
  group: string;
  permissions: {
    id: number;
    label: string;
    name?: string;
  }[];
}

export interface Role {
  id: number;
  name: string;
  permissions_count?: number;
  // Included when fetching single role
  permissions?: { id: number; name: string }[];
}
