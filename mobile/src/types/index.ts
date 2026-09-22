export type ServiceType = 'milk' | 'newspaper';
export type DeliveryStatus = 'delivered' | 'not_delivered' | 'paused' | 'not_scheduled' | 'unrecorded';

export interface Household {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  householdId: string;
  type: ServiceType;
  name: string;
  enabled: boolean;
  defaultQuantity: number;
  unit: string;
  billingModel: string;
  scheduledWeekdays: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Rate {
  id: string;
  serviceId: string;
  amountMinor: number;
  unitBasis: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
}

export interface DeliveryRecord {
  id: string;
  householdId: string;
  serviceId: string;
  date: string;
  status: DeliveryStatus;
  quantity: number;
  unit: string;
  note: string;
  source: 'manual' | 'bulk' | 'voice' | 'import';
  createdAt: string;
  updatedAt: string;
}

export interface PausePeriod {
  id: string;
  householdId: string;
  serviceId: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  householdId: string;
  billingPeriod: string;
  amountMinor: number;
  paidAt: string;
  note: string;
  createdAt: string;
}

export interface BillingSummary {
  period: string;
  serviceName: string;
  serviceType: ServiceType;
  billableQuantity: number;
  unit: string;
  rateMinor: number;
  subtotalMinor: number;
}

export interface MonthlyHisaab {
  period: string;
  summaries: BillingSummary[];
  totalMinor: number;
  paidMinor: number;
  dueMinor: number;
}
