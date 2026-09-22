import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, parseISO, isWithinInterval, getDay } from 'date-fns';
import type { PausePeriod, Rate } from '../types';

export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start, end });
}

export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  const d = subMonths(new Date(year, month), 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  const d = addMonths(new Date(year, month), 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function isDateInRange(date: Date, start: string, end: string): boolean {
  const d = parseISO(dateKey(date));
  const s = parseISO(start);
  const e = parseISO(end);
  return isWithinInterval(d, { start: s, end: e });
}

export function isDatePaused(date: Date, pauses: PausePeriod[], serviceId: string): boolean {
  return pauses.some(p =>
    p.serviceId === serviceId && isDateInRange(date, p.startDate, p.endDate)
  );
}

export function isScheduledDay(date: Date, weekdays: number[]): boolean {
  return weekdays.includes(getDay(date));
}

export function getApplicableRate(serviceId: string, rates: Rate[], date: Date): Rate | undefined {
  const d = dateKey(date);
  return rates
    .filter(r => {
      if (r.serviceId !== serviceId) return false;
      const from = r.effectiveFrom;
      const to = r.effectiveTo ?? '9999-12-31';
      return d >= from && d <= to;
    })
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}
