import { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Check, Trash2, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface DayEditorContentProps {
  selectedDate: string;
  onClose: () => void;
}

function DayEditorContent({ selectedDate, onClose }: DayEditorContentProps) {
  const { services, records, setRecord, clearRecord } = useStore();

  const milkService = services.find(s => s.type === 'milk' && s.enabled);
  const paperService = services.find(s => s.type === 'newspaper' && s.enabled);
  const milkRecord = milkService ? records.find(r => r.serviceId === milkService.id && r.date === selectedDate) : undefined;
  const paperRecord = paperService ? records.find(r => r.serviceId === paperService.id && r.date === selectedDate) : undefined;

  const [milkQty, setMilkQty] = useState(milkRecord?.quantity || milkService?.defaultQuantity || 1);
  const [milkNote, setMilkNote] = useState(milkRecord?.note || '');
  const [paperNote, setPaperNote] = useState(paperRecord?.note || '');

  const date = new Date(selectedDate + 'T00:00:00');
  const dateLabel = format(date, 'EEEE');
  const dateSub = format(date, 'd MMMM yyyy');

  const handleSaveMilk = (status: 'delivered' | 'not_delivered') => {
    if (!milkService) return;
    setRecord(milkService.id, selectedDate, status, status === 'delivered' ? milkQty : 0, milkNote);
  };

  const handleSavePaper = (status: 'delivered' | 'not_delivered') => {
    if (!paperService) return;
    setRecord(paperService.id, selectedDate, status, 1, paperNote);
  };

  const handleClear = () => {
    if (milkService) clearRecord(milkService.id, selectedDate);
    if (paperService) clearRecord(paperService.id, selectedDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{dateLabel}</h3>
            <p className="text-xs text-text-muted">{dateSub}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Milk Section */}
          {milkService && (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-milk/10 flex items-center justify-center text-milk">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2h8l2 6H6L8 2z"/>
                    <path d="M6 8v12a2 2 0 002 2h8a2 2 0 002-2V8"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-sm">Milk</h4>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveMilk('delivered')}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                    milkRecord?.status === 'delivered' ? 'bg-milk text-white shadow-md shadow-milk/20' : 'bg-milk/5 text-milk hover:bg-milk/10'
                  }`}
                >
                  <Check size={16} strokeWidth={3} /> Delivered
                </button>
                <button
                  onClick={() => handleSaveMilk('not_delivered')}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                    milkRecord?.status === 'not_delivered' ? 'bg-danger text-white shadow-md shadow-danger/20' : 'bg-danger/5 text-danger hover:bg-danger/10'
                  }`}
                >
                  <X size={16} strokeWidth={3} /> Not Delivered
                </button>
              </div>

              {milkRecord?.status === 'delivered' && (
                <div className="animate-fade-in bg-surface rounded-xl p-3">
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Quantity ({milkService.unit})</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { const q = Math.max(0.5, milkQty - 0.5); setMilkQty(q); setRecord(milkService.id, selectedDate, 'delivered', q, milkNote); }}
                      className="w-10 h-10 rounded-xl bg-white border border-border/60 flex items-center justify-center hover:bg-primary-50 active:scale-95 transition-all"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={milkQty}
                      onChange={e => { const q = parseFloat(e.target.value) || 0; setMilkQty(q); setRecord(milkService.id, selectedDate, 'delivered', q, milkNote); }}
                      step="0.5"
                      min="0.5"
                      className="flex-1 text-center text-xl font-bold py-2 rounded-xl border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    />
                    <button
                      onClick={() => { const q = milkQty + 0.5; setMilkQty(q); setRecord(milkService.id, selectedDate, 'delivered', q, milkNote); }}
                      className="w-10 h-10 rounded-xl bg-white border border-border/60 flex items-center justify-center hover:bg-primary-50 active:scale-95 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Note</label>
                <input
                  type="text"
                  value={milkNote}
                  onChange={e => {
                    setMilkNote(e.target.value);
                    if (milkRecord) setRecord(milkService.id, selectedDate, milkRecord.status, milkRecord.quantity, e.target.value);
                  }}
                  placeholder="Optional note..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
            </div>
          )}

          {/* Newspaper Section */}
          {paperService && (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-newspaper/10 flex items-center justify-center text-newspaper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
                    <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-sm">Newspaper</h4>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSavePaper('delivered')}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                    paperRecord?.status === 'delivered' ? 'bg-newspaper text-white shadow-md shadow-newspaper/20' : 'bg-newspaper/5 text-newspaper hover:bg-newspaper/10'
                  }`}
                >
                  <Check size={16} strokeWidth={3} /> Delivered
                </button>
                <button
                  onClick={() => handleSavePaper('not_delivered')}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                    paperRecord?.status === 'not_delivered' ? 'bg-danger text-white shadow-md shadow-danger/20' : 'bg-danger/5 text-danger hover:bg-danger/10'
                  }`}
                >
                  <X size={16} strokeWidth={3} /> Not Delivered
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Note</label>
                <input
                  type="text"
                  value={paperNote}
                  onChange={e => {
                    setPaperNote(e.target.value);
                    if (paperRecord) setRecord(paperService.id, selectedDate, paperRecord.status, 1, e.target.value);
                  }}
                  placeholder="Optional note..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
            </div>
          )}

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="w-full py-3 border border-border/60 rounded-xl text-danger font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-danger/5 active:scale-[0.97] transition-all"
          >
            <Trash2 size={15} /> Clear Records for this Day
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DayEditor() {
  const { selectedDate, setSelectedDate } = useStore();
  if (!selectedDate) return null;
  return <DayEditorContent key={selectedDate} selectedDate={selectedDate} onClose={() => setSelectedDate(null)} />;
}
