import type { DeliveryRecord, PausePeriod, Rate, Service, Payment, MonthlyHisaab, BillingSummary } from '../types';
import { getMonthDays, dateKey, isDatePaused, isScheduledDay, getApplicableRate } from './dates';

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
    const days = getMonthDays(year, month);
    let billableQuantity = 0;
    let subtotalMinor = 0;
    let latestRateMinor = 0;

    for (const day of days) {
      if (isDatePaused(day, pauses, service.id)) continue;
      if (service.type === 'newspaper' && !isScheduledDay(day, service.scheduledWeekdays)) continue;
      const record = records.find(r => r.serviceId === service.id && r.date === dateKey(day));
      if (record && record.status === 'delivered') {
        const applicableRate = getApplicableRate(service.id, rates, day);
        const dayRateMinor = applicableRate?.amountMinor ?? 0;
        if (dayRateMinor) latestRateMinor = dayRateMinor;
        const qty = service.type === 'milk' ? record.quantity : 1;
        billableQuantity += qty;
        subtotalMinor += Math.round(qty * dayRateMinor);
      }
    }

    if (!latestRateMinor && days.length > 0) {
      const fallbackRate = getApplicableRate(service.id, rates, days[days.length - 1]) || getApplicableRate(service.id, rates, days[0]);
      latestRateMinor = fallbackRate?.amountMinor ?? 0;
    }

    summaries.push({
      period,
      serviceName: service.name,
      serviceType: service.type,
      billableQuantity,
      unit: service.type === 'milk' ? service.unit : 'days',
      rateMinor: latestRateMinor,
      subtotalMinor,
    });
  }

  const totalMinor = summaries.reduce((sum, s) => sum + s.subtotalMinor, 0);
  const paidMinor = payments.filter(p => p.billingPeriod === period).reduce((sum, p) => sum + p.amountMinor, 0);
  const dueMinor = Math.max(totalMinor - paidMinor, 0);

  return { period, summaries, totalMinor, paidMinor, dueMinor };
}

export function formatCurrency(minorUnits: number): string {
  const rupees = Math.floor(minorUnits / 100);
  const paise = minorUnits % 100;
  return paise > 0 ? `\u20B9${rupees.toLocaleString('en-IN')}.${paise}` : `\u20B9${rupees.toLocaleString('en-IN')}`;
}
