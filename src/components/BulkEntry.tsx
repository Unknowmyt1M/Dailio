import { useState } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function BulkEntry() {
  const { services, setBulkRecords } = useStore();
  const [serviceId, setServiceId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<'delivered' | 'not_delivered'>('delivered');
  const [quantity, setQuantity] = useState('1');
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [applied, setApplied] = useState(false);

  const selectedService = services.find(s => s.id === serviceId);

  const handleApply = () => {
    if (!serviceId) return;
    const weekdays = weekdaysOnly ? [1, 2, 3, 4, 5, 6] : null;
    setBulkRecords(serviceId, startDate, endDate, status, parseFloat(quantity) || 0, weekdays, overwrite);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="px-4 max-w-lg mx-auto space-y-4 mt-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary">
          <Layers size={16} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="font-bold text-sm">Bulk Entry</h2>
          <p className="text-[11px] text-text-muted">Apply delivery across a date range</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Service</label>
          <select
            value={serviceId}
            onChange={e => setServiceId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select service...</option>
            {services.filter(s => s.enabled).map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.type === 'milk' ? 'Milk' : 'Newspaper'})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Status</label>
          <div className="flex gap-2">
            <button
              onClick={() => setStatus('delivered')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] ${status === 'delivered' ? 'bg-success text-white shadow-md shadow-success/20' : 'bg-surface text-text-secondary hover:bg-surface-alt'}`}
            >
              Delivered
            </button>
            <button
              onClick={() => setStatus('not_delivered')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] ${status === 'not_delivered' ? 'bg-danger text-white shadow-md shadow-danger/20' : 'bg-surface text-text-secondary hover:bg-surface-alt'}`}
            >
              Not Delivered
            </button>
          </div>
        </div>

        {selectedService?.type === 'milk' && status === 'delivered' && (
          <div className="animate-fade-in">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Quantity ({selectedService.unit})</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              step="0.5"
              min="0.5"
              className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={weekdaysOnly}
              onChange={e => setWeekdaysOnly(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <div>
              <div className="text-sm font-medium">Weekdays only (Mon–Sat)</div>
              <div className="text-[11px] text-text-muted">Skip Sundays</div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={e => setOverwrite(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <div>
              <div className="text-sm font-medium">Overwrite existing records</div>
              <div className="text-[11px] text-text-muted">Replace data already entered</div>
            </div>
          </label>
        </div>

        {overwrite && (
          <div className="flex items-start gap-2 p-3 bg-warning-light rounded-xl animate-fade-in">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" />
            <p className="text-xs text-warning-dark">This will overwrite existing records in the selected range.</p>
          </div>
        )}

        <button
          onClick={handleApply}
          disabled={!serviceId || startDate > endDate}
          className={`w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ${
            applied
              ? 'bg-success text-white shadow-success/25'
              : 'bg-primary text-white hover:bg-primary-dark shadow-primary/25'
          }`}
        >
          {applied ? (
            <>
              <CheckCircle2 size={18} />
              <span>Applied Successfully!</span>
            </>
          ) : (
            <span>Apply Bulk Entry</span>
          )}
        </button>
      </div>
    </div>
  );
}
