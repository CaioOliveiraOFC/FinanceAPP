export interface Transaction {
  id: string;
  date: string; // Formato YYYY-MM-DD
  title: string;
  amount: number; // Positivo = despesa, Negativo = receita (ou vice-versa, ajustaremos na UI)
  category: string;
  owner: string;
}

export interface AppData {
  transactions: Transaction[];
  categories: string[];
  owners: string[];
}
