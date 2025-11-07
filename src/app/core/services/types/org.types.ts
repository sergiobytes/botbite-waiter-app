export type RestaurantDetails = {
  id: string;
  name: string;
  logoUrl: string;
  isActive: boolean;
};

export type RestaurantsList = {
  restaurants: RestaurantDetails[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
  };
};
