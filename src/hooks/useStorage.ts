import { useState, useEffect, useCallback } from 'react';
import { AppData } from '../types';

const STORAGE_KEY = 'finance_app_data';

const DEFAULT_CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Outros'];
const DEFAULT_OWNERS = ['Caio', 'Família'];

const defaultData: AppData = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  owners: DEFAULT_OWNERS,
};

export function useStorage() {
  // Inicialização lazy para ler do localStorage apenas no primeiro render
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Garante que a estrutura básica exista mesmo se o JSON for antigo/incompleto
        return {
          transactions: parsed.transactions || [],
          categories: parsed.categories || DEFAULT_CATEGORIES,
          owners: parsed.owners || DEFAULT_OWNERS,
        };
      }
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
    }
    return defaultData;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Marca como carregado após o mount para evitar hidratação incorreta (se fosse SSR)
  // e para sabermos que podemos começar a salvar as mutações.
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Auto-save: sincroniza com o localStorage sempre que `data` mudar
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updateData = useCallback((newData: Partial<AppData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  const importBackup = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData) as Partial<AppData>;
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        setData({
          transactions: parsed.transactions,
          categories: parsed.categories || DEFAULT_CATEGORIES,
          owners: parsed.owners || DEFAULT_OWNERS,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      return false;
    }
  }, []);

  const resetData = useCallback(() => {
    if (window.confirm('Tem certeza? Isso apagará TODOS os seus dados localmente.')) {
      localStorage.clear();
      updateData({ transactions: [], categories: [], owners: [] });
    }
  }, [updateData]);

  return {
    data,
    updateData,
    exportBackup,
    importBackup,
    resetData,
    isLoaded,
  };
}
