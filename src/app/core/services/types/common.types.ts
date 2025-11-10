export type Mode = 'create' | 'edit' | null;

export type Pagination = {
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
};
