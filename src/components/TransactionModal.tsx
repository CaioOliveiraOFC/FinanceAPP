import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Transaction, Category, Owner } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
  initialData?: Transaction;
  categories: Category[];
  owners: Owner[];
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  owners,
}: TransactionModalProps) {
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [ownerId, setOwnerId] = useState(owners[0]?.id || '');

  // Campos de Parcela (Opcional)
  const [hasInstallment, setHasInstallment] = useState(false);
  const [currentInst, setCurrentInst] = useState('');
  const [totalInst, setTotalInst] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date);
        setTitle(initialData.title);
        setAmount(initialData.amount.toString());
        setType(initialData.type);
        setCategoryId(initialData.category_id);
        setOwnerId(initialData.owner_id);
        
        if (initialData.installment) {
          setHasInstallment(true);
          setCurrentInst(initialData.installment.current.toString());
          setTotalInst(initialData.installment.total.toString());
        } else {
          setHasInstallment(false);
          setCurrentInst('');
          setTotalInst('');
        }
      } else {
        // Reset form for new transaction
        setDate(new Date().toISOString().split('T')[0]);
        setTitle('');
        setAmount('');
        setType('expense');
        setCategoryId(categories[0]?.id || '');
        setOwnerId(owners[0]?.id || '');
        setHasInstallment(false);
        setCurrentInst('');
        setTotalInst('');
      }
    }
  }, [isOpen, initialData, categories, owners]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, insira um valor válido maior que zero.');
      return;
    }

    const transactionData: Omit<Transaction, 'id'> = {
      month_year: date.substring(0, 7),
      date,
      title: title.trim(),
      amount: numAmount,
      type,
      status: 'paid', // Default para novas transações
      category_id: categoryId,
      owner_id: ownerId,
      splits: null,
      installment: (hasInstallment && currentInst && totalInst)
        ? {
            current: parseInt(currentInst, 10),
            total: parseInt(totalInst, 10),
          }
        : null,
    };

    if (initialData) {
      // Modo Edição: preserva o ID e o split (se houver)
      onSave({ ...initialData, ...transactionData });
    } else {
      // Modo Criação
      onSave(transactionData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Editar Transação' : 'Nova Transação'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Tipo (Despesa / Receita) */}
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          {/* Parcelas Toggle */}
          <div className="pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasInstallment}
                onChange={(e) => setHasInstallment(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">É uma compra parcelada?</span>
            </label>
            
            {hasInstallment && (
              <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Parcela Atual</label>
                  <input
                    type="number"
                    min="1"
                    required={hasInstallment}
                    value={currentInst}
                    onChange={(e) => setCurrentInst(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Total de Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    required={hasInstallment}
                    value={totalInst}
                    onChange={(e) => setTotalInst(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
