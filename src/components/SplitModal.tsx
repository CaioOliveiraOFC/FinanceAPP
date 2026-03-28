import React, { useState, useEffect } from 'react';
import { X, Users, Percent } from 'lucide-react';
import { Transaction } from '../types';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  owners: string[];
  onApplySplit: (id: string, splitData: { with: string; percentage: number; amount: number } | undefined) => void;
}

export default function SplitModal({ isOpen, onClose, transaction, owners, onApplySplit }: SplitModalProps) {
  const [splitWith, setSplitWith] = useState('');
  const [percentage, setPercentage] = useState<number>(50);
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (isOpen && transaction) {
      if (transaction.split) {
        setSplitWith(transaction.split.with);
        setPercentage(transaction.split.percentage);
        setAmount(transaction.split.amount);
      } else {
        // Default: 50% split with the first available owner that is not the original owner
        const availableOwners = owners.filter(o => o !== transaction.owner);
        setSplitWith(availableOwners[0] || '');
        setPercentage(50);
        setAmount(transaction.amount * 0.5);
      }
    }
  }, [isOpen, transaction, owners]);

  // Atualiza o valor quando a porcentagem muda
  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setPercentage(val);
      if (transaction) {
        setAmount(transaction.amount * (val / 100));
      }
    }
  };

  // Atualiza a porcentagem quando o valor muda
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && transaction && val >= 0 && val <= transaction.amount) {
      setAmount(val);
      setPercentage((val / transaction.amount) * 100);
    }
  };

  if (!isOpen || !transaction) return null;

  const availableOwners = owners.filter(o => o !== transaction.owner);

  const handleSave = () => {
    if (!splitWith) {
      alert('Selecione com quem deseja dividir.');
      return;
    }
    onApplySplit(transaction.id, {
      with: splitWith,
      percentage: Number(percentage.toFixed(2)),
      amount: Number(amount.toFixed(2)),
    });
    onClose();
  };

  const handleRemove = () => {
    onApplySplit(transaction.id, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Dividir Conta</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
            <p className="text-gray-500 mb-1">Transação Original:</p>
            <p className="font-medium text-gray-900 truncate">{transaction.title}</p>
            <p className="font-semibold text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Paga por: {transaction.owner}</p>
          </div>

          {availableOwners.length === 0 ? (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              Você precisa cadastrar mais responsáveis nas Configurações para poder dividir contas.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dividir com:</label>
                <select
                  value={splitWith}
                  onChange={(e) => setSplitWith(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  {availableOwners.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentagem (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={percentage}
                      onChange={handlePercentageChange}
                      className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    max={transaction.amount}
                    step="0.01"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="pt-2 text-sm text-gray-600 text-center">
                {splitWith || 'Alguém'} vai te dever <strong className="text-gray-900">R$ {amount.toFixed(2)}</strong>.
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          {transaction.split ? (
            <button
              onClick={handleRemove}
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Remover Divisão
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
              disabled={availableOwners.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              Salvar Divisão
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
