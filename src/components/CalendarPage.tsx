import Calendar from './Calendar';
import BulkEntry from './BulkEntry';
import PauseEntry from './PauseEntry';
import { CalendarDays } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="pt-4 max-w-lg mx-auto space-y-5">
      {/* App & Page header */}
      <div className="px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25 text-white">
            <CalendarDays size={22} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Delivery Calendar</h1>
            <p className="text-[11px] text-text-muted font-medium -mt-0.5">
              Tap any date to edit or review
            </p>
          </div>
        </div>
      </div>

      <Calendar />

      {/* Divider */}
      <div className="px-4">
        <div className="h-px bg-border/60" />
      </div>

      <BulkEntry />

      {/* Divider */}
      <div className="px-4">
        <div className="h-px bg-border/60" />
      </div>

      <PauseEntry />

      {/* Bottom spacing for nav */}
      <div className="h-8" />
    </div>
  );
}
