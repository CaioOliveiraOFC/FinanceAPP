import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, Percent, Plus, Trash2 } from 'lucide-react';
import { Transaction, Owner, Split } from '../types';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  owners: Owner[];
  onApplySplit: (id: string, splitsData: Split[] | undefined) => void;
}

interface SplitEntry {
  id: string;
  with_owner_id: string;
  percentage: number;
  amount: number;
}

export default function SplitModal({ isOpen, onClose, transaction, owners, onApplySplit }: SplitModalProps) {
  const [splits, setSplits] = useState<SplitEntry[]>([]);

  const availableOwners = useMemo(() => {
    if (!transaction) return [];
    return owners.filter(o => o.id !== transaction.owner_id);
  }, [transaction, owners]);

  useEffect(() => {
    if (isOpen && transaction) {
      if (transaction.splits && transaction.splits.length > 0) {
        setSplits(transaction.splits.map((s, i) => ({ ...s, id: `split-${i}` })));
      } else {
        // Default: 1 split with 50%
        if (availableOwners.length > 0) {
          setSplits([{
            id: 'split-0',
            with_owner_id: availableOwners[0].id,
            percentage: 50,
            amount: transaction.amount * 0.5
          }]);
        } else {
          setSplits([]);
        }
      }
    }
  }, [isOpen, transaction, availableOwners]);

  if (!isOpen || !transaction) return null;

  const totalSplitPercentage = splits.reduce((acc, s) => acc + s.percentage, 0);
  const originalOwnerPercentage = Math.max(0, 100 - totalSplitPercentage);
  const originalOwnerAmount = (transaction.amount * originalOwnerPercentage) / 100;

  const isInvalid = totalSplitPercentage > 100;

  const handleAddSplit = () => {
    const remainingPercentage = Math.max(0, 100 - totalSplitPercentage);
    const newPercentage = remainingPercentage > 0 ? remainingPercentage : 0;
    const newAmount = transaction.amount * (newPercentage / 100);
    
    // Find an owner that is not already in the splits if possible
    const usedOwnerIds = new Set(splits.map(s => s.with_owner_id));
    const nextOwner = availableOwners.find(o => !usedOwnerIds.has(o.id)) || availableOwners[0];

    setSplits([...splits, {
      id: `split-${Date.now()}`,
      with_owner_id: nextOwner.id,
      percentage: newPercentage,
      amount: newAmount
    }]);
  };

  const handleRemoveSplit = (id: string) => {
    setSplits(splits.filter(s => s.id !== id));
  };

  const handleUpdateSplit = (id: string, field: 'with_owner_id' | 'percentage' | 'amount', value: string | number) => {
    setSplits(splits.map(s => {
      if (s.id !== id) return s;

      const updated = { ...s, [field]: value };

      if (field === 'percentage') {
        const val = value as number;
        updated.amount = transaction.amount * (val / 100);
      } else if (field === 'amount') {
        const val = value as number;
        updated.percentage = (val / transaction.amount) * 100;
      }

      return updated;
    }));
  };

  const handleSave = () => {
    if (isInvalid) return;
    
    if (splits.length === 0) {
      onApplySplit(transaction.id, undefined);
    } else {
      const cleanSplits = splits.map(({ with_owner_id, percentage, amount }) => ({
        with_owner_id,
        percentage: Number(percentage.toFixed(2)),
        amount: Number(amount.toFixed(2))
      }));
      onApplySplit(transaction.id, cleanSplits);
    }
    onClose();
  };

  const handleRemoveAll = () => {
    onApplySplit(transaction.id, undefined);
    onClose();
  };

  const handleSplitEqually = () => {
    if (splits.length === 0) return;
    
    // Total people = original owner + people in splits
    const totalPeople = splits.length + 1;
    const equalPercentage = 100 / totalPeople;
    const equalAmount = transaction.amount / totalPeople;

    const newSplits = splits.map((split) => ({
      ...split,
      percentage: equalPercentage,
      amount: equalAmount
    }));

    setSplits(newSplits);
  };

  // Helper para mostrar o nome do owner original
  const originalOwnerName = owners.find(o => o.id === transaction.owner_id)?.name || transaction.owner_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Dividir Conta</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-gray-500 text-sm mb-1">Transação Original:</p>
                <p className="font-medium text-gray-900">{transaction.title}</p>
              </div>
              <p className="font-bold text-lg text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Parte de {originalOwnerName} (Pagador):</span>
              <div className="text-right">
                <span className={`text-sm font-bold ${isInvalid ? 'text-red-600' : 'text-purple-600'}`}>
                  {originalOwnerPercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalOwnerAmount)})
                </span>
              </div>
            </div>
            {isInvalid && (
              <p className="text-xs text-red-600 mt-2 text-right">A soma das divisões ultrapassa 100%.</p>
            )}
          </div>

          {availableOwners.length === 0 ? (
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
              Você precisa cadastrar mais responsáveis nas Configurações para poder dividir contas.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-900">Divisões (Splits)</h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleSplitEqually}
                    disabled={splits.length === 0}
                    className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center disabled:opacity-50"
                  >
                    Dividir Igualmente
                  </button>
                  <button
                    onClick={handleAddSplit}
                    disabled={isInvalid || availableOwners.length === 0}
                    className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </button>
                </div>
              </div>

              {splits.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma divisão configurada.</p>
              ) : (
                <div className="space-y-3">
                  {splits.map((split) => (
                    <div key={split.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex-1">
                        <select
                          value={split.with_owner_id}
                          onChange={(e) => handleUpdateSplit(split.id, 'with_owner_id', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50"
                        >
                          {availableOwners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </div>
                      <div className="w-24 relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={split.percentage === 0 ? '' : Number(split.percentage.toFixed(2))}
                          onChange={(e) => handleUpdateSplit(split.id, 'percentage', parseFloat(e.target.value) || 0)}
                          className="w-full pl-3 pr-7 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                        <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={split.amount === 0 ? '' : Number(split.amount.toFixed(2))}
                          onChange={(e) => handleUpdateSplit(split.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveSplit(split.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
          {transaction.splits && transaction.splits.length > 0 ? (
            <button
              onClick={handleRemoveAll}
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Remover Todos
            </button>
          ) : (
            <div /> // Spacer
          )}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isInvalid || availableOwners.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              Salvar Divisões
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
