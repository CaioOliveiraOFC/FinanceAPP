import { useState, useMemo, useCallback } from 'react';
import { Transaction, AppData } from '../types';

export function useTransactions(
  data: AppData,
  updateData: (newData: Partial<AppData>) => void
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); // Formato YYYY-MM
  const [filterCategory, setFilterCategory] = useState('');
  const [filterOwner, setFilterOwner] = useState('');

  // 1. Lógica de Importação (Deduplicação)
  const importTransactions = useCallback(
    (newTransactions: Transaction[]) => {
      const existingIds = new Set(data.transactions.map((t) => t.id));
      const uniqueNewTransactions = newTransactions.filter((t) => !existingIds.has(t.id));

      if (uniqueNewTransactions.length > 0) {
        updateData({
          transactions: [...data.transactions, ...uniqueNewTransactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        });
      }
    },
    [data.transactions, updateData]
  );

  // 2. Lógica de Atualização (Inline e Batch)
  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      updateData({
        transactions: data.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      });
    },
    [data.transactions, updateData]
  );

  const batchUpdate = useCallback(
    (ids: string[], updates: Partial<Transaction>) => {
      const idSet = new Set(ids);
      updateData({
        transactions: data.transactions.map((t) => (idSet.has(t.id) ? { ...t, ...updates } : t)),
      });
    },
    [data.transactions, updateData]
  );

  const deleteTransactions = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      updateData({
        transactions: data.transactions.filter((t) => !idSet.has(t.id)),
      });
    },
    [data.transactions, updateData]
  );

  // 3. Lógica de Filtragem
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMonth = filterMonth ? t.date.startsWith(filterMonth) : true;
      const matchCategory = filterCategory ? t.category === filterCategory : true;
      const matchOwner = filterOwner ? t.owner === filterOwner : true;

      return matchSearch && matchMonth && matchCategory && matchOwner;
    });
  }, [data.transactions, searchTerm, filterMonth, filterCategory, filterOwner]);

  // Extrai meses únicos para o filtro (YYYY-MM)
  const availableMonths = useMemo(() => {
    const months = new Set(data.transactions.map((t) => t.date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [data.transactions]);

  return {
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
    updateTransaction,
    batchUpdate,
    deleteTransactions,
  };
}
