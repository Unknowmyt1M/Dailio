import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { calculateMonthlyHisaab, formatCurrency } from '../lib/billing';
import { dateKey, isDatePaused, getApplicableRate } from '../lib/dates';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, ChevronRight, Pause, Layers, ArrowRight, Sun, Moon, CalendarDays, Milk, Newspaper, CheckCircle2 } from 'lucide-react';

export default function HomeDashboard() {
  const navigate = useNavigate();
  const {
    household,
    services,
    records,
    rates,
    pauses,
    payments,
    currentYear,
    currentMonth,
    theme,
    toggleTheme,
    setRecord,
    clearRecord,
  } = useStore();

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => dateKey(today), [today]);
  const todayLabel = format(today, 'EEEE, d MMMM yyyy');

  // Active services
  const milkService = useMemo(() => services.find(s => s.type === 'milk' && s.enabled), [services]);
  const paperService = useMemo(() => services.find(s => s.type === 'newspaper' && s.enabled), [services]);

  // Today's records
  const milkRecord = milkService ? records.find(r => r.serviceId === milkService.id && r.date === todayStr) : undefined;
  const paperRecord = paperService ? records.find(r => r.serviceId === paperService.id && r.date === todayStr) : undefined;

  const defaultMilkQty = milkService?.defaultQuantity ?? 1;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // 1-Click Milk Handler (uses default onboarding quantity)
  const handleToggleMilkDefault = () => {
    if (!milkService) return;
    if (milkRecord?.status === 'delivered') {
      clearRecord(milkService.id, todayStr);
      showToast('Milk reset to pending');
    } else {
      setRecord(milkService.id, todayStr, 'delivered', defaultMilkQty);
      showToast(`Recorded ${defaultMilkQty}${milkService.unit} milk!`);
    }
  };

  // Override custom milk quantity
  const handleSetMilkQty = (qty: number) => {
    if (!milkService) return;
    setRecord(milkService.id, todayStr, 'delivered', qty);
    showToast(`Milk updated to ${qty}${milkService.unit}`);
  };

  const handleSetMilkMissed = () => {
    if (!milkService) return;
    if (milkRecord?.status === 'not_delivered') {
      clearRecord(milkService.id, todayStr);
      showToast('Milk reset to pending');
    } else {
      setRecord(milkService.id, todayStr, 'not_delivered', 0);
      showToast('Milk marked as missed today');
    }
  };

  // 1-Click Newspaper Handler
  const handleTogglePaper = () => {
    if (!paperService) return;
    if (paperRecord?.status === 'delivered') {
      clearRecord(paperService.id, todayStr);
      showToast('Newspaper reset to pending');
    } else {
      setRecord(paperService.id, todayStr, 'delivered', 1);
      showToast('Newspaper marked as delivered!');
    }
  };

  const handleSetPaperMissed = () => {
    if (!paperService) return;
    if (paperRecord?.status === 'not_delivered') {
      clearRecord(paperService.id, todayStr);
      showToast('Newspaper reset to pending');
    } else {
      setRecord(paperService.id, todayStr, 'not_delivered', 0);
      showToast('Newspaper marked as missed');
    }
  };

  // This Week Strip (Last 7 days ending with today)
  const weekDays = useMemo(() => {
    const start = subDays(today, 6);
    return eachDayOfInterval({ start, end: today });
  }, [today]);

  // Today Progress Count
  const totalActive = (milkService ? 1 : 0) + (paperService ? 1 : 0);
  const recordedCount = (milkRecord ? 1 : 0) + (paperRecord ? 1 : 0);
  const allDelivered = (milkRecord?.status === 'delivered' || !milkService) && (paperRecord?.status === 'delivered' || !paperService);

  // Live Month Hisaab
  const hisaab = useMemo(
    () => calculateMonthlyHisaab(services, records, rates, pauses, payments, currentYear, currentMonth),
    [services, records, rates, pauses, payments, currentYear, currentMonth]
  );

  const milkSummary = hisaab.summaries.find(s => s.serviceType === 'milk');
  const paperSummary = hisaab.summaries.find(s => s.serviceType === 'newspaper');

  // Rates for today
  const todayMilkRate = milkService ? getApplicableRate(milkService.id, rates, today) : undefined;
  const todayPaperRate = paperService ? getApplicableRate(paperService.id, rates, today) : undefined;

  const currentMilkQty = milkRecord?.status === 'delivered' ? milkRecord.quantity : defaultMilkQty;
  const currentMilkCostMinor = todayMilkRate ? Math.round(currentMilkQty * todayMilkRate.amountMinor) : 0;
  const currentPaperCostMinor = todayPaperRate ? todayPaperRate.amountMinor : 0;

  return (
    <div className="pt-4 max-w-lg mx-auto space-y-4 px-4 pb-6">
      {/* Toast Overlay */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-slate-700">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* App & Greeting Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-lg shadow-primary/25">
            <CalendarDays size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-extrabold tracking-tight">Dailio</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                Home
              </span>
            </div>
            <p className="text-xs text-text-secondary font-medium">
              {household?.name || 'Household Tracker'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-xl bg-surface-alt border border-border/60 text-text flex items-center justify-center hover:bg-primary-50 hover:text-primary transition-all active:scale-95 shadow-sm"
          >
            {document.documentElement.classList.contains('dark') || theme === 'dark' ? (
              <Sun size={16} className="text-amber-400" />
            ) : (
              <Moon size={16} className="text-text-secondary" />
            )}
          </button>

          {/* Status Badge */}
          <div>
            {totalActive > 0 && recordedCount === totalActive && allDelivered ? (
              <span className="text-[11px] font-bold text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={13} className="text-success" /> All Done
              </span>
            ) : totalActive > 0 && recordedCount > 0 ? (
              <span className="text-[11px] font-bold text-primary bg-primary-50 border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> {recordedCount}/{totalActive} Logged
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-text-muted bg-surface-alt px-2.5 py-1 rounded-full">
                Pending Today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="pt-1">
        <h2 className="text-xl font-extrabold tracking-tight text-text flex items-center gap-2">
          Today's Deliveries
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Zap size={12} className="fill-amber-500" /> Quick Log
          </span>
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">{todayLabel}</p>
      </div>

      {/* 🔝 1. THIS WEEK STRIP (TOP) */}
      <div className="bg-white rounded-2xl p-3.5 border border-border/60 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            This Week
          </span>
          <button
            onClick={() => navigate('/calendar')}
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            <span>Full Calendar</span> <ChevronRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekDays.map(day => {
            const dk = dateKey(day);
            const isT = dk === todayStr;
            const dayLetter = format(day, 'EEEEEE');
            const dayNum = day.getDate();

            const mRec = milkService ? records.find(r => r.serviceId === milkService.id && r.date === dk) : undefined;
            const pRec = paperService ? records.find(r => r.serviceId === paperService.id && r.date === dk) : undefined;
            const mPaused = milkService ? isDatePaused(day, pauses, milkService.id) : false;
            const pPaused = paperService ? isDatePaused(day, pauses, paperService.id) : false;

            const mDel = mRec?.status === 'delivered';
            const pDel = pRec?.status === 'delivered';
            const mMiss = mRec?.status === 'not_delivered';
            const pMiss = pRec?.status === 'not_delivered';

            return (
              <div
                key={dk}
                onClick={() => navigate('/calendar')}
                className={`py-2 px-1 rounded-xl flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                  isT
                    ? 'bg-primary/10 border-2 border-primary shadow-sm'
                    : mDel || pDel
                    ? 'bg-success/5 border border-success/20'
                    : mMiss || pMiss
                    ? 'bg-danger/5 border border-danger/20'
                    : 'bg-surface border border-border/60'
                }`}
              >
                <span className={`text-[9px] font-bold ${isT ? 'text-primary' : 'text-text-muted'}`}>
                  {dayLetter}
                </span>
                <span className={`text-xs font-extrabold ${isT ? 'text-primary' : 'text-text'}`}>
                  {dayNum}
                </span>
                <div className="flex items-center justify-center gap-0.5 h-3.5 text-[10px]">
                  {mPaused || pPaused ? (
                    <span className="text-amber-600 dark:text-amber-400 text-[8px] font-bold">PAUSE</span>
                  ) : mDel && pDel ? (
                    <div className="flex items-center gap-0.5">
                      <Milk size={11} className="text-blue-500" />
                      <Newspaper size={11} className="text-amber-500" />
                    </div>
                  ) : mDel ? (
                    <Milk size={11} className="text-blue-500" />
                  ) : pDel ? (
                    <Newspaper size={11} className="text-amber-500" />
                  ) : mMiss || pMiss ? (
                    <span className="text-danger font-black text-[10px] leading-none">✕</span>
                  ) : (
                    <span className="text-text-muted/40 font-bold">&middot;</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ⚡ 2. 1-CLICK TODAY QUICK LOGGING */}
      <div className="space-y-3">
        {/* Milk Card */}
        {milkService && (
          <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Milk size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{milkService.name}</span>
                    {milkRecord?.status === 'delivered' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 flex items-center gap-1">
                        <Check size={11} strokeWidth={3} /> {milkRecord.quantity}{milkService.unit} Done
                      </span>
                    ) : milkRecord?.status === 'not_delivered' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">
                        Missed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-alt text-text-muted">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5">
                    Default: <strong>{defaultMilkQty}{milkService.unit}</strong> @ ₹{todayMilkRate ? (todayMilkRate.amountMinor / 100).toFixed(0) : '60'}/{milkService.unit}
                  </div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-text">
                {formatCurrency(currentMilkCostMinor)}
              </span>
            </div>

            {/* Main 1-Click Action Row matching Newspaper */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMilkDefault}
                className={`flex-1 py-3 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm whitespace-nowrap ${
                  milkRecord?.status === 'delivered'
                    ? 'bg-success text-white shadow-success/25'
                    : 'bg-primary text-white hover:bg-primary-dark shadow-primary/25'
                }`}
              >
                {milkRecord?.status === 'delivered' ? (
                  <>
                    <Check size={16} strokeWidth={3} /> {milkRecord.quantity}{milkService.unit} Delivered
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} /> Mark Delivered ({defaultMilkQty}{milkService.unit})
                  </>
                )}
              </button>
              <button
                onClick={handleSetMilkMissed}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  milkRecord?.status === 'not_delivered'
                    ? 'bg-danger text-white'
                    : 'bg-surface-alt text-text-secondary hover:bg-danger/10 hover:text-danger'
                }`}
              >
                Missed
              </button>
            </div>

            {/* Quick Quantity Chips */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
              <span className="text-[11px] font-semibold text-text-secondary">Quantity:</span>
              <div className="flex items-center gap-1.5">
                {Array.from(new Set([0.5, 1, defaultMilkQty, 2])).sort((a, b) => a - b).map(qty => (
                  <button
                    key={qty}
                    onClick={() => handleSetMilkQty(qty)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                      milkRecord?.status === 'delivered' && milkRecord.quantity === qty
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'bg-surface-alt text-text-secondary hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {qty}{milkService.unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Newspaper Card */}
        {paperService && (
          <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Newspaper size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{paperService.name}</span>
                    {paperRecord?.status === 'delivered' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 flex items-center gap-1">
                        <Check size={11} strokeWidth={3} /> Delivered
                      </span>
                    ) : paperRecord?.status === 'not_delivered' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">
                        Missed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-alt text-text-muted">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5">
                    Daily delivery &middot; ₹{todayPaperRate ? (todayPaperRate.amountMinor / 100).toFixed(0) : '8'}/day
                  </div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-text">
                {formatCurrency(currentPaperCostMinor)}
              </span>
            </div>

            {/* Newspaper 1-Click Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePaper}
                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm ${
                  paperRecord?.status === 'delivered'
                    ? 'bg-success text-white shadow-success/25'
                    : 'bg-newspaper text-white hover:bg-newspaper-dark shadow-newspaper/25'
                }`}
              >
                {paperRecord?.status === 'delivered' ? (
                  <>
                    <Check size={16} strokeWidth={3} /> Delivered (Tap to Undo)
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} /> Mark Delivered
                  </>
                )}
              </button>
              <button
                onClick={handleSetPaperMissed}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  paperRecord?.status === 'not_delivered'
                    ? 'bg-danger text-white'
                    : 'bg-surface-alt text-text-secondary hover:bg-danger/10 hover:text-danger'
                }`}
              >
                Missed
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 💰 3. LIVE MONTH HISAAB CARD */}
      <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-text-secondary">
              {format(new Date(currentYear, currentMonth), 'MMMM')} Hisaab
            </h3>
          </div>
          <button
            onClick={() => navigate('/hisaab')}
            className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
          >
            <span>Full Hisaab</span> <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center bg-surface p-3.5 rounded-xl border border-border/40">
          <div>
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Total Bill</div>
            <div className="text-base font-extrabold text-text mt-0.5">{formatCurrency(hisaab.totalMinor)}</div>
            <div className="text-[10px] text-text-muted mt-0.5">
              {milkSummary ? `${milkSummary.billableQuantity}${milkSummary.unit}` : ''}
            </div>
          </div>
          <div className="border-x border-border/60">
            <div className="text-[10px] font-semibold text-success uppercase tracking-wider">Paid</div>
            <div className="text-base font-extrabold text-success mt-0.5">{formatCurrency(hisaab.paidMinor)}</div>
            <div className="text-[10px] text-success/80 mt-0.5">{payments.filter(p => p.billingPeriod === hisaab.period).length} payments</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-danger uppercase tracking-wider">Due</div>
            <div className="text-base font-extrabold text-danger mt-0.5">{formatCurrency(hisaab.dueMinor)}</div>
            <div className="text-[10px] text-danger/80 mt-0.5">Remaining</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-text-secondary flex items-center gap-2">
            {milkSummary && (
              <span className="inline-flex items-center gap-1">
                <Milk size={12} className="text-blue-500" />
                {milkSummary.billableQuantity} {milkSummary.unit}
              </span>
            )}
            {milkSummary && paperSummary && <span className="text-text-muted/40 font-bold">&middot;</span>}
            {paperSummary && (
              <span className="inline-flex items-center gap-1">
                <Newspaper size={12} className="text-amber-500" />
                {paperSummary.billableQuantity} days
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/hisaab')}
            className="text-xs font-bold text-success bg-success/10 border border-success/20 px-3 py-1 rounded-lg hover:bg-success/15 active:scale-95 transition-all"
          >
            + Record Payment
          </button>
        </div>
      </div>

      {/* 🚀 4. QUICK UTILITIES */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => navigate('/calendar')}
          className="p-3.5 rounded-2xl bg-white border border-border/60 flex items-center gap-3 text-left hover:border-primary/40 hover:bg-primary-50/20 active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0">
            <Pause size={17} strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-xs text-text">Pause Delivery</div>
            <div className="text-[10px] text-text-muted">Vacation / holiday</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/calendar')}
          className="p-3.5 rounded-2xl bg-white border border-border/60 flex items-center gap-3 text-left hover:border-accent/40 hover:bg-accent-light/10 active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-accent-light/20 text-accent flex items-center justify-center shrink-0">
            <Layers size={17} strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-xs text-text">Bulk Entry</div>
            <div className="text-[10px] text-text-muted">Fill date range</div>
          </div>
        </button>
      </div>
    </div>
  );
}
