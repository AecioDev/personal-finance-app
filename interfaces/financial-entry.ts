// in: interfaces/financial-entry.ts

export type EntryType = "income" | "expense";
export type EntryStatus = "pending" | "paid" | "overdue";
export type RecurrenceFrequency =
  | "installment"
  | "weekly"
  | "monthly"
  | "yearly";

// Esta é a "Regra" que será salva em uma nova coleção no Firestore.
export interface FinancialRecurrence {
  id: string;
  uid: string;

  // Dados do "molde" para os lançamentos que serão gerados
  description: string;
  expectedAmount: number;
  type: EntryType;
  categoryId: string;
  notes?: string;

  // Regras da Recorrência
  frequency: RecurrenceFrequency;
  startDate: Date;

  // Controles para o fim da recorrência
  totalOccurrences?: number; // Usado para parcelamentos
  endDate?: Date; // Data final opcional

  // Controle de Status
  isActive: boolean;
  createdAt: Date;
}

export interface FinancialEntry {
  /** The unique identifier for the entry. */
  id: string;

  /** The ID of the user who owns this entry. */
  uid: string;

  /** A description of the entry. E.g., "Car Payment," "Salary," "Netflix." */
  description: string;

  /** Additional free-form text for notes. */
  notes?: string;

  /** The type of the entry: income or expense. */
  type: EntryType;

  /** The current status: pending, paid, or overdue. */
  status: EntryStatus;

  // --- Forecasted Values ---
  /** The original or expected amount of the entry. */
  expectedAmount: number;

  /** The due date or expected date of the transaction. */
  dueDate: Date;

  // --- Realized Values ---
  /** The amount that was actually paid or received. Null if still pending. */
  paidAmount: number | null;

  /** The date the payment was made or received. Null if still pending. */
  paymentDate: Date | null;

  // --- Links & Categories ---
  /** The ID of the associated account (bank, wallet). */
  accountId?: string;

  /** The ID of the category (housing, transport, etc.). */
  categoryId?: string;

  /** The ID of the payment method (credit card, bank slip, etc.). */
  paymentMethodId?: string | null;

  // --- Installment & Recurrence Control ---
  /** If this entry is part of a series (loan, monthly bill), all entries in the series share this ID. */
  recurrenceId?: string;

  /** The current installment number. E.g., 3 */
  installmentNumber?: number;

  /** The total number of installments in the series. E.g., 48 */
  totalInstallments?: number;

  /** The timestamp when the record was created in the system. */
  createdAt?: Date;
}
