import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import { TransactionWithRefs, MonthlyBudget, CategoryBudget, Owner } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface DashboardProps {
  transactions: TransactionWithRefs[];
  monthlyBudget: MonthlyBudget | null;
  categoryBudgets: CategoryBudget[];
  owners: Owner[];
}

export default function Dashboard({ transactions, monthlyBudget, categoryBudgets, owners }: DashboardProps) {
  // Consideramos apenas despesas (type === 'expense') para os gráficos de gastos
  const expenses = useMemo(() => transactions.filter(t => t.type === 'expense'), [transactions]);

  // Total de despesas (soma bruta de todas as transações)
  const totalExpenses = useMemo(() => expenses.reduce((acc, t) => acc + t.amount, 0), [expenses]);

  // Gastos Reais por Responsável (Considerando Splits)
  const expensesByOwner = useMemo(() => {
    const map: Record<string, number> = {};

    expenses.forEach(t => {
      const ownerName = t.owner?.name || 'Desconhecido';
      
      if (t.splits && t.splits.length > 0) {
        const totalSplitPercentage = Math.min(
          100,
          t.splits.reduce((acc, s) => acc + s.percentage, 0)
        );
        const originalOwnerPercentage = Math.max(0, 100 - totalSplitPercentage);
        const ownerShare = (t.amount * originalOwnerPercentage) / 100;
        
        map[ownerName] = (map[ownerName] || 0) + ownerShare;
        
        // E as pessoas com quem dividiu pagam o valor do Split
        t.splits.forEach(s => {
          const splitOwner = owners.find(o => o.id === s.with_owner_id);
          const splitOwnerName = splitOwner ? splitOwner.name : 'Desconhecido';
          const splitAmount = (t.amount * s.percentage) / 100;
          map[splitOwnerName] = (map[splitOwnerName] || 0) + splitAmount;
        });
      } else {
        // Sem split, o owner paga 100%
        map[ownerName] = (map[ownerName] || 0) + t.amount;
      }
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, owners]);

  // Gastos por Categoria (A categoria da transação original se mantém)
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(t => {
      const catName = t.category?.name || 'Sem Categoria';
      map[catName] = (map[catName] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const sharedExpenses = useMemo(() => {
    return expenses.filter(t => t.splits && t.splits.length > 0);
  }, [expenses]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Gasto (Filtro Atual)</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Gastos Reais por Responsável (Considerando Divisões)</h3>
          <div className="flex flex-wrap gap-6">
            {expensesByOwner.map(owner => (
              <div key={owner.name} className="flex flex-col">
                <span className="text-sm text-gray-600">{owner.name}</span>
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(owner.value)}</span>
              </div>
            ))}
            {expensesByOwner.length === 0 && (
              <span className="text-sm text-gray-400">Nenhum dado no período.</span>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza: Categorias */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[400px] flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Gastos por Categoria</h3>
          <div className="flex-1 min-h-0">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Sem dados para exibir
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Barras: Responsáveis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[400px] flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Comparativo por Responsável</h3>
          <div className="flex-1 min-h-0">
            {expensesByOwner.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByOwner} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" tickFormatter={(val) => `R$ ${val}`} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Sem dados para exibir
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Despesas Compartilhadas */}
      {sharedExpenses.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-semibold text-gray-900">Despesas Compartilhadas</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedExpenses.map(tx => {
              const totalSplitPercentage = Math.min(
                100,
                tx.splits!.reduce((acc, s) => acc + s.percentage, 0)
              );
              const originalOwnerPercentage = Math.max(0, 100 - totalSplitPercentage);
              const originalOwnerAmount = (tx.amount * originalOwnerPercentage) / 100;

              return (
                <div key={tx.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-medium text-gray-900 truncate pr-2" title={tx.title}>{tx.title}</p>
                    <p className="font-bold text-gray-900">{formatCurrency(tx.amount)}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{tx.owner?.name || 'Desconhecido'} <span className="text-xs text-gray-400">(Pagador)</span></span>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">{originalOwnerPercentage.toFixed(1)}%</span>
                        <span className="text-gray-500 ml-2">({formatCurrency(originalOwnerAmount)})</span>
                      </div>
                    </div>
                    {tx.splits!.map((s, i) => {
                      const splitOwner = owners.find(o => o.id === s.with_owner_id);
                      const splitOwnerName = splitOwner ? splitOwner.name : 'Desconhecido';
                      const splitAmount = (tx.amount * s.percentage) / 100;
                      return (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-gray-600">{splitOwnerName}</span>
                          <div className="text-right">
                            <span className="font-medium text-purple-600">{s.percentage.toFixed(1)}%</span>
                            <span className="text-gray-500 ml-2">({formatCurrency(splitAmount)})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
