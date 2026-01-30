export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  amountCents: number;
  category: string;
  note?: string;
  createdAt: number;
  dayKey: string; // YYYY-MM-DD
}
