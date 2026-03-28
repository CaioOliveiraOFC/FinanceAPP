import React, { useState } from 'react';
import { Category, Owner } from '../types';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SettingsProps {
  categories: Category[];
  owners: Owner[];
}

export default function Settings({ categories, owners }: SettingsProps) {
  const [newCat, setNewCat] = useState('');
  const [newOwner, setNewOwner] = useState('');
  
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatValue, setEditCatValue] = useState('');

  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [editOwnerValue, setEditOwnerValue] = useState('');

  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [confirmDeleteOwner, setConfirmDeleteOwner] = useState<string | null>(null);

  const addCategory = async () => {
    if (newCat.trim() && !categories.find(c => c.name === newCat.trim())) {
      await supabase.from('categories').insert({ id: `cat_${Date.now()}`, name: newCat.trim() });
      setNewCat('');
      window.location.reload();
    }
  };

  const removeCategory = async (cat: Category) => {
    if (confirmDeleteCategory !== cat.id) {
      setConfirmDeleteCategory(cat.id);
      return;
    }
    await supabase.from('categories').delete().eq('id', cat.id);
    setConfirmDeleteCategory(null);
    window.location.reload();
  };

  const startEditCategory = (cat: Category) => {
    setEditingCat(cat.id);
    setEditCatValue(cat.name);
  };

  const saveEditCategory = async (cat: Category) => {
    const newName = editCatValue.trim();
    if (!newName || newName === cat.name) {
      setEditingCat(null);
      return;
    }
    if (categories.find(c => c.name === newName)) {
      alert('Categoria já existe!');
      return;
    }
    
    await supabase.from('categories').update({ name: newName }).eq('id', cat.id);
    setEditingCat(null);
    window.location.reload();
  };

  const addOwner = async () => {
    if (newOwner.trim() && !owners.find(o => o.name === newOwner.trim())) {
      await supabase.from('owners').insert({ id: `owner_${Date.now()}`, name: newOwner.trim(), color: '#6366f1' });
      setNewOwner('');
      window.location.reload();
    }
  };

  const removeOwner = async (owner: Owner) => {
    if (confirmDeleteOwner !== owner.id) {
      setConfirmDeleteOwner(owner.id);
      return;
    }
    await supabase.from('owners').delete().eq('id', owner.id);
    setConfirmDeleteOwner(null);
    window.location.reload();
  };

  const startEditOwner = (owner: Owner) => {
    setEditingOwner(owner.id);
    setEditOwnerValue(owner.name);
  };

  const saveEditOwner = async (owner: Owner) => {
    const newName = editOwnerValue.trim();
    if (!newName || newName === owner.name) {
      setEditingOwner(null);
      return;
    }
    if (owners.find(o => o.name === newName)) {
      alert('Responsável já existe!');
      return;
    }
    
    await supabase.from('owners').update({ name: newName }).eq('id', owner.id);
    setEditingOwner(null);
    window.location.reload();
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
            {categories.map(cat => {
              const isEditing = editingCat === cat.id;

              return (
                <li key={cat.id} className="flex flex-col p-2 hover:bg-gray-50 rounded-lg group transition-colors border border-transparent hover:border-gray-100">
                  {confirmDeleteCategory === cat.id ? (
                    <div className="flex flex-col space-y-2 w-full">
                      <span className="text-sm text-red-600 font-medium">Excluir "{cat.name}"?</span>
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => removeCategory(cat)} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Confirmar</button>
                        <button onClick={() => setConfirmDeleteCategory(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
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
                          <span className="text-gray-700 font-medium">{cat.name}</span>
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
                    </div>
                  )}
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
            {owners.map(owner => {
              const isEditing = editingOwner === owner.id;

              return (
                <li key={owner.id} className="flex flex-col p-2 hover:bg-gray-50 rounded-lg group transition-colors border border-transparent hover:border-gray-100">
                  {confirmDeleteOwner === owner.id ? (
                    <div className="flex flex-col space-y-2 w-full">
                      <span className="text-sm text-red-600 font-medium">Excluir "{owner.name}"?</span>
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => removeOwner(owner)} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Confirmar</button>
                        <button onClick={() => setConfirmDeleteOwner(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
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
                          <span className="text-gray-700 font-medium">{owner.name}</span>
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
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
