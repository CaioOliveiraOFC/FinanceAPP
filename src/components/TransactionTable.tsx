import React, { useState } from 'react';
import { Search, Trash2, Edit3, CheckSquare, Square, Users, MoreHorizontal, X } from 'lucide-react';
import { Transaction } from '../types';
import { formatPeriod } from '../utils/date';
import TransactionDetailsModal from './TransactionDetailsModal';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: string[];
  owners: string[];
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onBatchUpdate: (ids: string[], updates: Partial<Transaction>) => void;
  onDelete: (ids: string[]) => void;
  onEditClick: (transaction: Transaction) => void;
  onSplitClick: (transaction: Transaction) => void;
  // Props de Filtro
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterMonth: string;
  setFilterMonth: (v: string) => void;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterOwner: string;
  setFilterOwner: (v: string) => void;
  availableMonths: string[];
}

export default function TransactionTable({
  transactions,
  categories,
  owners,
  onUpdate,
  onBatchUpdate,
  onDelete,
  onEditClick,
  onSplitClick,
  searchTerm,
  setSearchTerm,
  filterMonth,
  setFilterMonth,
  filterCategory,
  setFilterCategory,
  filterOwner,
  setFilterOwner,
  availableMonths,
}: TransactionTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchCategory, setBatchCategory] = useState('');
  const [batchOwner, setBatchOwner] = useState('');

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] = useState<Transaction | null>(null);

  const [confirmDeleteIds, setConfirmDeleteIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchApply = () => {
    if (selectedIds.size === 0) return;
    
    const updates: Partial<Transaction> = {};
    if (batchCategory) updates.category = batchCategory;
    if (batchOwner) updates.owner = batchOwner;
    
    if (Object.keys(updates).length > 0) {
      onBatchUpdate(Array.from(selectedIds), updates);
      setBatchCategory('');
      setBatchOwner('');
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      setConfirmDeleteIds(new Set(selectedIds));
    }
  };

  const confirmDeletion = () => {
    onDelete(Array.from(confirmDeleteIds));
    setSelectedIds(new Set());
    setConfirmDeleteIds(new Set());
  };

  const cancelDeletion = () => {
    setConfirmDeleteIds(new Set());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(value));
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleRowClick = (t: Transaction, e: React.MouseEvent) => {
    // Ignore clicks on buttons, inputs, or selects
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }

    if (t.installment || (t.splits && t.splits.length > 0)) {
      setSelectedTransactionForDetails(t);
      setDetailsModalOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      
      {/* Toolbar: Filtros */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar transação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          {/* Filtros Dropdowns */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[120px]"
            >
              <option value="">Todos os Meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{formatPeriod(m)}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[130px]"
            >
              <option value="">Todas Categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[120px]"
            >
              <option value="">Todos Responsáveis</option>
              {owners.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-blue-800">
              {selectedIds.size} selecionada(s)
            </span>
            <div className="flex items-center gap-2">
              {confirmDeleteIds.size > 0 && confirmDeleteIds.size === selectedIds.size ? (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded border border-red-200">
                  <span className="text-sm text-red-700 font-medium">Excluir {confirmDeleteIds.size}?</span>
                  <button onClick={confirmDeletion} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Sim</button>
                  <button onClick={cancelDeletion} className="px-2 py-1 bg-white text-gray-700 border border-gray-300 text-xs rounded hover:bg-gray-50">Não</button>
                </div>
              ) : (
                <>
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    className="px-2 py-1.5 text-sm border border-blue-200 rounded bg-white text-blue-900 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Alterar Categoria...</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  
                  <select
                    value={batchOwner}
                    onChange={(e) => setBatchOwner(e.target.value)}
                    className="px-2 py-1.5 text-sm border border-blue-200 rounded bg-white text-blue-900 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Alterar Responsável...</option>
                    {owners.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>

                  <button
                    onClick={handleBatchApply}
                    disabled={!batchCategory && !batchOwner}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Aplicar
                  </button>
                  
                  <div className="w-px h-6 bg-blue-200 mx-1"></div>
                  
                  <button
                    onClick={handleDeleteSelected}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Excluir selecionadas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-200">
            <tr className="text-gray-500 font-medium">
              <th className="px-4 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-blue-600 focus:outline-none">
                  {transactions.length > 0 && selectedIds.size === transactions.length ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 w-full">Título</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : (
              transactions.map((t) => {
                const isSelected = selectedIds.has(t.id);
                const isClickable = t.installment || (t.splits && t.splits.length > 0);
                return (
                  <tr 
                    key={t.id} 
                    onClick={(e) => handleRowClick(t, e)}
                    className={`group transition-colors ${isSelected ? 'bg-blue-50/30' : 'hover:bg-gray-50'} ${isClickable ? 'cursor-pointer' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(t.id)} className="text-gray-400 hover:text-blue-600 focus:outline-none">
                        {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 truncate max-w-[200px]" title={t.title}>
                          {t.title}
                        </span>
                        {t.installment && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                            {t.installment.current}/{t.installment.total}
                          </span>
                        )}
                        {t.splits && t.splits.length > 0 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800" title={`Dividido com ${t.splits.map(s => s.with).join(', ')}`}>
                            <Users className="w-3 h-3 mr-1" />
                            {t.splits.length > 1 ? 'Múltiplos' : `${t.splits[0].percentage}%`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.category}
                        onChange={(e) => onUpdate(t.id, { category: e.target.value })}
                        className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1 outline-none"
                      >
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.owner}
                        onChange={(e) => onUpdate(t.id, { owner: e.target.value })}
                        className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1 outline-none"
                      >
                        {owners.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${t.amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {t.amount > 0 ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onSplitClick(t)}
                          className={`p-1.5 rounded transition-colors ${t.splits && t.splits.length > 0 ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                          title="Dividir Conta"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditClick(t)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirmDeleteIds.has(t.id)) {
                              onDelete([t.id]);
                              const newSet = new Set(confirmDeleteIds);
                              newSet.delete(t.id);
                              setConfirmDeleteIds(newSet);
                            } else {
                              const newSet = new Set(confirmDeleteIds);
                              newSet.add(t.id);
                              setConfirmDeleteIds(newSet);
                            }
                          }}
                          className={`p-1.5 rounded transition-colors ${confirmDeleteIds.has(t.id) ? 'text-white bg-red-600 hover:bg-red-700' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                          title={confirmDeleteIds.has(t.id) ? "Confirmar exclusão" : "Excluir"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {confirmDeleteIds.has(t.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSet = new Set(confirmDeleteIds);
                              newSet.delete(t.id);
                              setConfirmDeleteIds(newSet);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TransactionDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        transaction={selectedTransactionForDetails}
      />
    </div>
  );
}
