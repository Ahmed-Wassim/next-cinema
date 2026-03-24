export interface Hall {
  id: number;
  branch_id: number;
  name: string;
  type: string;
  total_seats?: number;
  layout_type?: string;
}
