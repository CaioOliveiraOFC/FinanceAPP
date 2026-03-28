import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { UploadCloud, X, Check, AlertCircle, FileText } from 'lucide-react';
import { Transaction } from '../types';
import { generateTransactionId } from '../utils/hash';
import { parseTransactionTitle } from '../utils/parser';

interface CSVUploaderProps {
  onImport: (transactions: Transaction[]) => void;
  defaultCategory?: string;
  defaultOwner?: string;
}

export default function CSVUploader({
  onImport,
  defaultCategory = 'Outros',
  defaultOwner = 'Caio',
}: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Por favor, envie um arquivo CSV válido.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: Transaction[] = results.data.map((row: any, index) => {
            // Normaliza as chaves para minúsculo e remove espaços
            const normalizedRow = Object.keys(row).reduce((acc, key) => {
              acc[key.trim().toLowerCase()] = row[key];
              return acc;
            }, {} as any);

            const date = normalizedRow.date;
            const rawTitle = normalizedRow.title;
            const amountStr = normalizedRow.amount;

            if (!date || !rawTitle || amountStr === undefined) {
              throw new Error(`Linha ${index + 2} inválida. Certifique-se de que o cabeçalho contém: date, title, amount.`);
            }

            // Trata possíveis vírgulas no lugar de pontos para decimais (padrão BR)
            const amount = parseFloat(String(amountStr).replace(',', '.'));

            if (isNaN(amount)) {
              throw new Error(`Valor inválido na linha ${index + 2}.`);
            }

            const { cleanTitle, installment } = parseTransactionTitle(rawTitle);

            return {
              id: generateTransactionId(date, rawTitle, amount), // Usa o rawTitle para o hash manter a unicidade
              date,
              title: cleanTitle,
              amount,
              category: defaultCategory,
              owner: defaultOwner,
              installment,
            };
          });

          setParsedTransactions(transactions);
          setShowPreview(true);
        } catch (err: any) {
          setError(err.message || 'Erro ao processar o arquivo CSV.');
        }
      },
      error: (err) => {
        setError(`Erro no parsing: ${err.message}`);
      },
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      // Reseta o input para permitir upload do mesmo arquivo novamente se necessário
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const confirmImport = () => {
    onImport(parsedTransactions);
    setShowPreview(false);
    setParsedTransactions([]);
  };

  const cancelImport = () => {
    setShowPreview(false);
    setParsedTransactions([]);
  };

  return (
    <div className="w-full">
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ease-in-out
          ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
        `}
      >
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">
          Clique para fazer upload ou arraste um arquivo CSV
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Formato esperado: date, title, amount
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Preview da Importação</h3>
              </div>
              <button onClick={cancelImport} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Table */}
            <div className="overflow-auto p-6 flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Encontramos <strong>{parsedTransactions.length}</strong> transações válidas. 
                Transações duplicadas (mesma data, título e valor) serão ignoradas automaticamente.
              </p>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Título</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedTransactions.slice(0, 5).map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-600">{t.date}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {t.title}
                          {t.installment && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {t.installment.current}/{t.installment.total}
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${t.amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {t.amount > 0 ? '-' : '+'}{Math.abs(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedTransactions.length > 5 && (
                  <div className="bg-gray-50 px-4 py-3 text-center text-sm text-gray-500 border-t border-gray-100">
                    E mais {parsedTransactions.length - 5} transações...
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
              <button
                onClick={cancelImport}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar Importação
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
