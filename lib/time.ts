export const TAIPEI_TIME_ZONE = 'Asia/Taipei';

export function taipeiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TAIPEI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function taipeiHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', {
    timeZone: TAIPEI_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(date));
}

export function taipeiDayRange(date = new Date()) {
  const key = taipeiDateKey(date);
  const start = new Date(`${key}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 86_400_000);
  return { key, start, end };
}

export function taipeiLastDays(count: number, date = new Date()) {
  const safeCount = Math.max(1, Math.min(31, Math.floor(count)));
  const today = taipeiDayRange(date).start;
  return Array.from({ length: safeCount }, (_, index) => {
    const start = new Date(today.getTime() - (safeCount - 1 - index) * 86_400_000);
    const key = taipeiDateKey(start);
    const label = new Intl.DateTimeFormat('zh-TW', {
      timeZone: TAIPEI_TIME_ZONE,
      weekday: 'short'
    }).format(start);
    return { key, start, end: new Date(start.getTime() + 86_400_000), label };
  });
}
