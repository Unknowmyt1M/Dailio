import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Calendar } from '../src/components/Calendar';
import DayEditor from '../src/components/DayEditor';
import { useStore } from '../src/store/useStore';
import { dateKey } from '../src/lib/dates';

export default function CalendarScreen() {
  const services = useStore((s) => s.services);
  const selectedDate = useStore((s) => s.selectedDate);
  const setSelectedDate = useStore((s) => s.setSelectedDate);
  const setBulkRecords = useStore((s) => s.setBulkRecords);
  const addPause = useStore((s) => s.addPause);

  const today = useMemo(() => new Date(), []);
  const todayKeyStr = useMemo(() => dateKey(today), [today]);
  const todayLabel = useMemo(() => format(today, 'EEE, d MMM'), [today]);

  // DayEditor state
  const editorVisible = selectedDate !== null;
  const editorDate = selectedDate ?? todayKeyStr;
  const handleEditorClose = useCallback(() => setSelectedDate(null), [setSelectedDate]);

  // Bulk Entry
  const [bulkExpanded, setBulkExpanded] = useState(false);
  const [bulkServiceId, setBulkServiceId] = useState('');
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkStatus, setBulkStatus] = useState<'delivered' | 'not_delivered'>('delivered');
  const [bulkQty, setBulkQty] = useState('1');

  const handleBulkApply = useCallback(() => {
    if (!bulkServiceId || !bulkStart || !bulkEnd) return;
    const qty = parseFloat(bulkQty);
    if (isNaN(qty) || qty <= 0) return;
    setBulkRecords(bulkServiceId, bulkStart, bulkEnd, bulkStatus, qty, null, false);
  }, [bulkServiceId, bulkStart, bulkEnd, bulkStatus, bulkQty, setBulkRecords]);

  // Pause
  const [pauseExpanded, setPauseExpanded] = useState(false);
  const [pauseServiceId, setPauseServiceId] = useState('');
  const [pauseStart, setPauseStart] = useState('');
  const [pauseEnd, setPauseEnd] = useState('');
  const [pauseReason, setPauseReason] = useState('');

  const handleAddPause = useCallback(() => {
    if (!pauseServiceId || !pauseStart || !pauseEnd) return;
    addPause(pauseServiceId, pauseStart, pauseEnd, pauseReason.trim());
    setPauseStart('');
    setPauseEnd('');
    setPauseReason('');
  }, [pauseServiceId, pauseStart, pauseEnd, pauseReason, addPause]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* App Header */}
        <View style={styles.appHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <Ionicons name="calendar" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.appTitle}>Calendar</Text>
              <Text style={styles.appSubtitle}>Tap any date to review or edit</Text>
            </View>
          </View>
          <Text style={styles.dateLabel}>{todayLabel}</Text>
        </View>

        {/* Calendar */}
        <Calendar />

        {/* DayEditor */}
        <DayEditor visible={editorVisible} date={editorDate} onClose={handleEditorClose} />

        {/* Bulk Entry Section */}
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setBulkExpanded(!bulkExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleLeft}>
            <Ionicons name="layers" size={18} color="#4338CA" />
            <Text style={styles.collapsibleTitle}>Bulk Entry</Text>
          </View>
          <Ionicons
            name={bulkExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        {bulkExpanded && (
          <View style={styles.card}>
            <Text style={styles.formLabel}>Service</Text>
            <View style={styles.typeRow}>
              {services.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.typeBtn, bulkServiceId === s.id && styles.typeBtnActive]}
                  onPress={() => setBulkServiceId(s.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeBtnText, bulkServiceId === s.id && styles.typeBtnTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={bulkStart}
              onChangeText={setBulkStart}
            />

            <Text style={styles.formLabel}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={bulkEnd}
              onChangeText={setBulkEnd}
            />

            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, bulkStatus === 'delivered' && styles.typeBtnGreen]}
                onPress={() => setBulkStatus('delivered')}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeBtnText, bulkStatus === 'delivered' && styles.typeBtnTextActive]}>
                  Delivered
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, bulkStatus === 'not_delivered' && styles.typeBtnRed]}
                onPress={() => setBulkStatus('not_delivered')}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeBtnText, bulkStatus === 'not_delivered' && styles.typeBtnTextActive]}>
                  Not Delivered
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={bulkQty}
              onChangeText={setBulkQty}
            />

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleBulkApply}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pause Section */}
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setPauseExpanded(!pauseExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleLeft}>
            <Ionicons name="pause-circle" size={18} color="#D97706" />
            <Text style={styles.collapsibleTitle}>Add Pause</Text>
          </View>
          <Ionicons
            name={pauseExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        {pauseExpanded && (
          <View style={styles.card}>
            <Text style={styles.formLabel}>Service</Text>
            <View style={styles.typeRow}>
              {services.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.typeBtn, pauseServiceId === s.id && styles.typeBtnActive]}
                  onPress={() => setPauseServiceId(s.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeBtnText, pauseServiceId === s.id && styles.typeBtnTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={pauseStart}
              onChangeText={setPauseStart}
            />

            <Text style={styles.formLabel}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={pauseEnd}
              onChangeText={setPauseEnd}
            />

            <Text style={styles.formLabel}>Reason</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Out of town"
              placeholderTextColor="#9CA3AF"
              value={pauseReason}
              onChangeText={setPauseReason}
            />

            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={handleAddPause}
              activeOpacity={0.8}
            >
              <Ionicons name="pause-circle" size={20} color="#fff" />
              <Text style={styles.pauseBtnText}>Add Pause</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    paddingBottom: 32,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  collapsibleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsibleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  typeBtnGreen: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  typeBtnRed: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 6,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 6,
  },
  pauseBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
