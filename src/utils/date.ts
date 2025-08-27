export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekRange(weekString: string) {
  if (!weekString) return { start: '', end: '' };
  const [year, week] = weekString.split('-W').map(Number);
  if (isNaN(year) || isNaN(week)) return { start: '', end: '' };
  const start = new Date(year, 0, 1 + (week - 1) * 7);
  while (start.getDay() !== 0) {
    start.setDate(start.getDate() - 1);
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: toISODateString(start), end: toISODateString(end) };
}

export function getMonthRange(monthString: string) {
  if (!monthString) return { start: '', end: '' };
  const [year, month] = monthString.split('-').map(Number);
  if (isNaN(year) || isNaN(month)) return { start: '', end: '' };
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: toISODateString(start), end: toISODateString(end) };
}
