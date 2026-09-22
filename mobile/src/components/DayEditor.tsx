import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

interface DayEditorProps {
  visible: boolean;
  date: string;
  onClose: () => void;
}

function DayEditorContent({ date, onClose }: { date: string; onClose: () => void }) {
  const { services, records, setRecord, clearRecord } = useStore();

  const dateObj = useMemo(() => new Date(date + 'T00:00:00'), [date]);
  const dayName = useMemo(() => format(dateObj, 'EEEE'), [dateObj]);
  const fullDate = useMemo(() => format(dateObj, 'd MMMM yyyy'), [dateObj]);

  const milkService = useMemo(() => services.find((s) => s.type === 'milk'), [services]);
  const newspaperService = useMemo(() => services.find((s) => s.type === 'newspaper'), [services]);

  const milkRecord = useMemo(
    () => records.find((r) => r.serviceId === milkService?.id && r.date === date),
    [records, milkService, date],
  );
  const newspaperRecord = useMemo(
    () => records.find((r) => r.serviceId === newspaperService?.id && r.date === date),
    [records, newspaperService, date],
  );

  const [milkStatus, setMilkStatus] = useState<'delivered' | 'not_delivered'>(
    (milkRecord?.status as 'delivered' | 'not_delivered') ?? 'delivered'
  );
  const [milkQty, setMilkQty] = useState(milkRecord?.quantity ?? milkService?.defaultQuantity ?? 1);
  const [milkNote, setMilkNote] = useState(milkRecord?.note ?? '');
  const [newspaperStatus, setNewspaperStatus] = useState<'delivered' | 'not_delivered'>(
    (newspaperRecord?.status as 'delivered' | 'not_delivered') ?? 'delivered'
  );
  const [newspaperNote, setNewspaperNote] = useState(newspaperRecord?.note ?? '');

  const handleSaveMilk = () => {
    if (!milkService) return;
    setRecord(milkService.id, date, milkStatus, milkStatus === 'delivered' ? milkQty : 0, milkNote);
  };

  const handleSaveNewspaper = () => {
    if (!newspaperService) return;
    setRecord(newspaperService.id, date, newspaperStatus, 1, newspaperNote);
  };

  const handleClear = () => {
    if (milkService) clearRecord(milkService.id, date);
    if (newspaperService) clearRecord(newspaperService.id, date);
    onClose();
  };

  const handleClose = () => {
    handleSaveMilk();
    handleSaveNewspaper();
    onClose();
  };

  return (
    <Pressable style={styles.overlay} onPress={handleClose}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.dayName}>{dayName}</Text>
              <Text style={styles.fullDate}>{fullDate}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Milk Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="water" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.sectionTitle}>Milk</Text>
              </View>

              <View style={styles.statusRow}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    milkStatus === 'delivered' && styles.statusButtonDeliveredMilk,
                  ]}
                  onPress={() => setMilkStatus('delivered')}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      milkStatus === 'delivered' && styles.statusButtonTextActiveMilk,
                    ]}
                  >
                    Delivered
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    milkStatus === 'not_delivered' && styles.statusButtonNotDelivered,
                  ]}
                  onPress={() => setMilkStatus('not_delivered')}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      milkStatus === 'not_delivered' && styles.statusButtonTextActive,
                    ]}
                  >
                    Not Delivered
                  </Text>
                </TouchableOpacity>
              </View>

              {milkStatus === 'delivered' && (
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setMilkQty((q) => Math.max(0.5, q - 0.5))}
                  >
                    <Ionicons name="remove" size={20} color="#4F46E5" />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{milkQty}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setMilkQty((q) => q + 0.5)}
                  >
                    <Ionicons name="add" size={20} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
              )}

              <TextInput
                style={styles.noteInput}
                placeholder="Add a note..."
                placeholderTextColor="#9CA3AF"
                value={milkNote}
                onChangeText={setMilkNote}
              />
            </View>

            {/* Newspaper Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="newspaper" size={18} color="#D97706" />
                </View>
                <Text style={styles.sectionTitle}>Newspaper</Text>
              </View>

              <View style={styles.statusRow}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    newspaperStatus === 'delivered' && styles.statusButtonDeliveredAmber,
                  ]}
                  onPress={() => setNewspaperStatus('delivered')}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      newspaperStatus === 'delivered' && styles.statusButtonTextActiveAmber,
                    ]}
                  >
                    Delivered
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    newspaperStatus === 'not_delivered' && styles.statusButtonNotDelivered,
                  ]}
                  onPress={() => setNewspaperStatus('not_delivered')}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      newspaperStatus === 'not_delivered' && styles.statusButtonTextActive,
                    ]}
                  >
                    Not Delivered
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.noteInput}
                placeholder="Add a note..."
                placeholderTextColor="#9CA3AF"
                value={newspaperNote}
                onChangeText={setNewspaperNote}
              />
            </View>
          </View>

          {/* Clear button */}
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
  );
}

export default function DayEditor({ visible, date, onClose }: DayEditorProps) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <DayEditorContent key={date} date={date} onClose={onClose} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  dayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  fullDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIconText: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  statusButtonDeliveredMilk: {
    backgroundColor: '#4F46E5',
  },
  statusButtonDeliveredAmber: {
    backgroundColor: '#F59E0B',
  },
  statusButtonNotDelivered: {
    backgroundColor: '#EF4444',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusButtonTextActiveMilk: {
    color: '#FFFFFF',
  },
  statusButtonTextActiveAmber: {
    color: '#FFFFFF',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  qtyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    minWidth: 40,
    textAlign: 'center',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    gap: 6,
    minHeight: 44,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
});
