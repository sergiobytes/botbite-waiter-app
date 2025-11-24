import { Pagination } from './common.types';

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  pagination: Pagination;
}
