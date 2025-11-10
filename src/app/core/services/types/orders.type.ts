import { Category } from './category.types';

export type Order = {
  id: string;
  isActive: boolean;
  total: number;
  interactions: number;
  orderItems: OrderItem[];
};

export type OrderItem = {
  id: string;
  isActive: boolean;
  price: number;
  notes?: string;
  menuItem: MenuItem;
};

export type MenuItem = {
  id: string;
  isActive: boolean;
  price: number;
  category: Category;
  product: Product;
};

export type Product = {
  id: string;
  isActive: boolean;
  name: string;
  description?: string;
};

export type OrderListResponse = {
  orders: Order[];
  message: string;
};
