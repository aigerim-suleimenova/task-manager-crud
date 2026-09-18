const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Formats a `yyyy-MM-dd` due-date string as e.g. "Oct 28, 2024" via plain string
 * parsing — never via `Date`/`DatePipe`, whose local-time parsing and timezone
 * conversion can shift a date-only value onto the wrong calendar day.
 */
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) {
    return '—';
  }
  const [year, month, day] = dueDate.split('-').map(Number);
  const monthName = MONTH_ABBREVIATIONS[month - 1] ?? '';
  return `${monthName} ${day}, ${year}`;
}
