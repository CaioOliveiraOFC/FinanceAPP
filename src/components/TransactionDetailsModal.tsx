import React from 'react';
import { X, FileText, Users, Calendar } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export default function TransactionDetailsModal({ isOpen, onClose, transaction }: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalSplitAmount = transaction.splits?.reduce((acc, s) => acc + s.amount, 0) || 0;
  const originalOwnerAmount = Math.max(0, transaction.amount - totalSplitAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Detalhes da Transação</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Info Básica */}
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">{transaction.title}</h4>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(transaction.amount)}</p>
            <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
              <span>{transaction.date}</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded-full">{transaction.category}</span>
            </div>
          </div>

          {/* Parcelamento */}
          {transaction.installment && transaction.installment.total > 1 && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center mb-2">
                <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                <h5 className="font-semibold text-blue-900">Parcelamento</h5>
              </div>
              <p className="text-blue-800">
                Parcela <span className="font-bold">{transaction.installment.current}</span> de <span className="font-bold">{transaction.installment.total}</span>
              </p>
            </div>
          )}

          {/* Divisão (Splits) */}
          {transaction.splits && transaction.splits.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="flex items-center mb-3">
                <Users className="w-4 h-4 text-purple-600 mr-2" />
                <h5 className="font-semibold text-purple-900">Divisão de Custos</h5>
              </div>
              
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-purple-800 font-medium">{transaction.owner} (Pagador)</span>
                  <span className="font-bold text-purple-900">{formatCurrency(originalOwnerAmount)}</span>
                </li>
                {transaction.splits.map((split, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-purple-700">{split.with}</span>
                    <span className="font-semibold text-purple-800">{formatCurrency(split.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
