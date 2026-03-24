"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaginationMeta } from "@/types/pagination";

interface PaginationBarProps {
  meta: PaginationMeta;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export function PaginationBar({
  meta,
  perPage,
  onPageChange,
  onPerPageChange,
}: PaginationBarProps) {
  const { current_page, last_page } = meta;

  return (
    <div className="flex flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Page {current_page} of {last_page}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={current_page >= last_page}
          onClick={() => onPageChange(current_page + 1)}
        >
          Next
        </Button>
      </div>
      <div className="flex items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="per-page" className="text-xs">
            Per page
          </Label>
          <Input
            id="per-page"
            type="number"
            min={1}
            max={100}
            className="h-8 w-20"
            value={perPage}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n) && n > 0) onPerPageChange(n);
            }}
          />
        </div>
      </div>
    </div>
  );
}
