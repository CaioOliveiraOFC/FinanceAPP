import { useState, useCallback } from 'react';
import { AppData } from '../types';

export function useHistory() {
  const [past, setPast] = useState<AppData[]>([]);
  const [future, setFuture] = useState<AppData[]>([]);

  const pushState = useCallback((currentState: AppData) => {
    setPast((prev) => {
      const newPast = [...prev, currentState];
      // Limite: past.slice(-20) — máximo 20 estados.
      return newPast.slice(-20);
    });
    setFuture([]); // Limpa o futuro ao fazer uma nova mutação
  }, []);

  const undo = useCallback((currentState: AppData, applyData: (data: AppData) => void) => {
    if (past.length === 0) return;
    
    const previousState = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setPast(newPast);
    setFuture((prev) => [currentState, ...prev]);
    
    applyData(previousState);
  }, [past]);

  const redo = useCallback((currentState: AppData, applyData: (data: AppData) => void) => {
    if (future.length === 0) return;
    
    const nextState = future[0];
    const newFuture = future.slice(1);
    
    setPast((prev) => [...prev, currentState]);
    setFuture(newFuture);
    
    applyData(nextState);
  }, [future]);

  return {
    pushState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
