import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { calculateMonthlyHisaab, formatCurrency } from '../lib/billing';
import { getPrevMonth, getNextMonth, dateKey } from '../lib/dates';
import { ChevronLeft, ChevronRight, Calculator, Share2, PlusCircle, Trash2, X, CreditCard, Milk, Newspaper } from 'lucide-react';
import { format } from 'date-fns';

export default function MonthlyHisaab() {
  const { currentYear, currentMonth, setMonth, services, records, rates, pauses, payments, addPayment, removePayment } = useStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payDate, setPayDate] = useState(dateKey(new Date()));

  const period = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const hisaab = useMemo(
    () => calculateMonthlyHisaab(services, records, rates, pauses, payments, currentYear, currentMonth),
    [services, records, rates, pauses, payments, currentYear, currentMonth]
  );

  const monthPayments = useMemo(
    () => payments.filter(p => p.billingPeriod === period),
    [payments, period]
  );

  const monthLabel = format(new Date(currentYear, currentMonth), 'MMMM yyyy');

  const shareText = `Dailio — ${monthLabel}\n\n${hisaab.summaries.map(s =>
    `${s.serviceType === 'milk' ? '🥛' : '📰'} ${s.serviceName}: ${s.billableQuantity} ${s.unit} × ${formatCurrency(s.rateMinor)} = ${formatCurrency(s.subtotalMinor)}`
  ).join('\n')}\n\nTotal: ${formatCurrency(hisaab.totalMinor)}\nPaid: ${formatCurrency(hisaab.paidMinor)}\nDue: ${formatCurrency(hisaab.dueMinor)}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard!');
    }
  };

  const handleSavePayment = () => {
    const val = parseFloat(payAmount);
    if (isNaN(val) || val <= 0) return;
    const amountMinor = Math.round(val * 100);
    const paidAtDate = payDate ? new Date(payDate + 'T12:00:00').toISOString() : new Date().toISOString();
    addPayment(amountMinor, payNote.trim(), paidAtDate);
    setPayAmount('');
    setPayNote('');
    setShowPaymentModal(false);
  };

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { const p = getPrevMonth(currentYear, currentMonth); setMonth(p.year, p.month); }}
          className="w-10 h-10 rounded-xl bg-white border border-border/60 flex items-center justify-center hover:bg-primary-50 active:scale-95 transition-all shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <Calculator size={16} className="text-primary" />
          <h2 className="text-base font-bold tracking-tight">{monthLabel}</h2>
        </div>
        <button
          onClick={() => { const n = getNextMonth(currentYear, currentMonth); setMonth(n.year, n.month); }}
          className="w-10 h-10 rounded-xl bg-white border border-border/60 flex items-center justify-center hover:bg-primary-50 active:scale-95 transition-all shadow-sm"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Billing card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {hisaab.summaries.length === 0 ? (
          <div className="p-10 text-center text-text-muted">
            <Calculator size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No services configured</p>
            <p className="text-xs mt-1">Add services in Settings first</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/60">
              {hisaab.summaries.map(s => (
                <div key={s.serviceType} className="p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.serviceType === 'milk' ? 'bg-milk/10 text-milk' : 'bg-newspaper/10 text-newspaper'}`}>
                      {s.serviceType === 'milk' ? (
                        <Milk size={16} />
                      ) : (
                        <Newspaper size={16} />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm">{s.serviceName}</span>
                      <div className="text-xs text-text-muted">
                        {s.billableQuantity} {s.unit} &times; {formatCurrency(s.rateMinor)}
                      </div>
                    </div>
                    <span className="font-bold text-sm">{formatCurrency(s.subtotalMinor)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-surface p-4 space-y-2.5 border-t border-border/60">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-extrabold text-lg">{formatCurrency(hisaab.totalMinor)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-success font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success" /> Paid
                </span>
                <span className="text-success font-semibold">{formatCurrency(hisaab.paidMinor)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-danger font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-danger" /> Due
                </span>
                <span className="text-danger font-semibold">{formatCurrency(hisaab.dueMinor)}</span>
              </div>

              {/* Record Payment Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setPayAmount(hisaab.dueMinor > 0 ? (hisaab.dueMinor / 100).toFixed(0) : '');
                    setShowPaymentModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-success/10 text-success border border-success/20 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-success/15 active:scale-[0.98] transition-all"
                >
                  <PlusCircle size={15} /> Record Payment
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment History Card */}
      {monthPayments.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-primary" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-text-secondary">Payments This Month</h3>
            </div>
            <span className="text-[11px] font-semibold text-text-muted">{monthPayments.length} recorded</span>
          </div>
          <div className="divide-y divide-border/60">
            {monthPayments.map(p => {
              const pDate = p.paidAt ? format(new Date(p.paidAt), 'd MMM') : '';
              return (
                <div key={p.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-success">{formatCurrency(p.amountMinor)}</div>
                    <div className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                      {pDate && <span>{pDate}</span>}
                      {p.note && <span>&middot; {p.note}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => removePayment(p.id)}
                    className="w-8 h-8 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors"
                    title="Delete payment entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share button */}
      {hisaab.summaries.length > 0 && (
        <button
          onClick={handleShare}
          className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-primary-dark active:scale-[0.97] transition-all shadow-lg shadow-primary/25"
        >
          <Share2 size={18} /> Share Summary
        </button>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 space-y-4 animate-slide-up shadow-2xl">
            <div className="flex justify-center sm:hidden"><div className="w-10 h-1 bg-border rounded-full" /></div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                <h3 className="font-bold text-base">Record Payment</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-xl bg-surface-alt flex items-center justify-center hover:bg-danger/10 hover:text-danger transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Amount Paid (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold text-base">₹</span>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="0"
                    autoFocus
                    className="w-full pl-8 pr-3 py-3 rounded-xl border border-border/60 bg-surface text-text font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Payment Note</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                    placeholder="e.g. GPay, Cash"
                    className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                onClick={handleSavePayment}
                disabled={!payAmount || parseFloat(payAmount) <= 0}
                className="w-full py-3.5 bg-success text-white rounded-2xl font-bold text-base hover:bg-emerald-600 active:scale-[0.97] transition-all shadow-lg shadow-success/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
