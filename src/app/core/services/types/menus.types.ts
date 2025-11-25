import { Category } from './category.types';
import { Product } from './products.types';

export interface Menu {
  id: string;
  name: string;
  pdfLink?: string;
  menuItems?: MenuItem[];
  isActive: boolean;
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

export interface MenuResponse {
  menu: Menu;
  message: string;
}

export interface MenuListResponse {
  menus: Menu[];
  message: string;
}

export interface MenuItemResponse {
  menuItem: MenuItem;
  message: string;
}

export interface MenuItemListResponse {
  items: MenuItem[];
  message: string;
}
