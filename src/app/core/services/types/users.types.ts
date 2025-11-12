import { Pagination, UserRole } from './common.types';

export interface UserRow {
  id: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: UserRow[];
  total: number;
  pagination: Pagination;
}

export interface RegisterUserDto {
  email: string;
  password: string;
}
