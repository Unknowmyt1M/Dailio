interface DayCellProps {
  date: Date;
  dateStr: string;
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;
  hasMilkService: boolean;
  hasPaperService: boolean;
  milkStatus?: string;
  milkQuantity?: number;
  milkPaused: boolean;
  paperStatus?: string;
  paperPaused: boolean;
  paperScheduled: boolean;
  onClick: () => void;
}

function StatusDot({ type, delivered }: { type: 'milk' | 'paper'; delivered: boolean }) {
  const color = delivered
    ? type === 'milk' ? 'bg-milk' : 'bg-newspaper'
    : 'bg-danger';
  return <div className={`w-[5px] h-[5px] rounded-full ${color}`} />;
}

function StatusDash({ type }: { type: 'milk' | 'paper' }) {
  const color = type === 'milk' ? 'bg-milk/30' : 'bg-newspaper/30';
  return <div className={`w-[5px] h-[5px] rounded-full ${color}`} />;
}

export default function DayCell({
  date,
  isToday,
  isWeekend,
  isPast,
  hasMilkService,
  hasPaperService,
  milkStatus,
  milkQuantity,
  milkPaused,
  paperStatus,
  paperPaused,
  paperScheduled,
  onClick,
}: DayCellProps) {
  const dayNum = date.getDate();
  const hasAnyRecord = (hasMilkService && milkStatus) || (hasPaperService && paperStatus);
  const milkDelivered = hasMilkService && milkStatus === 'delivered';
  const paperDelivered = hasPaperService && paperStatus === 'delivered';
  const bothDelivered = (hasMilkService && hasPaperService) ? (milkDelivered && paperDelivered) : (milkDelivered || paperDelivered);
  const anyPaused = (hasMilkService && milkPaused) || (hasPaperService && paperPaused);

  return (
    <button
      onClick={onClick}
      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-between py-1.5 text-xs transition-all duration-150 active:scale-90 ${
        isToday
          ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/20 z-10'
          : bothDelivered
          ? 'bg-success/5 border border-success/15'
          : hasAnyRecord
          ? 'bg-white border border-border/40 shadow-sm'
          : isWeekend
          ? 'bg-primary/[0.02]'
          : ''
      }`}
      aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${hasMilkService && milkStatus ? `, milk ${milkStatus}` : ''}${hasPaperService && paperStatus ? `, newspaper ${paperStatus}` : ''}`}
    >
      {/* Day number */}
      <span className={`text-[13px] leading-none font-bold ${
        isToday
          ? 'text-white'
          : isPast && !hasAnyRecord && !anyPaused
          ? 'text-text-muted'
          : isWeekend
          ? 'text-primary/60'
          : 'text-text'
      }`}>
        {dayNum}
      </span>

      {/* Status indicators */}
      <div className="flex flex-col items-center gap-[3px]">
        {/* Milk indicator */}
        {hasMilkService && (
          milkPaused ? (
            <div className="flex items-center gap-0.5">
              <div className="w-4 h-[3px] rounded-full bg-text-muted/30" />
            </div>
          ) : milkDelivered ? (
            <div className="flex items-center gap-0.5">
              <StatusDot type="milk" delivered />
              {milkQuantity && milkQuantity !== 1 && (
                <span className={`text-[8px] font-bold leading-none ${isToday ? 'text-white/80' : 'text-milk'}`}>
                  {milkQuantity}
                </span>
              )}
            </div>
          ) : milkStatus === 'not_delivered' ? (
            <div className="flex items-center gap-0.5">
              <StatusDot type="milk" delivered={false} />
            </div>
          ) : (
            <StatusDash type="milk" />
          )
        )}

        {/* Newspaper indicator */}
        {hasPaperService && paperScheduled && (
          paperPaused ? (
            <div className="w-4 h-[3px] rounded-full bg-text-muted/30" />
          ) : paperDelivered ? (
            <StatusDot type="paper" delivered />
          ) : paperStatus === 'not_delivered' ? (
            <StatusDot type="paper" delivered={false} />
          ) : (
            <StatusDash type="paper" />
          )
        )}
      </div>

      {/* Today ring effect */}
      {isToday && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 pointer-events-none" />
      )}
    </button>
  );
}
