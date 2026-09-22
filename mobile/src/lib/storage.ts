import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Household, Service, Rate, DeliveryRecord, PausePeriod, Payment } from '../types';

const KEYS = {
  household: 'dailio_household',
  services: 'dailio_services',
  rates: 'dailio_rates',
  records: 'dailio_records',
  pauses: 'dailio_pauses',
  payments: 'dailio_payments',
} as const;

async function load<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function save<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

async function loadOne<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function saveOne<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export const storage = {
  getHousehold: () => loadOne<Household>(KEYS.household),
  saveHousehold: (h: Household) => saveOne(KEYS.household, h),
  getServices: () => load<Service>(KEYS.services),
  saveServices: (s: Service[]) => save(KEYS.services, s),
  getRates: () => load<Rate>(KEYS.rates),
  saveRates: (r: Rate[]) => save(KEYS.rates, r),
  getRecords: () => load<DeliveryRecord>(KEYS.records),
  saveRecords: (r: DeliveryRecord[]) => save(KEYS.records, r),
  getPauses: () => load<PausePeriod>(KEYS.pauses),
  savePauses: (p: PausePeriod[]) => save(KEYS.pauses, p),
  getPayments: () => load<Payment>(KEYS.payments),
  savePayments: (p: Payment[]) => save(KEYS.payments, p),

  async exportAll(): Promise<string> {
    const [household, services, rates, records, pauses, payments] = await Promise.all([
      storage.getHousehold(), storage.getServices(), storage.getRates(),
      storage.getRecords(), storage.getPauses(), storage.getPayments(),
    ]);
    return JSON.stringify({ household, services, rates, records, pauses, payments, version: '1.0' }, null, 2);
  },

  async importAll(json: string): Promise<boolean> {
    try {
      const data = JSON.parse(json);
      if (data.household) await storage.saveHousehold(data.household);
      if (data.services) await storage.saveServices(data.services);
      if (data.rates) await storage.saveRates(data.rates);
      if (data.records) await storage.saveRecords(data.records);
      if (data.pauses) await storage.savePauses(data.pauses);
      if (data.payments) await storage.savePayments(data.payments);
      return true;
    } catch { return false; }
  },
};
