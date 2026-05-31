import { formatInTimeZone } from 'date-fns-tz';
import { cs } from 'date-fns/locale';

export const PRAGUE_TZ = 'Europe/Prague';

/**
 * Today's date in Europe/Prague as `yyyy-MM-dd`.
 *
 * Used for both the menu-file lookup (server) and date display so that the app
 * has a single, timezone-stable notion of "today" regardless of where it runs
 * (Vercel/SSR is UTC, browsers are local). Pinning to Prague prevents the
 * 00:00–02:00 window from resolving to the previous day.
 */
export function getPragueDateString(): string {
  return formatInTimeZone(new Date(), PRAGUE_TZ, 'yyyy-MM-dd');
}

/** Long Czech date, e.g. "pátek 29. května". */
export function formatPragueLongDate(): string {
  return formatInTimeZone(new Date(), PRAGUE_TZ, 'EEEE d. MMMM', { locale: cs });
}

/** Time-of-day in Prague, e.g. "10:11", from an ISO timestamp. */
export function formatPragueTime(iso: string): string {
  return formatInTimeZone(new Date(iso), PRAGUE_TZ, 'HH:mm');
}
