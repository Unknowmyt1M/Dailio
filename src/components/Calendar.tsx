import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getMonthDays, getPrevMonth, getNextMonth, dateKey, isDatePaused, isScheduledDay } from '../lib/dates';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, CircleDot } from 'lucide-react';
import DayCell from './DayCell';

export default function Calendar() {
  const { currentYear, currentMonth, setMonth, records, services, pauses, setSelectedDate } = useStore();

  const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);
  const monthLabel = format(new Date(currentYear, currentMonth), 'MMMM');
  const yearLabel = format(new Date(currentYear, currentMonth), 'yyyy');
  const today = dateKey(new Date());
  const firstDayOffset = days[0] ? days[0].getDay() : 0;

  const milkService = services.find(s => s.type === 'milk' && s.enabled);
  const paperService = services.find(s => s.type === 'newspaper' && s.enabled);

  const milkDelivered = days.filter(d => {
    const dk = dateKey(d);
    return records.some(r => r.serviceId === milkService?.id && r.date === dk && r.status === 'delivered');
  }).length;

  const paperDelivered = days.filter(d => {
    const dk = dateKey(d);
    return records.some(r => r.serviceId === paperService?.id && r.date === dk && r.status === 'delivered');
  }).length;

  const isCurrentMonth = currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth();

  return (
    <div className="px-4 pt-1 pb-2 max-w-lg mx-auto">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { const p = getPrevMonth(currentYear, currentMonth); setMonth(p.year, p.month); }}
          className="w-11 h-11 rounded-2xl bg-white border border-border/60 flex items-center justify-center hover:bg-primary-50 hover:border-primary/20 hover:text-primary active:scale-95 transition-all shadow-sm"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-xl font-extrabold tracking-tight">{monthLabel}</h2>
          <span className="text-[11px] font-semibold text-text-muted -mt-0.5">{yearLabel}</span>
        </div>

        <button
          onClick={() => { const n = getNextMonth(currentYear, currentMonth); setMonth(n.year, n.month); }}
          className="w-11 h-11 rounded-2xl bg-white border border-border/60 flex items-center justify-center hover:bg-primary-50 hover:border-primary/20 hover:text-primary active:scale-95 transition-all shadow-sm"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Jump to today */}
      {!isCurrentMonth && (
        <div className="flex justify-center mb-3 animate-fade-in">
          <button
            onClick={() => { const now = new Date(); setMonth(now.getFullYear(), now.getMonth()); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/15 active:scale-95 transition-all"
          >
            <CircleDot size={12} strokeWidth={2.5} />
            Back to Today
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4 px-1">
        {milkService && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-milk" />
            <span className="text-[11px] font-semibold text-text-secondary">
              {milkDelivered} <span className="text-text-muted font-medium">milk</span>
            </span>
          </div>
        )}
        {paperService && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-newspaper" />
            <span className="text-[11px] font-semibold text-text-secondary">
              {paperDelivered} <span className="text-text-muted font-medium">papers</span>
            </span>
          </div>
        )}
        {(milkService || paperService) && (
          <div className="flex items-center gap-1.5 ml-auto">
            <CalendarDays size={11} className="text-text-muted" />
            <span className="text-[11px] font-medium text-text-muted">{days.length} days</span>
          </div>
        )}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={`day-${i}`}
            className={`text-center text-[11px] font-bold py-1.5 uppercase tracking-widest ${
              i === 0 || i === 6 ? 'text-primary/40' : 'text-text-muted'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const dk = dateKey(day);
          const milkRecord = milkService ? records.find(r => r.serviceId === milkService.id && r.date === dk) : undefined;
          const paperRecord = paperService ? records.find(r => r.serviceId === paperService.id && r.date === dk) : undefined;
          const milkPaused = milkService ? isDatePaused(day, pauses, milkService.id) : false;
          const paperPaused = paperService ? isDatePaused(day, pauses, paperService.id) : false;
          const paperScheduled = paperService ? isScheduledDay(day, paperService.scheduledWeekdays) : true;
          const isToday = dk === today;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isPast = day < new Date(today + 'T00:00:00');

          return (
            <DayCell
              key={dk}
              date={day}
              dateStr={dk}
              isToday={isToday}
              isWeekend={isWeekend}
              isPast={isPast}
              hasMilkService={!!milkService}
              hasPaperService={!!paperService}
              milkStatus={milkRecord?.status}
              milkQuantity={milkRecord?.quantity}
              milkPaused={milkPaused}
              paperStatus={paperRecord?.status}
              paperPaused={paperPaused}
              paperScheduled={paperScheduled}
              onClick={() => setSelectedDate(dk)}
            />
          );
        })}
      </div>
    </div>
  );
}
