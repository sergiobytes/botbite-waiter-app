import { Pagination } from './common.types';

export interface Branch {
  id: string;
  name: string;
  address: string;
  phoneNumberAssistant?: string | null;
  phoneNumberReception?: string | null;
  qrUrl?: string | null;
  availableMessages: number;
  restaurantId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BranchResponse {
  branch: Branch;
  message: string;
}

export interface BranchListResponse {
  branches: Branch[];
  total: number;
  pagination: Pagination;
}

export interface BranchesBulkResponse {
  branches: Branch[];
  count: number;
  message: string;
}
