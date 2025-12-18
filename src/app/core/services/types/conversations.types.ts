import { Branch } from './branches.types';

export interface ConversationsListResponse {
  conversations: Conversation[];
  total: number;
}

export interface Conversation {
  id: string;
  conversationId: string;
  branchId: string;
  location: string;
  lastOrderSentAt: Date;
  lastOrderSentToCashier: Record<
    string,
    { price: number; quantity: number; menuItemId: string; notes?: string }
  >;
  createdAt: Date;
  branch: Branch;
  customer: Customer;
}

export interface Customer {
  name: string;
}
