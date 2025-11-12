export type Mode = 'create' | 'edit' | null;

export type UserRole = 'super' | 'admin' | 'user' | 'client';
export interface Pagination {
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
}
