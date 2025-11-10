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

export interface BranchListResponse {
  branches: Branch[];
  total: number;
}
