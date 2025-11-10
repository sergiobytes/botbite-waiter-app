import { Pagination } from './common.types';

export type Restaurant = {
  id: string;
  name: string;
  logoUrl: string;
  isActive: boolean;
};

export type RestaurantListResponse = {
  restaurants: Restaurant[];
  total: number;
  pagination: Pagination;
};
