import { supabase } from '../lib/supabaseClient';
import {
  Transaction,
  TransactionWithRefs,
  MonthlyBudget,
  CategoryBudget,
  Owner,
  Category
} from '../types';

// Leitura
export async function fetchTransactions(month_year: string): Promise<TransactionWithRefs[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*),
        owner:owners(*)
      `)
      .eq('month_year', month_year);

    if (error) throw error;
    return (data || []) as TransactionWithRefs[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

export async function fetchMonthlyBudget(month_year: string): Promise<MonthlyBudget | null> {
  try {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .select('*')
      .eq('month_year', month_year)
      .maybeSingle();

    if (error) throw error;
    return data as MonthlyBudget | null;
  } catch (error) {
    console.error('Error fetching monthly budget:', error);
    throw error;
  }
}

export async function fetchCategoryBudgets(month_year: string): Promise<CategoryBudget[]> {
  try {
    const { data, error } = await supabase
      .from('category_budgets')
      .select('*')
      .eq('month_year', month_year);

    if (error) throw error;
    return (data || []) as CategoryBudget[];
  } catch (error) {
    console.error('Error fetching category budgets:', error);
    throw error;
  }
}

export async function fetchOwners(): Promise<Owner[]> {
  try {
    const { data, error } = await supabase
      .from('owners')
      .select('*');

    if (error) throw error;
    return (data || []) as Owner[];
  } catch (error) {
    console.error('Error fetching owners:', error);
    throw error;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) throw error;
    return (data || []) as Category[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Transações CRUD
export async function addTransactions(txs: Transaction[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .upsert(txs, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding transactions:', error);
    throw error;
  }
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

export async function deleteTransactions(ids: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting transactions:', error);
    throw error;
  }
}

// Orçamento
export async function upsertMonthlyBudget(budget: MonthlyBudget): Promise<void> {
  try {
    const { error } = await supabase
      .from('monthly_budgets')
      .upsert(budget, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error upserting monthly budget:', error);
    throw error;
  }
}

export async function upsertCategoryBudget(budget: CategoryBudget): Promise<void> {
  try {
    const { error } = await supabase
      .from('category_budgets')
      .upsert(budget, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error upserting category budget:', error);
    throw error;
  }
}

// Owners e Categories (CRUD simples)
export async function addOwner(owner: Owner): Promise<void> {
  try {
    const { error } = await supabase
      .from('owners')
      .insert(owner);

    if (error) throw error;
  } catch (error) {
    console.error('Error adding owner:', error);
    throw error;
  }
}

export async function deleteOwner(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('owners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting owner:', error);
    throw error;
  }
}

export async function addCategory(category: Category): Promise<void> {
  try {
    const { error } = await supabase
      .from('categories')
      .insert(category);

    if (error) throw error;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

export default function useSupabase() {
  return {
    fetchTransactions,
    fetchMonthlyBudget,
    fetchCategoryBudgets,
    fetchOwners,
    fetchCategories,
    addTransactions,
    updateTransaction,
    deleteTransactions,
    upsertMonthlyBudget,
    upsertCategoryBudget,
    addOwner,
    deleteOwner,
    addCategory,
    deleteCategory,
  };
}
