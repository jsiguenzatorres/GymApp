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

/** Formatea fecha en español */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    ...options,
  }).format(new Date(date));
}
