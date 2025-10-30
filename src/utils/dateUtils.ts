/**
 * Formats a Date object to YYYY-MM-DD string in local timezone
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string and validates it's a real date
 * Returns null if invalid (e.g., Feb 30, Month 13)
 */
export function parseDateString(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  
  if (month < 0 || month > 11) return null;
  if (day < 1 || day > 31) return null;
  
  const date = new Date(year, month, day);
  
  // Verify date didn't roll over (catches Feb 31 → Mar 3)
  if (date.getFullYear() !== year || 
      date.getMonth() !== month || 
      date.getDate() !== day) {
    return null;
  }
  
  return date;
}

/**
 * Validates a date string is real and properly formatted
 */
export function isValidDateString(dateStr: string): boolean {
  return parseDateString(dateStr) !== null;
}



/**
 * Validates HH:MM time format and semantic validity
 */
export function isValidTimeString(timeStr: string): boolean {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Validates that end time is after start time (same day comparison)
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
    return false;
  }
  return startTime < endTime;
}