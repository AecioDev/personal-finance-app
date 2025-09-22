// in: interfaces/finance.ts

export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  uid: string;
  name: string;
  icon: string;
  type: CategoryType;
  defaultId?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number | null;
  icon?: string;
  uid: string;
  defaultId?: string;
  type: "checking" | "savings" | "credit_card" | "other";
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  uid: string;
  defaultAccountId?: string;
  defaultId?: string;
}
