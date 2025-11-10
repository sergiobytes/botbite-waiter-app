export type Branch = {
  id: string;
  name: string;
  address: string;
  phoneNumberAssistant?: string | null;
  phoneNumberReception?: string | null;
  qrUrl?: string;
  availableMessages: number;
  isActive: boolean;
};

export type BranchListResponse = {
  branches: Branch[];
  total: number;
}
