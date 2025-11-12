/**
 * Singapore Timezone Utilities
 * All date/time operations must use Singapore timezone (Asia/Singapore, UTC+8)
 */

const SINGAPORE_TIMEZONE = 'Asia/Singapore';

/**
 * Get current time in Singapore timezone
 */
export function getSingaporeNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
}

/**
 * Format date in Singapore timezone
 */
export function formatSingaporeDate(date: Date): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: SINGAPORE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Parse ISO string to Singapore timezone Date
 */
export function parseSingaporeDate(isoString: string): Date {
  const date = new Date(isoString);
  return new Date(date.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
}

/**
 * Check if date is in the past (Singapore timezone)
 */
export function isInPast(date: Date): boolean {
  const now = getSingaporeNow();
  return date < now;
}

/**
 * Add time to date in Singapore timezone
 */
export function addTime(date: Date, amount: number, unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'): Date {
  const result = new Date(date);
  
  switch (unit) {
    case 'minutes':
      result.setMinutes(result.getMinutes() + amount);
      break;
    case 'hours':
      result.setHours(result.getHours() + amount);
      break;
    case 'days':
      result.setDate(result.getDate() + amount);
      break;
    case 'weeks':
      result.setDate(result.getDate() + (amount * 7));
      break;
    case 'months':
      result.setMonth(result.getMonth() + amount);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + amount);
      break;
  }
  
  return result;
}

/**
 * Calculate next recurrence date
 */
export function calculateNextRecurrence(
  currentDueDate: Date,
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Date {
  const next = new Date(currentDueDate);
  
  switch (pattern) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}
