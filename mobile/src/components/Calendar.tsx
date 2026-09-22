import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getMonthDays, getPrevMonth, getNextMonth, dateKey, isDatePaused, isScheduledDay } from '../lib/dates';
import { useStore } from '../store/useStore';
import { DayCell } from './DayCell';
import type { DeliveryStatus } from '../types';

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKEND_INDICES = [0, 6];

export function Calendar() {
  const {
    currentYear,
    currentMonth,
    services,
    records,
    pauses,
    setMonth,
    setSelectedDate,
  } = useStore();

  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const isOnCurrentMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);

  const milkService = useMemo(() => services.find(s => s.type === 'milk'), [services]);
  const paperService = useMemo(() => services.find(s => s.type === 'newspaper'), [services]);

  const prev = useMemo(() => getPrevMonth(currentYear, currentMonth), [currentYear, currentMonth]);
  const next = useMemo(() => getNextMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  const monthLabel = useMemo(() => {
    const d = new Date(currentYear, currentMonth);
    return format(d, 'MMMM yyyy');
  }, [currentYear, currentMonth]);

  // Stats for the month
  const stats = useMemo(() => {
    let milkDays = 0;
    let paperDays = 0;
    for (const day of days) {
      const dk = dateKey(day);
      if (milkService) {
        const rec = records.find(r => r.serviceId === milkService.id && r.date === dk);
        if (rec && rec.status === 'delivered') milkDays++;
      }
      if (paperService) {
        const rec = records.find(r => r.serviceId === paperService.id && r.date === dk);
        if (rec && rec.status === 'delivered') paperDays++;
      }
    }
    return { milkDays, paperDays };
  }, [days, records, milkService, paperService]);

  // Build leading empty cells to align the grid
  const firstDayOfWeek = days.length > 0 ? days[0].getDay() : 0;

  const handleDayPress = (date: Date) => {
    setSelectedDate(dateKey(date));
  };

  const handleBackToToday = () => {
    setMonth(today.getFullYear(), today.getMonth());
  };

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMonth(prev.year, prev.month)} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={22} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => setMonth(next.year, next.month)} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={22} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Back to Today */}
      {!isOnCurrentMonth && (
        <TouchableOpacity style={styles.backToToday} onPress={handleBackToToday}>
          <Ionicons name="today-outline" size={14} color="#4f46e5" />
          <Text style={styles.backToTodayText}>Back to Today</Text>
        </TouchableOpacity>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#4f46e5' }]} />
          <Text style={styles.statLabel}>Milk: {stats.milkDays} days</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.statLabel}>Paper: {stats.paperDays} days</Text>
        </View>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {DAY_HEADERS.map((label, i) => (
          <Text
            key={`dh-${i}`}
            style={[
              styles.dayHeader,
              WEEKEND_INDICES.includes(i) && styles.weekendHeader,
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {/* Leading empty cells */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.emptyCell} />
        ))}

        {days.map((day) => {
          const dk = dateKey(day);
          const recordForMilk = milkService
            ? records.find(r => r.serviceId === milkService.id && r.date === dk)
            : null;
          const recordForPaper = paperService
            ? records.find(r => r.serviceId === paperService.id && r.date === dk)
            : null;

          const milkStatus: DeliveryStatus | null = recordForMilk?.status ?? null;
          const paperStatus: DeliveryStatus | null = recordForPaper?.status ?? null;

          const milkPaused = milkService
            ? isDatePaused(day, pauses, milkService.id)
            : false;
          const paperPaused = paperService
            ? isDatePaused(day, pauses, paperService.id)
            : false;
          const paperScheduled = paperService
            ? isScheduledDay(day, paperService.scheduledWeekdays)
            : false;

          const isToday = dk === todayKey;
          const isWeekend = WEEKEND_INDICES.includes(day.getDay());
          const isPast = day < today && !isToday;

          return (
            <DayCell
              key={dk}
              date={day}
              isToday={isToday}
              isWeekend={isWeekend}
              isPast={isPast}
              milkStatus={milkStatus}
              milkQuantity={recordForMilk?.quantity ?? milkService?.defaultQuantity ?? 1}
              milkPaused={milkPaused}
              paperStatus={paperStatus}
              paperPaused={paperPaused}
              paperScheduled={paperScheduled}
              onPress={handleDayPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  arrowBtn: {
    padding: 8,
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  backToToday: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    gap: 4,
  },
  backToTodayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    paddingVertical: 4,
  },
  weekendHeader: {
    color: '#a5b4fc',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCell: {
    width: '14.28%',
    aspectRatio: 1,
  },
});
