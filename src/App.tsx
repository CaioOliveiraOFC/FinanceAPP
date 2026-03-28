import React, { useState } from 'react';
import { useStorage } from './hooks/useStorage';
import { useTransactions } from './hooks/useTransactions';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import CSVUploader from './components/CSVUploader';
import Settings from './components/Settings';
import { LayoutDashboard, List, Settings as SettingsIcon, Wallet } from 'lucide-react';

type Tab = 'dashboard' | 'transactions' | 'settings';

export default function App() {
  const { data, updateData, exportBackup, importBackup, resetData, isLoaded } = useStorage();
  const txHooks = useTransactions(data, updateData);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando...</div>;
  }

  const hasData = data.transactions.length > 0;

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
            <nav className="flex space-x-1 sm:space-x-4 items-center">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'transactions' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Transações</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <SettingsIcon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Configurações</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasData && activeTab !== 'settings' ? (
          <div className="max-w-2xl mx-auto mt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bem-vindo ao FinanceApp</h2>
              <p className="text-gray-600 mb-8">
                Parece que você ainda não tem nenhuma transação. Comece importando sua fatura do Nubank (CSV) para visualizar seus gastos.
              </p>
              <CSVUploader 
                onImport={(txs) => {
                  txHooks.importTransactions(txs);
                  setActiveTab('transactions');
                }} 
                defaultCategory={data.categories[0]}
                defaultOwner={data.owners[0]}
              />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 h-full">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* O Dashboard respeita os filtros da tabela para sincronia */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Filtro de Período:</span>
                  <select
                    value={txHooks.filterMonth}
                    onChange={(e) => txHooks.setFilterMonth(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Todo o Período</option>
                    {txHooks.availableMonths.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <Dashboard transactions={txHooks.filteredTransactions} />
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="h-[calc(100vh-12rem)] flex flex-col space-y-4">
                <div className="flex-shrink-0">
                  <CSVUploader 
                    onImport={txHooks.importTransactions} 
                    defaultCategory={data.categories[0]}
                    defaultOwner={data.owners[0]}
                  />
                </div>
                <div className="flex-1 min-h-0">
                  <TransactionTable
                    transactions={txHooks.filteredTransactions}
                    categories={data.categories}
                    owners={data.owners}
                    onUpdate={txHooks.updateTransaction}
                    onBatchUpdate={txHooks.batchUpdate}
                    onDelete={txHooks.deleteTransactions}
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
              </div>
            )}

            {activeTab === 'settings' && (
              <Settings 
                data={data}
                updateData={updateData}
                exportBackup={exportBackup}
                importBackup={importBackup}
                resetData={resetData}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
