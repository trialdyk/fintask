/**
 * Formats a given Date, string, or number to Indonesian localized date format.
 * Example: "1 Januari 2026"
 * 
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatIndonesianDate(date: Date | string | number): string {
  if (!date) return '';
  
  const d = new Date(date);
  
  // Check for invalid date
  if (isNaN(d.getTime())) return '';
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
}

/**
 * Formats a given Date to a relative time string against now.
 * Useful for checking if a deadline is today, overdue, etc.
 */
export function getRelativeTimeLabel(date: Date | string | number): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    // Reset time for both to midnight for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Terlewat';
    if (diffDays === 0) return 'Hari Ini';
    if (diffDays === 1) return 'Besok';
    if (diffDays < 3) return '< 3 Hari';
    if (diffDays <= 7) return '1 Minggu';
    
    return formatIndonesianDate(d);
}
