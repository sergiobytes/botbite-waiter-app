import { Category } from './category.types';
import { Product } from './products.types';

export interface Order {
  id: string;
  total: number;
  interactions: number;
  customerId: string;
  branchId: string;
  orderItems: OrderItem[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OrderItem {
  id: string;
  price: number;
  notes?: string | null;
  menuItem: MenuItem;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MenuItem {
  id: string;
  price: number;
  category: Category;
  product: Product;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OrderListResponse {
  orders: Order[];
  message: string;
}
