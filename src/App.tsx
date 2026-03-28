import React, { useState } from 'react';
import { useStorage } from './hooks/useStorage';
import { useTransactions } from './hooks/useTransactions';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import CSVUploader from './components/CSVUploader';
import Settings from './components/Settings';
import TransactionModal from './components/TransactionModal';
import SplitModal from './components/SplitModal';
import { formatPeriod } from './utils/date';
import { LayoutDashboard, Settings as SettingsIcon, Wallet, Plus, FileSpreadsheet } from 'lucide-react';
import { Transaction } from './types';

type Tab = 'finance' | 'project';

export default function App() {
  const { data, updateData, exportBackup, importBackup, resetData, isLoaded } = useStorage();
  const txHooks = useTransactions(data, updateData);
  
  const [activeTab, setActiveTab] = useState<Tab>('finance');
  
  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | undefined>(undefined);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splittingTx, setSplittingTx] = useState<Transaction | null>(null);

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando...</div>;
  }

  const hasData = data.transactions.length > 0;

  const handleOpenNewTx = () => {
    setEditingTx(undefined);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleOpenSplit = (tx: Transaction) => {
    setSplittingTx(tx);
    setIsSplitModalOpen(true);
  };

  const handleSaveTx = (txData: Omit<Transaction, 'id'> | Transaction) => {
    if ('id' in txData) {
      // Modo Edição (o ID já existe)
      const { id, ...updates } = txData;
      txHooks.updateTransaction(id, updates);
    } else {
      // Modo Criação
      txHooks.addTransaction(txData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header / Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Wallet className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">FinanceApp</h1>
            </div>
            <nav className="flex space-x-2 items-center">
              <button
                onClick={() => setActiveTab('finance')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'finance' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Painel Financeiro
              </button>
              <button
                onClick={() => setActiveTab('project')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'project' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Gerenciar Projeto
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasData && activeTab === 'finance' ? (
          <div className="max-w-2xl mx-auto mt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bem-vindo ao FinanceApp</h2>
              <p className="text-gray-600 mb-8">
                Parece que você ainda não tem nenhuma transação. Comece importando sua fatura do Nubank (CSV) ou crie uma transação manualmente.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  onClick={handleOpenNewTx}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Transação
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-sm text-gray-500">Ou importe um arquivo</span>
                </div>
              </div>

              <div className="mt-8">
                <CSVUploader 
                  onImport={txHooks.importTransactions} 
                  defaultCategory={data.categories[0]}
                  defaultOwner={data.owners[0]}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 h-full">
            
            {/* ABA: PAINEL FINANCEIRO */}
            {activeTab === 'finance' && (
              <div className="space-y-8">
                
                {/* Dashboard Section */}
                <section>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Visão Geral</h2>
                    <div className="flex items-center bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                      <span className="text-sm font-medium text-gray-500 mr-3 ml-2">Período:</span>
                      <select
                        value={txHooks.filterMonth}
                        onChange={(e) => txHooks.setFilterMonth(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Todo o Período</option>
                        {txHooks.availableMonths.map((m) => (
                          <option key={m} value={m}>{formatPeriod(m)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Dashboard transactions={txHooks.filteredTransactions} />
                </section>

                {/* Transactions Section */}
                <section>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Transações</h2>
                    <div className="flex gap-3">
                      <button
                        onClick={handleOpenNewTx}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Transação
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-[600px] flex flex-col">
                    <TransactionTable
                      transactions={txHooks.filteredTransactions}
                      categories={data.categories}
                      owners={data.owners}
                      onUpdate={txHooks.updateTransaction}
                      onBatchUpdate={txHooks.batchUpdate}
                      onDelete={txHooks.deleteTransactions}
                      onEditClick={handleOpenEditTx}
                      onSplitClick={handleOpenSplit}
                      searchTerm={txHooks.searchTerm}
                      setSearchTerm={txHooks.setSearchTerm}
                      filterMonth={txHooks.filterMonth}
                      setFilterMonth={txHooks.setFilterMonth}
                      filterCategory={txHooks.filterCategory}
                      setFilterCategory={txHooks.setFilterCategory}
                      filterOwner={txHooks.filterOwner}
                      setFilterOwner={txHooks.setFilterOwner}
                      availableMonths={txHooks.availableMonths}
                    />
                  </div>
                </section>

                {/* Import Section (Bottom) */}
                <section className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Importar Fatura (CSV)
                  </h3>
                  <CSVUploader 
                    onImport={txHooks.importTransactions} 
                    defaultCategory={data.categories[0]}
                    defaultOwner={data.owners[0]}
                  />
                </section>

              </div>
            )}

            {/* ABA: GERENCIAR PROJETO */}
            {activeTab === 'project' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Gerenciar Projeto</h2>
                  <p className="text-gray-500 text-sm mb-6">Configure as categorias, responsáveis e gerencie seus backups locais.</p>
                </div>
                <Settings 
                  data={data}
                  updateData={updateData}
                  exportBackup={exportBackup}
                  importBackup={importBackup}
                  resetData={resetData}
                />
              </div>
            )}

          </div>
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTx}
        initialData={editingTx}
        categories={data.categories}
        owners={data.owners}
      />

      <SplitModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        transaction={splittingTx}
        owners={data.owners}
        onApplySplit={txHooks.applySplit}
      />

    </div>
  );
}
