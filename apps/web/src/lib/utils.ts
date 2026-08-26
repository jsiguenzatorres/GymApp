import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea moneda en USD */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea fecha en español.
 * Por defecto usa timeZone: 'UTC' para que un ISO string literal (ej. el que
 * viene de la API, construido sin conversión real de zona horaria) se
 * muestre tal cual, sin que el navegador del operador lo reinterprete con su
 * propia zona horaria. El caller puede sobrescribir `timeZone` en `options`
 * si necesita mostrar la hora local real del navegador.
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(date));
}
