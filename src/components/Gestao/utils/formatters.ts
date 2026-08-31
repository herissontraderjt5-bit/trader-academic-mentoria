/**
 * Formats a number to Currency (BRL: R$ 1.234,56 | USD: $ 1,234.56 | EUR: € 1.234,56)
 */
export function formatCurrency(
  value: number,
  showSign = false,
  currency: 'BRL' | 'USD' | 'EUR' | string = 'BRL'
): string {
  const symbol = getCurrencySymbol(currency);
  if (isNaN(value) || value === null || value === undefined) {
    return `${symbol} 0,00`;
  }
  
  const curr = currency === 'USD' ? 'USD' : currency === 'EUR' ? 'EUR' : 'BRL';
  const locale = curr === 'USD' ? 'en-US' : 'pt-BR';

  const sign = showSign && value > 0 ? '+' : '';
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (value < 0) {
    return `- ${formatted}`;
  }
  return `${sign}${formatted}`;
}

export function getCurrencySymbol(currency: 'BRL' | 'USD' | 'EUR' | string = 'BRL'): string {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'BRL':
    default:
      return 'R$';
  }
}

/**
 * Formats percentage (e.g., 87% or 124.5%)
 */
export function formatPercent(value: number, decimals = 1, showSign = false): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Formats seconds into HH:MM:SS
 */
export function formatSecondsToTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const hh = h < 10 ? `0${h}` : `${h}`;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  
  return `${hh}:${mm}:${ss}`;
}

/**
 * Formats seconds into short string e.g. "01h 45m" or "25m 30s"
 */
export function formatSecondsShort(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

/**
 * Formats ISO date "YYYY-MM-DD" to "DD/MM/YYYY"
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Formats ISO date "YYYY-MM-DD" to "DD/MM"
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

/**
 * Get current date string in "YYYY-MM-DD"
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time string in "HH:MM"
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Portuguese Month Names
 */
export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTH_SHORT_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

/**
 * Get Month Name in Portuguese
 */
export function getMonthNameBR(monthId: string): string {
  if (!monthId) return '';
  const [year, month] = monthId.split('-');
  const monthNum = parseInt(month, 10) - 1;
  return `${MONTH_NAMES_PT[monthNum] || ''} de ${year}`;
}

/**
 * Get Previous Month ID (YYYY-MM)
 */
export function getPreviousMonthId(monthId: string): string {
  if (!monthId) return getTodayDateString().slice(0, 7);
  const [yearStr, monthStr] = monthId.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Get Next Month ID (YYYY-MM)
 */
export function getNextMonthId(monthId: string): string {
  if (!monthId) return getTodayDateString().slice(0, 7);
  const [yearStr, monthStr] = monthId.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Get all 12 months for a given year
 */
export function getMonthsForYear(year: number): { id: string; name: string; shortName: string; month: number; year: number }[] {
  return MONTH_NAMES_PT.map((name, index) => {
    const monthNum = index + 1;
    const id = `${year}-${String(monthNum).padStart(2, '0')}`;
    return {
      id,
      name: `${name} de ${year}`,
      shortName: MONTH_SHORT_PT[index],
      month: monthNum,
      year,
    };
  });
}
