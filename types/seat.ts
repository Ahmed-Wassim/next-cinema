export interface Seat {
  id: number;
  hall_section_id: number;
  row_label?: string;
  col_label?: string;
  label?: string;
  status?: string;
  [key: string]: unknown;
}
