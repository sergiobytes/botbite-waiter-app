export type OrderDetails = {
  id: string;
  isActive: boolean;
  total: number;
  interactions: number;
  orderItems: OrderItemDetails[];
};

export type OrderItemDetails = {
  id: string;
  isActive: boolean;
  price: number;
  notes?: string;
  menuItem: MenuItemDetails;
};

export type MenuItemDetails = {
  id: string;
  isActive: boolean;
  price: number;
  category: CategoryDetails;
  product: ProductDetails;
};

export type CategoryDetails = {
  id: string;
  isActive: boolean;
  name: string;
  description?: string;
};

export type ProductDetails = {
  id: string;
  isActive: boolean;
  name: string;
  description?: string;
};

export type OrdersList = {
  orders: OrderDetails[];
  message: string;
};
