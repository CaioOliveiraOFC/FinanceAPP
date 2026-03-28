import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard({ transactions }: { transactions: Transaction[] }) {
  // Consideramos apenas despesas (amount > 0) para os gráficos de gastos
  const expenses = useMemo(() => transactions.filter(t => t.amount > 0), [transactions]);

  const totalExpenses = useMemo(() => expenses.reduce((acc, t) => acc + t.amount, 0), [expenses]);

  const expensesByOwner = useMemo(() => {
    const map = expenses.reduce((acc, t) => {
      acc[t.owner] = (acc[t.owner] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const expensesByCategory = useMemo(() => {
    const map = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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
          <h3 className="text-sm font-medium text-gray-500 mb-3">Gastos por Responsável</h3>
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
    </div>
  );
}
