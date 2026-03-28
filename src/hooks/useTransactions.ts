import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Transaction, TransactionWithRefs, Split } from '../types';
import { generateInstallments } from '../utils/installments';
import { parseTransactionTitle } from '../utils/parser';
import useSupabase from './useSupabase';

export function useTransactions() {
  const supabase = useSupabase();
  
  // Estado local (cache)
  const [transactions, setTransactions] = useState<TransactionWithRefs[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estado dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); // Formato YYYY-MM
  const [filterCategory, setFilterCategory] = useState('');
  const [filterOwner, setFilterOwner] = useState('');

  // Função centralizada para buscar dados do Supabase
  const isFetching = useRef(false);

  const fetchData = useCallback(async (month: string) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    try {
      const data = await supabase.fetchTransactions(month);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [supabase]);

  // Carrega transações quando o mês ativo muda
  useEffect(() => {
    if (filterMonth) {
      fetchData(filterMonth);
    }
  }, [filterMonth]); // Remova fetchData das dependências

  // 1. Lógica de Importação (Deduplicação)
  const importTransactions = useCallback(
    async (newTransactions: Transaction[]) => {
      setIsLoading(true);
      try {
        const expandedTransactions = newTransactions.flatMap(generateInstallments);
        
        if (expandedTransactions.length > 0) {
          await supabase.addTransactions(expandedTransactions);
          
          // Se importou algo do mês atual, refaz o fetch para sincronizar IDs e Refs
          if (expandedTransactions.some(t => t.month_year === filterMonth)) {
            await fetchData(filterMonth);
          }
        }
      } catch (error) {
        console.error('Failed to import transactions:', error);
        alert('Erro ao importar transações.');
      } finally {
        setIsLoading(false);
      }
    },
    [filterMonth, supabase, fetchData]
  );

  // 2. Lógica de Atualização (Inline e Batch)
  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id'>) => {
      // Para add, precisamos do ID gerado pelo banco ou gerar um temporário.
      // Como o ID é string, podemos gerar um temporário.
      const tempId = `temp_${Date.now()}`;
      const newTransaction: Transaction = {
        ...transaction,
        id: tempId,
      };
      
      const expandedTransactions = generateInstallments(newTransaction);
      
      // Optimistic update (apenas as do mês atual)
      const currentMonthTxs = expandedTransactions.filter(t => t.month_year === filterMonth);
      if (currentMonthTxs.length > 0) {
        setTransactions(prev => [...prev, ...currentMonthTxs as TransactionWithRefs[]]);
      }

      // Background update
      supabase.addTransactions(expandedTransactions).then(() => {
        // Após inserir, fazemos fetch para pegar os IDs reais e as Refs (category, owner)
        if (currentMonthTxs.length > 0) {
          fetchData(filterMonth);
        }
      }).catch(error => {
        console.error('Failed to add transaction:', error);
        alert('Erro ao adicionar transação.');
        // Reverte optimistic update
        if (currentMonthTxs.length > 0) {
          setTransactions(prev => prev.filter(t => !currentMonthTxs.map(ct => ct.id).includes(t.id)));
        }
      });
    },
    [filterMonth, supabase, fetchData]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      const originalTransaction = transactions.find(t => t.id === id);
      if (!originalTransaction) return;

      // Optimistic update
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } as TransactionWithRefs : t));

      // Background update
      supabase.updateTransaction(id, updates).then(() => {
        // Se mudou owner_id ou category_id, precisamos refetch para atualizar as refs (nomes/cores)
        if (updates.category_id || updates.owner_id) {
          fetchData(filterMonth);
        }
      }).catch(error => {
        console.error('Failed to update transaction:', error);
        alert('Erro ao atualizar transação.');
        // Reverte optimistic update
        setTransactions(prev => prev.map(t => t.id === id ? originalTransaction : t));
      });
    },
    [transactions, filterMonth, supabase, fetchData]
  );

  const batchUpdate = useCallback(
    (ids: string[], updates: Partial<Transaction>) => {
      // Guarda estado anterior para possível rollback
      const previousTransactions = [...transactions];

      // Optimistic update
      setTransactions(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...updates } as TransactionWithRefs : t));

      // Background update
      Promise.all(ids.map(id => supabase.updateTransaction(id, updates))).then(() => {
        if (updates.category_id || updates.owner_id) {
          fetchData(filterMonth);
        }
      }).catch(error => {
        console.error('Failed to batch update transactions:', error);
        alert('Erro ao atualizar transações em lote.');
        // Reverte optimistic update
        setTransactions(previousTransactions);
      });
    },
    [transactions, filterMonth, supabase, fetchData]
  );

  const deleteTransactions = useCallback(
    (ids: string[]) => {
      // Guarda estado anterior para possível rollback
      const previousTransactions = [...transactions];

      // Optimistic update
      setTransactions(prev => prev.filter(t => !ids.includes(t.id)));

      // Background update
      supabase.deleteTransactions(ids).catch(error => {
        console.error('Failed to delete transactions:', error);
        alert('Erro ao excluir transações.');
        // Reverte optimistic update
        setTransactions(previousTransactions);
      });
    },
    [transactions, supabase]
  );

  const applySplit = useCallback(
    (id: string, splitsData: Split[] | undefined) => {
      const originalTransaction = transactions.find(t => t.id === id);
      if (!originalTransaction) return;

      // Optimistic update
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, splits: splitsData || null } : t));

      // Background update
      supabase.updateTransaction(id, { splits: splitsData || null }).catch(error => {
        console.error('Failed to apply split:', error);
        alert('Erro ao aplicar divisão.');
        // Reverte optimistic update
        setTransactions(prev => prev.map(t => t.id === id ? originalTransaction : t));
      });
    },
    [transactions, supabase]
  );

  // 3. Lógica de Filtragem
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory ? t.category_id === filterCategory : true;
      const matchOwner = filterOwner ? t.owner_id === filterOwner : true;

      return matchSearch && matchCategory && matchOwner;
    });
  }, [transactions, searchTerm, filterCategory, filterOwner]);

  // Extrai meses únicos para o filtro (YYYY-MM)
  const availableMonths = useMemo(() => {
    const months = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthStr);
      date.setMonth(date.getMonth() - 1);
    }
    return months;
  }, []);

  // Define o mês inicial se não estiver setado
  useEffect(() => {
    if (!filterMonth && availableMonths.length > 0) {
      setFilterMonth(availableMonths[0]);
    }
  }, [filterMonth, availableMonths]);

  return {
    // Estado de carregamento
    isLoading,

    // Estado dos filtros
    searchTerm,
    setSearchTerm,
    filterMonth,
    setFilterMonth,
    filterCategory,
    setFilterCategory,
    filterOwner,
    setFilterOwner,
    availableMonths,

    // Dados filtrados
    filteredTransactions,

    // Ações
    importTransactions,
    addTransaction,
    updateTransaction,
    batchUpdate,
    deleteTransactions,
    applySplit,
    
    // Histórico
    undo: () => console.warn('Undo not implemented with Supabase yet'),
    redo: () => console.warn('Redo not implemented with Supabase yet'),
    canUndo: false,
    canRedo: false,
  };
}
