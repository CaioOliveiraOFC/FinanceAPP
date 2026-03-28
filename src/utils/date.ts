export function formatPeriod(period: string): string {
  if (!period) return '';
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
  const formatted = formatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
