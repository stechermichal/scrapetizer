import { format, getDay } from 'date-fns';
import { cs } from 'date-fns/locale';

export const czechDays = [
  'neděle',
  'pondělí',
  'úterý',
  'středa',
  'čtvrtek',
  'pátek',
  'sobota'
] as const;

export const czechDaysShort = [
  'ne',
  'po',
  'út',
  'st',
  'čt',
  'pá',
  'so'
] as const;

// URL-friendly versions (no diacritics)
export const czechDaysUrl = [
  'nedele',
  'pondeli',
  'utery',
  'streda',
  'ctvrtek',
  'patek',
  'sobota'
] as const;

export function getCurrentCzechDay(): string {
  const dayIndex = getDay(new Date());
  return czechDays[dayIndex];
}

export function getCurrentCzechDayUrl(): string {
  const dayIndex = getDay(new Date());
  return czechDaysUrl[dayIndex];
}

export function formatCzechDate(date: Date): string {
  return format(date, 'EEEE d. M.', { locale: cs });
}

export function isWeekday(date: Date = new Date()): boolean {
  const day = getDay(date);
  return day >= 1 && day <= 5; // Monday to Friday
}