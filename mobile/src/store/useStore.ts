import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { dateKey } from '../lib/dates';
import { storage } from '../lib/storage';
import type { Household, Service, Rate, DeliveryRecord, PausePeriod, Payment, DeliveryStatus } from '../types';

interface DailioState {
  household: Household | null;
  services: Service[];
  rates: Rate[];
  records: DeliveryRecord[];
  pauses: PausePeriod[];
  payments: Payment[];
  currentYear: number;
  currentMonth: number;
  selectedDate: string | null;
  setupComplete: boolean;
  loaded: boolean;

  init: () => Promise<void>;
  setHousehold: (h: Household) => void;
  addService: (s: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateService: (id: string, updates: Partial<Service>) => void;
  removeService: (id: string) => void;
  addRate: (r: Omit<Rate, 'id' | 'createdAt'>) => void;
  updateRate: (id: string, updates: Partial<Rate>) => void;
  setRecord: (serviceId: string, date: string, status: DeliveryStatus, quantity: number, note?: string) => void;
  setBulkRecords: (serviceId: string, startDate: string, endDate: string, status: DeliveryStatus, quantity: number, weekdaysOnly: number[] | null, overwrite: boolean) => void;
  clearRecord: (serviceId: string, date: string) => void;
  addPause: (serviceId: string, startDate: string, endDate: string, reason: string) => void;
  removePause: (id: string) => void;
  addPayment: (amountMinor: number, note: string, paidAt?: string) => void;
  removePayment: (id: string) => void;
  setMonth: (year: number, month: number) => void;
  setSelectedDate: (date: string | null) => void;
  setSetupComplete: (v: boolean) => void;
}

export const useStore = create<DailioState>((set, get) => ({
  household: null,
  services: [],
  rates: [],
  records: [],
  pauses: [],
  payments: [],
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selectedDate: null,
  setupComplete: false,
  loaded: false,

  init: async () => {
    const [household, services, rates, records, pauses, payments] = await Promise.all([
      storage.getHousehold(), storage.getServices(), storage.getRates(),
      storage.getRecords(), storage.getPauses(), storage.getPayments(),
    ]);
    set({
      household, services, rates, records, pauses, payments,
      setupComplete: !!household && services.length > 0,
      loaded: true,
    });
  },

  setHousehold: (h) => {
    storage.saveHousehold(h);
    set({ household: h });
  },

  addService: (s) => {
    const id = uuid();
    const now = new Date().toISOString();
    const service: Service = { ...s, id, createdAt: now, updatedAt: now };
    const services = [...get().services, service];
    storage.saveServices(services);
    set({ services });
    return id;
  },

  updateService: (id, updates) => {
    const services = get().services.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    storage.saveServices(services);
    set({ services });
  },

  removeService: (id) => {
    const services = get().services.filter(s => s.id !== id);
    storage.saveServices(services);
    set({ services });
  },

  addRate: (r) => {
    const rate: Rate = { ...r, id: uuid(), createdAt: new Date().toISOString() };
    const rates = [...get().rates, rate];
    storage.saveRates(rates);
    set({ rates });
  },

  updateRate: (id, updates) => {
    const rates = get().rates.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    storage.saveRates(rates);
    set({ rates });
  },

  setRecord: (serviceId, date, status, quantity, note = '') => {
    const { household, records } = get();
    const existing = records.find(r => r.serviceId === serviceId && r.date === date);
    let updated: DeliveryRecord[];
    if (existing) {
      updated = records.map(r =>
        r.id === existing.id ? { ...r, status, quantity, note, updatedAt: new Date().toISOString() } : r
      );
    } else {
      updated = [...records, {
        id: uuid(), householdId: household?.id ?? '', serviceId, date, status, quantity,
        unit: get().services.find(s => s.id === serviceId)?.unit ?? '',
        note, source: 'manual', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }];
    }
    storage.saveRecords(updated);
    set({ records: updated });
  },

  setBulkRecords: (serviceId, startDate, endDate, status, quantity, weekdaysOnly, overwrite) => {
    const { household, records } = get();
    let updated = [...records];
    const service = get().services.find(s => s.id === serviceId);
    const d = new Date(startDate);
    const end = new Date(endDate);
    while (d <= end) {
      const dk = dateKey(d);
      const existing = updated.find(r => r.serviceId === serviceId && r.date === dk);
      if (!weekdaysOnly || weekdaysOnly.includes(d.getDay())) {
        if (overwrite || !existing) {
          if (existing) {
            updated = updated.map(r => r.id === existing.id ? { ...r, status, quantity, source: 'bulk', updatedAt: new Date().toISOString() } : r);
          } else {
            updated.push({
              id: uuid(), householdId: household?.id ?? '', serviceId, date: dk, status, quantity,
              unit: service?.unit ?? '', note: '', source: 'bulk', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            });
          }
        }
      }
      d.setDate(d.getDate() + 1);
    }
    storage.saveRecords(updated);
    set({ records: updated });
  },

  clearRecord: (serviceId, date) => {
    const updated = get().records.filter(r => !(r.serviceId === serviceId && r.date === date));
    storage.saveRecords(updated);
    set({ records: updated });
  },

  addPause: (serviceId, startDate, endDate, reason) => {
    const pause: PausePeriod = {
      id: uuid(), householdId: get().household?.id ?? '',
      serviceId, startDate, endDate, reason, createdAt: new Date().toISOString(),
    };
    const updated = [...get().pauses, pause];
    storage.savePauses(updated);
    set({ pauses: updated });
  },

  removePause: (id) => {
    const updated = get().pauses.filter(p => p.id !== id);
    storage.savePauses(updated);
    set({ pauses: updated });
  },

  addPayment: (amountMinor, note, paidAt) => {
    const { currentYear, currentMonth } = get();
    const period = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const payment: Payment = {
      id: uuid(), householdId: get().household?.id ?? '',
      billingPeriod: period, amountMinor, paidAt: paidAt || new Date().toISOString(),
      note, createdAt: new Date().toISOString(),
    };
    const updated = [...get().payments, payment];
    storage.savePayments(updated);
    set({ payments: updated });
  },

  removePayment: (id) => {
    const updated = get().payments.filter(p => p.id !== id);
    storage.savePayments(updated);
    set({ payments: updated });
  },

  setMonth: (year, month) => set({ currentYear: year, currentMonth: month }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSetupComplete: (v) => set({ setupComplete: v }),
}));
