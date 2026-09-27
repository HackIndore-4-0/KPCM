import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number | undefined | null): string {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTokens(tokens: number | undefined | null): string {
  if (tokens == null) return '0';
  return tokens.toLocaleString('en-US');
}

export function maskRef(ref: string): string {
  if (!ref || ref.length <= 4) return ref;
  return '•'.repeat(ref.length - 4) + ref.slice(-4);
}
