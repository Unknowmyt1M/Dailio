import { useStore } from '../store/useStore';
import { dateKey } from '../lib/dates';
import { Check, X, Zap, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function QuickEntry() {
  const { services, records, setRecord } = useStore();
  const navigate = useNavigate();
  const today = dateKey(new Date());
  const milkService = services.find(s => s.type === 'milk');
  const paperService = services.find(s => s.type === 'newspaper');
  const milkRecord = milkService ? records.find(r => r.serviceId === milkService.id && r.date === today) : undefined;
  const paperRecord = paperService ? records.find(r => r.serviceId === paperService.id && r.date === today) : undefined;

  const todayLabel = format(new Date(), 'EEE, d MMM');

  const quickMilk = (qty: number) => {
    if (!milkService) return;
    setRecord(milkService.id, today, 'delivered', qty);
  };

  const quickPaper = (status: 'delivered' | 'not_delivered') => {
    if (!paperService) return;
    setRecord(paperService.id, today, status, 1);
  };

  const isAllDone = (milkRecord?.status === 'delivered' || !milkService) && (paperRecord?.status === 'delivered' || !paperService);

  return (
    <div className="px-4 max-w-lg mx-auto space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAllDone ? 'bg-success/10 text-success' : 'bg-primary-50 text-primary'}`}>
            <Zap size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold">Today</h3>
            <p className="text-[11px] text-text-muted">{todayLabel}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/quick')}
          className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:gap-1.5 transition-all"
        >
          Details <ChevronRight size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {milkService && (
          <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-milk/10 flex items-center justify-center text-milk">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2h8l2 6H6L8 2z"/>
                    <path d="M6 8v12a2 2 0 002 2h8a2 2 0 002-2V8"/>
                    <path d="M10 12h4"/>
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-sm">Milk</span>
                  {milkRecord && (
                    <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${milkRecord.status === 'delivered' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {milkRecord.status === 'delivered' ? `${milkRecord.quantity}${milkService.unit}` : 'Missed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1, 1.5, 2].map(qty => (
                <button
                  key={qty}
                  onClick={() => quickMilk(qty)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    milkRecord?.status === 'delivered' && milkRecord.quantity === qty
                      ? 'bg-milk text-white shadow-md shadow-milk/20'
                      : 'bg-milk/5 text-milk hover:bg-milk/10'
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>
            <button
              onClick={() => milkService && setRecord(milkService.id, today, 'not_delivered', 0)}
              className={`w-full mt-2 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                milkRecord?.status === 'not_delivered'
                  ? 'bg-danger text-white'
                  : 'bg-danger/5 text-danger hover:bg-danger/10'
              }`}
            >
              <X size={12} /> Not Delivered
            </button>
          </div>
        )}

        {paperService && (
          <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-newspaper/10 flex items-center justify-center text-newspaper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
                    <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-sm">Newspaper</span>
                  {paperRecord && (
                    <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${paperRecord.status === 'delivered' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {paperRecord.status === 'delivered' ? 'Delivered' : 'Missed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickPaper('delivered')}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                  paperRecord?.status === 'delivered'
                    ? 'bg-newspaper text-white shadow-md shadow-newspaper/20'
                    : 'bg-newspaper/5 text-newspaper hover:bg-newspaper/10'
                }`}
              >
                <Check size={14} strokeWidth={3} /> Delivered
              </button>
              <button
                onClick={() => quickPaper('not_delivered')}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                  paperRecord?.status === 'not_delivered'
                    ? 'bg-danger text-white'
                    : 'bg-danger/5 text-danger hover:bg-danger/10'
                }`}
              >
                <X size={14} /> Missed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
