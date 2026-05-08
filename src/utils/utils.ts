import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(value: number | string): string {
  const number = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value;
  if (isNaN(number)) return '';
  return new Intl.NumberFormat('id-ID').format(number);
}

export function parseRupiah(value: string): number {
  const res = parseInt(value.replace(/\D/g, ''));
  return isNaN(res) ? 0 : res;
}
