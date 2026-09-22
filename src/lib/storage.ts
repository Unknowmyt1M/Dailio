import type { Household, Service, Rate, DeliveryRecord, PausePeriod, Payment, ThemeMode } from '../types';

const STORAGE_KEYS = {
  household: 'dailio_household',
  services: 'dailio_services',
  rates: 'dailio_rates',
  records: 'dailio_records',
  pauses: 'dailio_pauses',
  payments: 'dailio_payments',
  theme: 'dailio_theme',
} as const;

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadOne<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOne<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Household
export function getHousehold(): Household | null {
  return loadOne<Household>(STORAGE_KEYS.household);
}

export function saveHousehold(h: Household): void {
  saveOne(STORAGE_KEYS.household, h);
}

// Services
export function getServices(): Service[] {
  return load<Service>(STORAGE_KEYS.services);
}

export function saveServices(services: Service[]): void {
  save(STORAGE_KEYS.services, services);
}

// Rates
export function getRates(): Rate[] {
  return load<Rate>(STORAGE_KEYS.rates);
}

export function saveRates(rates: Rate[]): void {
  save(STORAGE_KEYS.rates, rates);
}

// Delivery Records
export function getRecords(): DeliveryRecord[] {
  return load<DeliveryRecord>(STORAGE_KEYS.records);
}

export function saveRecords(records: DeliveryRecord[]): void {
  save(STORAGE_KEYS.records, records);
}

// Pauses
export function getPauses(): PausePeriod[] {
  return load<PausePeriod>(STORAGE_KEYS.pauses);
}

export function savePauses(pauses: PausePeriod[]): void {
  save(STORAGE_KEYS.pauses, pauses);
}

// Payments
export function getPayments(): Payment[] {
  return load<Payment>(STORAGE_KEYS.payments);
}

export function savePayments(payments: Payment[]): void {
  save(STORAGE_KEYS.payments, payments);
}

// Export all data
export function exportAllData(): string {
  return JSON.stringify({
    household: getHousehold(),
    services: getServices(),
    rates: getRates(),
    records: getRecords(),
    pauses: getPauses(),
    payments: getPayments(),
    exportedAt: new Date().toISOString(),
    version: '1.0',
  }, null, 2);
}

// Import all data
export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.household) saveHousehold(data.household);
    if (data.services) saveServices(data.services);
    if (data.rates) saveRates(data.rates);
    if (data.records) saveRecords(data.records);
    if (data.pauses) savePauses(data.pauses);
    if (data.payments) savePayments(data.payments);
    return true;
  } catch {
    return false;
  }
}

// Theme
export function getTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.theme);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw;
    }
    return 'system';
  } catch {
    return 'system';
  }
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch {
    // Ignore storage quota errors
  }
}
