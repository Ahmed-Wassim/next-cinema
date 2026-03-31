import type { BulkSeatItem } from "@/types/seat-bulk";

export const LAYOUT_DRAFT_STORAGE_KEY = "cinema_layout_draft_v1";

export type LayoutDraftV1 = {
  v: 1;
  hallId: number;
  tierId: number;
  seats: BulkSeatItem[];
};

export function saveLayoutDraft(draft: Omit<LayoutDraftV1, "v">) {
  const payload: LayoutDraftV1 = { v: 1, ...draft };
  sessionStorage.setItem(LAYOUT_DRAFT_STORAGE_KEY, JSON.stringify(payload));
}

export function consumeLayoutDraft(): LayoutDraftV1 | null {
  try {
    const raw = sessionStorage.getItem(LAYOUT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(LAYOUT_DRAFT_STORAGE_KEY);
    const data = JSON.parse(raw) as LayoutDraftV1;
    if (data?.v !== 1 || !Array.isArray(data.seats)) return null;
    return data;
  } catch {
    return null;
  }
}
