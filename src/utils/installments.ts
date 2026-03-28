import { Transaction } from '../types';

export function generateInstallments(tx: Transaction): Transaction[] {
  if (!tx.installment || tx.installment.total <= 1) {
    return [tx];
  }

  const { current, total } = tx.installment;
  const installments: Transaction[] = [];
  
  // Usar T12:00:00Z para evitar que a mudança de mês caia em dia errado por fuso horário
  const baseDate = new Date(tx.date + 'T12:00:00Z');
  const cleanTitle = tx.title;
  const amount = tx.amount;

  for (let i = 1; i <= total; i++) {
    const monthOffset = i - current;
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + monthOffset);
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // ID determinístico: hash(titulo_limpo + valor_parcela + indice_parcela)
    const rawString = `${cleanTitle}|${amount}|${i}`;
    const id = btoa(encodeURIComponent(rawString));

    installments.push({
      ...tx,
      id,
      date: dateString,
      installment: {
        current: i,
        total: total,
      }
    });
  }

  return installments;
}
