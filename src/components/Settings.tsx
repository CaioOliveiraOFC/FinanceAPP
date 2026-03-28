import React, { useState, useRef } from 'react';
import { AppData } from '../types';
import { Trash2, Plus, Download, Upload, AlertTriangle, Edit2, Check, X } from 'lucide-react';

interface SettingsProps {
  data: AppData;
  updateData: (newData: Partial<AppData>) => void;
  exportBackup: () => void;
  importBackup: (json: string) => boolean;
  resetData: () => void;
}

export default function Settings({ data, updateData, exportBackup, importBackup, resetData }: SettingsProps) {
  const [newCat, setNewCat] = useState('');
  const [newOwner, setNewOwner] = useState('');
  
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatValue, setEditCatValue] = useState('');

  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [editOwnerValue, setEditOwnerValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addCategory = () => {
    if (newCat.trim() && !data.categories.includes(newCat.trim())) {
      updateData({ categories: [...data.categories, newCat.trim()] });
      setNewCat('');
    }
  };

  const removeCategory = (cat: string) => {
    const count = data.transactions.filter(t => t.category === cat).length;
    if (count > 0) {
      if (!window.confirm(`Esta categoria está sendo usada em ${count} transações. Tem certeza que deseja excluí-la?`)) {
        return;
      }
    }
    updateData({ categories: data.categories.filter(c => c !== cat) });
  };

  const startEditCategory = (cat: string) => {
    setEditingCat(cat);
    setEditCatValue(cat);
  };

  const saveEditCategory = (oldCat: string) => {
    const newCat = editCatValue.trim();
    if (!newCat || newCat === oldCat) {
      setEditingCat(null);
      return;
    }
    if (data.categories.includes(newCat)) {
      alert('Categoria já existe!');
      return;
    }
    
    const newCategories = data.categories.map(c => c === oldCat ? newCat : c);
    const newTransactions = data.transactions.map(t => 
      t.category === oldCat ? { ...t, category: newCat } : t
    );
    
    updateData({ categories: newCategories, transactions: newTransactions });
    setEditingCat(null);
  };

  const addOwner = () => {
    if (newOwner.trim() && !data.owners.includes(newOwner.trim())) {
      updateData({ owners: [...data.owners, newOwner.trim()] });
      setNewOwner('');
    }
  };

  const removeOwner = (owner: string) => {
    const count = data.transactions.filter(t => t.owner === owner || t.splits?.some(s => s.with === owner)).length;
    if (count > 0) {
      if (!window.confirm(`Este responsável está vinculado a ${count} transações/divisões. Tem certeza que deseja excluí-lo?`)) {
        return;
      }
    }
    updateData({ owners: data.owners.filter(o => o !== owner) });
  };

  const startEditOwner = (owner: string) => {
    setEditingOwner(owner);
    setEditOwnerValue(owner);
  };

  const saveEditOwner = (oldOwner: string) => {
    const newOwner = editOwnerValue.trim();
    if (!newOwner || newOwner === oldOwner) {
      setEditingOwner(null);
      return;
    }
    if (data.owners.includes(newOwner)) {
      alert('Responsável já existe!');
      return;
    }
    
    const newOwners = data.owners.map(o => o === oldOwner ? newOwner : o);
    const newTransactions = data.transactions.map(t => {
      let updated = { ...t };
      if (updated.owner === oldOwner) updated.owner = newOwner;
      if (updated.splits) {
        updated.splits = updated.splits.map(s => s.with === oldOwner ? { ...s, with: newOwner } : s);
      }
      return updated;
    });
    
    updateData({ owners: newOwners, transactions: newTransactions });
    setEditingOwner(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackup(content);
      if (success) {
        alert('Backup importado com sucesso!');
      } else {
        alert('Falha ao importar backup. Arquivo inválido.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Categorias */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              placeholder="Nova categoria..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button onClick={addCategory} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {data.categories.map(cat => {
              const count = data.transactions.filter(t => t.category === cat).length;
              const isEditing = editingCat === cat;

              return (
                <li key={cat} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group transition-colors border border-transparent hover:border-gray-100">
                  {isEditing ? (
                    <div className="flex items-center flex-1 mr-2">
                      <input
                        type="text"
                        value={editCatValue}
                        onChange={e => setEditCatValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEditCategory(cat)}
                        autoFocus
                        className="flex-1 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium">{cat}</span>
                      {count > 0 && <span className="text-xs text-gray-400">{count} transação(ões)</span>}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEditCategory(cat)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingCat(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditCategory(cat)} className="p-1.5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-blue-50">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeCategory(cat)} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Responsáveis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsáveis</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newOwner}
              onChange={e => setNewOwner(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addOwner()}
              placeholder="Novo responsável..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button onClick={addOwner} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {data.owners.map(owner => {
              const count = data.transactions.filter(t => t.owner === owner || t.splits?.some(s => s.with === owner)).length;
              const isEditing = editingOwner === owner;

              return (
                <li key={owner} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group transition-colors border border-transparent hover:border-gray-100">
                  {isEditing ? (
                    <div className="flex items-center flex-1 mr-2">
                      <input
                        type="text"
                        value={editOwnerValue}
                        onChange={e => setEditOwnerValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEditOwner(owner)}
                        autoFocus
                        className="flex-1 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium">{owner}</span>
                      {count > 0 && <span className="text-xs text-gray-400">{count} vínculo(s)</span>}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEditOwner(owner)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingOwner(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditOwner(owner)} className="p-1.5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-blue-50">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeOwner(owner)} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Backup e Reset */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup e Restauração</h3>
          <p className="text-sm text-gray-500 mb-4">Exporte seus dados para um arquivo JSON ou importe um backup existente.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={exportBackup} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
              <Download className="w-4 h-4 mr-2" /> Exportar JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
              <Upload className="w-4 h-4 mr-2" /> Importar JSON
            </button>
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" /> Danger Zone
          </h3>
          <p className="text-sm text-gray-500 mb-4">Esta ação apagará permanentemente todos os seus dados locais. Não pode ser desfeita.</p>
          <button onClick={resetData} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors">
            Apagar todos os dados
          </button>
        </div>
      </div>

    </div>
  );
}
