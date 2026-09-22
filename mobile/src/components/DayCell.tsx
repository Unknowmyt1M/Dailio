import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { DeliveryStatus } from '../types';

export interface DayCellProps {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;
  milkStatus: DeliveryStatus | null;
  milkQuantity: number;
  milkPaused: boolean;
  paperStatus: DeliveryStatus | null;
  paperPaused: boolean;
  paperScheduled: boolean;
  onPress: (date: Date) => void;
}

function getStatusColor(status: DeliveryStatus | null): string {
  if (!status) return 'transparent';
  switch (status) {
    case 'delivered': return '#22c55e';
    case 'not_delivered': return '#ef4444';
    case 'paused': return '#9ca3af';
    case 'not_scheduled': return 'transparent';
    case 'unrecorded': return '#d1d5db';
    default: return 'transparent';
  }
}

function PausedIndicator() {
  return (
    <View style={styles.pausedDot}>
      <Text style={styles.pausedDash}>-</Text>
    </View>
  );
}

export function DayCell({
  date,
  isToday,
  isWeekend,
  isPast: _isPast,
  milkStatus,
  milkQuantity,
  milkPaused,
  paperStatus,
  paperPaused,
  paperScheduled,
  onPress,
}: DayCellProps) {
  const dayNumber = date.getDate();

  const containerStyle = [
    styles.cell,
    isToday && styles.todayCell,
    !isToday && isWeekend && styles.weekendCell,
    !isToday && milkStatus && milkStatus !== 'not_scheduled' ? styles.hasRecordCell : null,
  ];

  const textStyle = [
    styles.dayText,
    isToday && styles.todayText,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={() => onPress(date)}
      activeOpacity={0.7}
    >
      <Text style={textStyle}>{dayNumber}</Text>
      <View style={styles.dotsRow}>
        {/* Milk indicator */}
        {milkPaused ? (
          <PausedIndicator />
        ) : (
          <View
            style={[
              styles.dot,
              { backgroundColor: getStatusColor(milkStatus) },
            ]}
          />
        )}
        {/* Quantity text next to milk dot */}
        {milkStatus === 'delivered' && milkQuantity !== 1 && (
          <Text style={styles.quantityText}>{milkQuantity}</Text>
        )}
        {/* Newspaper indicator */}
        {paperScheduled && (
          paperPaused ? (
            <PausedIndicator />
          ) : (
            <View
              style={[
                styles.dot,
                { backgroundColor: getStatusColor(paperStatus) },
              ]}
            />
          )
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 4,
  },
  todayCell: {
    backgroundColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  weekendCell: {
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
  },
  hasRecordCell: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pausedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedDash: {
    fontSize: 6,
    lineHeight: 7,
    color: '#9ca3af',
    fontWeight: '700',
  },
  quantityText: {
    fontSize: 8,
    color: '#6b7280',
    fontWeight: '600',
  },
});
