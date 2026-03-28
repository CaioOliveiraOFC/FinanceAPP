import { useState, useCallback } from 'react';
import { Transaction } from '../types';

export function useHistory(
  currentTransactions: Transaction[],
  updateTransactions: (txs: Transaction[]) => void
) {
  const [past, setPast] = useState<Transaction[][]>([]);
  const [future, setFuture] = useState<Transaction[][]>([]);

  const pushState = useCallback(() => {
    setPast((prev) => {
      const newPast = [...prev, currentTransactions];
      // Limite: past.slice(-20) — máximo 20 estados.
      return newPast.slice(-20);
    });
    setFuture([]); // Limpa o futuro ao fazer uma nova mutação
  }, [currentTransactions]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    
    const previousState = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setPast(newPast);
    setFuture((prev) => [currentTransactions, ...prev]);
    
    updateTransactions(previousState);
  }, [past, currentTransactions, updateTransactions]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    
    const nextState = future[0];
    const newFuture = future.slice(1);
    
    setPast((prev) => [...prev, currentTransactions]);
    setFuture(newFuture);
    
    updateTransactions(nextState);
  }, [future, currentTransactions, updateTransactions]);

  return {
    pushState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
