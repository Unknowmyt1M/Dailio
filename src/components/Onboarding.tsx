import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowRight, ArrowLeft, Check, CalendarDays, Milk, Newspaper } from 'lucide-react';
import { v4 as uuid } from 'uuid';

import { dateKey } from '../lib/dates';

export default function Onboarding() {
  const { setHousehold, addService, addRate, setSetupComplete } = useStore();
  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState('');
  const [milkEnabled, setMilkEnabled] = useState(true);
  const [milkQty, setMilkQty] = useState('1');
  const [milkUnit, setMilkUnit] = useState('L');
  const [milkRate, setMilkRate] = useState('60');
  const [paperEnabled, setPaperEnabled] = useState(true);
  const [paperRate, setPaperRate] = useState('8');

  const handleFinish = () => {
    const now = new Date().toISOString();
    const todayStr = dateKey(new Date());
    const householdId = uuid();

    setHousehold({
      id: householdId,
      name: householdName.trim() || 'My Household',
      currency: 'INR',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: 'en-IN',
      createdAt: now,
      updatedAt: now,
    });

    if (milkEnabled) {
      const milkId = addService({
        householdId,
        type: 'milk',
        name: 'Milk',
        enabled: true,
        defaultQuantity: parseFloat(milkQty) || 1,
        unit: milkUnit,
        billingModel: 'quantity',
        scheduledWeekdays: [0, 1, 2, 3, 4, 5, 6],
      });
      addRate({
        serviceId: milkId,
        amountMinor: Math.round((parseFloat(milkRate) || 60) * 100),
        unitBasis: milkUnit,
        effectiveFrom: todayStr,
        effectiveTo: null,
      });
    }

    if (paperEnabled) {
      const paperId = addService({
        householdId,
        type: 'newspaper',
        name: 'Newspaper',
        enabled: true,
        defaultQuantity: 1,
        unit: 'copy',
        billingModel: 'per_day',
        scheduledWeekdays: [1, 2, 3, 4, 5, 6],
      });
      addRate({
        serviceId: paperId,
        amountMinor: Math.round((parseFloat(paperRate) || 8) * 100),
        unitBasis: 'day',
        effectiveFrom: todayStr,
        effectiveTo: null,
      });
    }

    setSetupComplete(true);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex gap-1.5">
          {[0, 1].map(s => (
            <div key={s} className={`h-1 rounded-full flex-1 transition-all duration-500 ${s <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm animate-fade-in">
          {step === 0 && (
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-lg shadow-primary/25 text-white">
                  <CalendarDays size={38} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Welcome to Dailio</h1>
                  <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                    Track milk, newspaper & daily deliveries with ease.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider">Household Name</label>
                <input
                  type="text"
                  value={householdName}
                  onChange={e => setHouseholdName(e.target.value)}
                  placeholder="e.g. Sharma Family"
                  className="w-full px-4 py-3.5 rounded-2xl border border-border/60 bg-white text-text text-base placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <button onClick={() => setStep(0)} className="text-sm text-text-secondary flex items-center gap-1 mb-4 hover:text-primary transition-colors">
                  <ArrowLeft size={16} /> Back
                </button>
                <h2 className="text-xl font-extrabold tracking-tight">Your Services</h2>
                <p className="text-sm text-text-secondary mt-1">Select what you receive daily.</p>
              </div>

              {/* Milk toggle */}
              <button
                onClick={() => setMilkEnabled(!milkEnabled)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                  milkEnabled ? 'border-milk bg-milk/5 shadow-sm' : 'border-border/60 bg-white hover:border-border'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${milkEnabled ? 'bg-milk text-white' : 'bg-surface-alt text-text-muted'}`}>
                  <Milk size={22} />
                </div>
                <div className="flex-1">
                  <div className="font-bold">Milk</div>
                  <div className="text-xs text-text-secondary mt-0.5">Daily milk delivery</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${milkEnabled ? 'border-milk bg-milk' : 'border-border'}`}>
                  {milkEnabled && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
              </button>

              {milkEnabled && (
                <div className="bg-white rounded-2xl p-4 border border-border/60 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Qty</label>
                      <input
                        type="number"
                        value={milkQty}
                        onChange={e => setMilkQty(e.target.value)}
                        step="0.5"
                        min="0.5"
                        className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text font-semibold text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Unit</label>
                      <select
                        value={milkUnit}
                        onChange={e => setMilkUnit(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text font-semibold text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="L">Litre</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Rate (per {milkUnit})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-semibold">₹</span>
                      <input
                        type="number"
                        value={milkRate}
                        onChange={e => setMilkRate(e.target.value)}
                        min="0"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Newspaper toggle */}
              <button
                onClick={() => setPaperEnabled(!paperEnabled)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                  paperEnabled ? 'border-newspaper bg-newspaper/5 shadow-sm' : 'border-border/60 bg-white hover:border-border'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${paperEnabled ? 'bg-newspaper text-white' : 'bg-surface-alt text-text-muted'}`}>
                  <Newspaper size={22} />
                </div>
                <div className="flex-1">
                  <div className="font-bold">Newspaper</div>
                  <div className="text-xs text-text-secondary mt-0.5">Mon–Sat delivery</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paperEnabled ? 'border-newspaper bg-newspaper' : 'border-border'}`}>
                  {paperEnabled && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
              </button>

              {paperEnabled && (
                <div className="bg-white rounded-2xl p-4 border border-border/60 animate-fade-in">
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Rate (per day)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-semibold">₹</span>
                    <input
                      type="number"
                      value={paperRate}
                      onChange={e => setPaperRate(e.target.value)}
                      min="0"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleFinish}
                disabled={!milkEnabled && !paperEnabled}
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-base hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
