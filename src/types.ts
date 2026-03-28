export interface Owner {
  id: string;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface MonthlyBudget {
  id: string;
  month_year: string;
  income: number;
}

export interface CategoryBudget {
  id: string;
  month_year: string;
  category_id: string;
  threshold: number;
}

export interface Installment {
  current: number;
  total: number;
}

export interface Split {
  with_owner_id: string;
  percentage: number;
  amount: number;
}

export interface Transaction {
  id: string;
  month_year: string;
  date: string; // Formato YYYY-MM-DD
  title: string;
  amount: number;
  type: 'expense' | 'income';
  status: 'paid' | 'pending';
  category_id: string;
  owner_id: string;
  installment?: Installment | null;
  splits?: Split[] | null;
}

export interface TransactionWithRefs extends Transaction {
  category?: Category;
  owner?: Owner;
}

export interface MonthSummary {
  total_income: number;
  total_expense: number;
  total_pending: number;
  balance: number;
}
