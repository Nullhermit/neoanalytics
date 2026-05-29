export type Row = Record<string, string | number | null>;
export type ColumnType = "numeric" | "categorical" | "date";
export interface Column {
  name: string;
  type: ColumnType;
}
export interface Dataset {
  name: string;
  rows: Row[];
  columns: Column[];
}