export type Mode = 'create' | 'edit' | null;

export interface Pagination {
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
}
