export interface ParsedTitle {
  cleanTitle: string;
  installment?: {
    current: number;
    total: number;
  };
}

export function parseTransactionTitle(title: string): ParsedTitle {
  // Regex para detectar parcelas no final da string, ex: " 1/5", "- 01/12", " - 2/10"
  const installmentRegex = /\s-?\s?(\d{1,2})\/(\d{1,2})$/;
  const match = title.match(installmentRegex);

  if (match) {
    const current = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    
    // Remove a parte da parcela do título original e limpa espaços extras
    const cleanTitle = title.replace(installmentRegex, '').trim();

    return {
      cleanTitle,
      installment: { current, total },
    };
  }

  return { cleanTitle: title.trim() };
}
