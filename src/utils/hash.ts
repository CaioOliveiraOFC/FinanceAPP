export function generateTransactionId(date: string, title: string, amount: number): string {
  // Cria uma string única baseada na combinação de data, título e valor.
  // Usamos encodeURIComponent e btoa (Base64) para gerar um ID seguro e determinístico.
  // Se a mesma transação for importada duas vezes, o ID será idêntico.
  const rawString = `${date}|${title}|${amount}`;
  return btoa(encodeURIComponent(rawString));
}
