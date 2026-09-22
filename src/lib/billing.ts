import type { DeliveryRecord, PausePeriod, Rate, Service, Payment, MonthlyHisaab, BillingSummary } from '../types';
import { getMonthDays, dateKey, isDatePaused, isScheduledDay, getApplicableRate } from './dates';

export function calculateMilkBill(
  service: Service,
  records: DeliveryRecord[],
  rates: Rate[],
  pauses: PausePeriod[],
  year: number,
  month: number
): BillingSummary {
  const days = getMonthDays(year, month);
  let billableQuantity = 0;
  let subtotalMinor = 0;
  let latestRateMinor = 0;

  for (const day of days) {
    if (isDatePaused(day, pauses, service.id)) continue;
    const record = records.find(r => r.serviceId === service.id && r.date === dateKey(day));
    if (record && record.status === 'delivered') {
      const applicableRate = getApplicableRate(service.id, rates, day);
      const dayRateMinor = applicableRate?.amountMinor ?? 0;
      if (dayRateMinor) latestRateMinor = dayRateMinor;
      billableQuantity += record.quantity;
      subtotalMinor += Math.round(record.quantity * dayRateMinor);
    }
  }

  if (!latestRateMinor && days.length > 0) {
    const fallbackRate = getApplicableRate(service.id, rates, days[days.length - 1]) || getApplicableRate(service.id, rates, days[0]);
    latestRateMinor = fallbackRate?.amountMinor ?? 0;
  }

  return {
    period: `${year}-${String(month + 1).padStart(2, '0')}`,
    serviceName: service.name,
    serviceType: 'milk',
    billableQuantity,
    unit: service.unit,
    rateMinor: latestRateMinor,
    subtotalMinor,
  };
}

export function calculateNewspaperBill(
  service: Service,
  records: DeliveryRecord[],
  rates: Rate[],
  pauses: PausePeriod[],
  year: number,
  month: number
): BillingSummary {
  const days = getMonthDays(year, month);
  let billableDays = 0;
  let subtotalMinor = 0;
  let latestRateMinor = 0;

  for (const day of days) {
    if (isDatePaused(day, pauses, service.id)) continue;
    if (!isScheduledDay(day, service.scheduledWeekdays)) continue;

    const record = records.find(r => r.serviceId === service.id && r.date === dateKey(day));
    if (record && record.status === 'delivered') {
      const applicableRate = getApplicableRate(service.id, rates, day);
      const dayRateMinor = applicableRate?.amountMinor ?? 0;
      if (dayRateMinor) latestRateMinor = dayRateMinor;
      billableDays += 1;
      subtotalMinor += dayRateMinor;
    }
  }

  if (!latestRateMinor && days.length > 0) {
    const fallbackRate = getApplicableRate(service.id, rates, days[days.length - 1]) || getApplicableRate(service.id, rates, days[0]);
    latestRateMinor = fallbackRate?.amountMinor ?? 0;
  }

  return {
    period: `${year}-${String(month + 1).padStart(2, '0')}`,
    serviceName: service.name,
    serviceType: 'newspaper',
    billableQuantity: billableDays,
    unit: 'days',
    rateMinor: latestRateMinor,
    subtotalMinor,
  };
}

export function calculateMonthlyHisaab(
  services: Service[],
  records: DeliveryRecord[],
  rates: Rate[],
  pauses: PausePeriod[],
  payments: Payment[],
  year: number,
  month: number
): MonthlyHisaab {
  const period = `${year}-${String(month + 1).padStart(2, '0')}`;
  const summaries: BillingSummary[] = [];

  for (const service of services) {
    if (!service.enabled) continue;
    if (service.type === 'milk') {
      summaries.push(calculateMilkBill(service, records, rates, pauses, year, month));
    } else {
      summaries.push(calculateNewspaperBill(service, records, rates, pauses, year, month));
    }
  }

  const totalMinor = summaries.reduce((sum, s) => sum + s.subtotalMinor, 0);
  const paidMinor = payments
    .filter(p => p.billingPeriod === period)
    .reduce((sum, p) => sum + p.amountMinor, 0);
  const dueMinor = Math.max(totalMinor - paidMinor, 0);

  return { period, summaries, totalMinor, paidMinor, dueMinor };
}

export function formatCurrency(minorUnits: number): string {
  const rupees = Math.floor(minorUnits / 100);
  const paise = minorUnits % 100;
  return paise > 0 ? `₹${rupees.toLocaleString('en-IN')}.${paise}` : `₹${rupees.toLocaleString('en-IN')}`;
}
