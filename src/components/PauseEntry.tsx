import { useState } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Pause, Trash2, Milk, Newspaper } from 'lucide-react';

export default function PauseEntry() {
  const { services, pauses, addPause, removePause } = useStore();
  const [serviceId, setServiceId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('');

  const handleAdd = () => {
    if (!serviceId || startDate > endDate) return;
    addPause(serviceId, startDate, endDate, reason);
    setReason('');
  };

  return (
    <div className="px-4 max-w-lg mx-auto space-y-4 mt-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center text-text-muted">
          <Pause size={16} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="font-bold text-sm">Pause / Vacation</h2>
          <p className="text-[11px] text-text-muted">Mark a service as paused for a date range</p>
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
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Vacation, out of station"
            className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!serviceId || startDate > endDate}
          className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-base hover:bg-primary-dark active:scale-[0.97] transition-all shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Add Pause Period
        </button>
      </div>

      {pauses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-1">Active Pauses</h3>
          {pauses.map(p => {
            const svc = services.find(s => s.id === p.serviceId);
            return (
              <div key={p.id} className="bg-white rounded-xl p-3 border border-border/60 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    svc?.type === 'milk' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {svc?.type === 'milk' ? <Milk size={16} /> : <Newspaper size={16} />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-text">{svc?.name}</div>
                    <div className="text-xs text-text-muted">{p.startDate} → {p.endDate}</div>
                    {p.reason && <div className="text-xs text-text-muted italic mt-0.5">{p.reason}</div>}
                  </div>
                </div>
                <button
                  onClick={() => removePause(p.id)}
                  className="w-8 h-8 rounded-lg text-danger hover:bg-danger/10 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
