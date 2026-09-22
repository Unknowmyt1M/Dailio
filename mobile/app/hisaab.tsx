import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useStore } from '../src/store/useStore';
import { calculateMonthlyHisaab, formatCurrency } from '../src/lib/billing';
import { getPrevMonth, getNextMonth } from '../src/lib/dates';

export default function Hisaab() {
  const services = useStore((s) => s.services);
  const records = useStore((s) => s.records);
  const rates = useStore((s) => s.rates);
  const pauses = useStore((s) => s.pauses);
  const payments = useStore((s) => s.payments);
  const currentYear = useStore((s) => s.currentYear);
  const currentMonth = useStore((s) => s.currentMonth);
  const setMonth = useStore((s) => s.setMonth);
  const addPayment = useStore((s) => s.addPayment);
  const removePayment = useStore((s) => s.removePayment);

  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  const period = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const hisaab = useMemo(
    () => calculateMonthlyHisaab(services, records, rates, pauses, payments, currentYear, currentMonth),
    [services, records, rates, pauses, payments, currentYear, currentMonth],
  );

  const monthPayments = useMemo(
    () => payments.filter((p) => p.billingPeriod === period),
    [payments, period],
  );

  const monthLabel = useMemo(
    () => format(new Date(currentYear, currentMonth), 'MMMM yyyy'),
    [currentYear, currentMonth],
  );

  const handlePrev = useCallback(() => {
    const prev = getPrevMonth(currentYear, currentMonth);
    setMonth(prev.year, prev.month);
  }, [currentYear, currentMonth, setMonth]);

  const handleNext = useCallback(() => {
    const next = getNextMonth(currentYear, currentMonth);
    setMonth(next.year, next.month);
  }, [currentYear, currentMonth, setMonth]);

  const handleSavePayment = useCallback(() => {
    const val = parseFloat(payAmount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Validation', 'Please enter a valid amount.');
      return;
    }
    const amountMinor = Math.round(val * 100);
    addPayment(amountMinor, payNote.trim());
    setPayAmount('');
    setPayNote('');
    setShowPayForm(false);
  }, [payAmount, payNote, addPayment]);

  const handleDeletePayment = useCallback(
    (id: string) => {
      Alert.alert('Delete Payment', 'Are you sure you want to remove this payment entry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removePayment(id) },
      ]);
    },
    [removePayment],
  );

  const handleShare = useCallback(async () => {
    const lines: string[] = [`Hisaab for ${monthLabel}`, ''];
    for (const s of hisaab.summaries) {
      const rate = formatCurrency(s.rateMinor);
      const sub = formatCurrency(s.subtotalMinor);
      lines.push(`${s.serviceName}: ${s.billableQuantity} x ${rate} = ${sub}`);
    }
    lines.push('');
    lines.push(`Total: ${formatCurrency(hisaab.totalMinor)}`);
    lines.push(`Paid: ${formatCurrency(hisaab.paidMinor)}`);
    if (hisaab.dueMinor > 0) {
      lines.push(`Due: ${formatCurrency(hisaab.dueMinor)}`);
    }
    await Share.share({ message: lines.join('\n') });
  }, [monthLabel, hisaab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={handlePrev} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#4338CA" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={handleNext} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={24} color="#4338CA" />
          </TouchableOpacity>
        </View>

        {/* Billing Card */}
        <View style={styles.card}>
          {hisaab.summaries.map((summary, i) => (
            <View key={summary.serviceName + i}>
              <View style={styles.serviceRow}>
                <View style={styles.serviceLeft}>
                  <View
                    style={[
                      styles.serviceIcon,
                      {
                        backgroundColor:
                          summary.serviceType === 'milk' ? '#E0E7FF' : '#FEF3C7',
                      },
                    ]}
                  >
                    <Ionicons
                      name={summary.serviceType === 'milk' ? 'water' : 'newspaper'}
                      size={18}
                      color={summary.serviceType === 'milk' ? '#4338CA' : '#D97706'}
                    />
                  </View>
                  <Text style={styles.serviceName}>{summary.serviceName}</Text>
                </View>
                <Text style={styles.serviceCalc}>
                  {summary.billableQuantity} x {formatCurrency(summary.rateMinor)} ={' '}
                  <Text style={styles.serviceSubtotal}>
                    {formatCurrency(summary.subtotalMinor)}
                  </Text>
                </Text>
              </View>
              {i < hisaab.summaries.length - 1 && <View style={styles.divider} />}
            </View>
          ))}

          {hisaab.summaries.length === 0 && (
            <Text style={styles.emptyText}>No enabled services to calculate.</Text>
          )}

          {/* Totals Section */}
          {hisaab.summaries.length > 0 && (
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(hisaab.totalMinor)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#16A34A' }]}>Paid</Text>
                <Text style={[styles.totalValue, { color: '#16A34A' }]}>
                  {formatCurrency(hisaab.paidMinor)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#DC2626' }]}>Due</Text>
                <Text style={[styles.totalValue, { color: '#DC2626' }]}>
                  {formatCurrency(hisaab.dueMinor)}
                </Text>
              </View>

              {/* Record Payment button */}
              <TouchableOpacity
                style={styles.recordPayBtn}
                onPress={() => {
                  setPayAmount(hisaab.dueMinor > 0 ? (hisaab.dueMinor / 100).toFixed(0) : '');
                  setShowPayForm(!showPayForm);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={18} color="#16A34A" />
                <Text style={styles.recordPayBtnText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Inline Payment Form */}
        {showPayForm && (
          <View style={styles.payFormCard}>
            <View style={styles.payFormHeader}>
              <Text style={styles.payFormTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowPayForm(false)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <Text style={styles.formLabel}>Note (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. GPay, Cash"
              placeholderTextColor="#9CA3AF"
              value={payNote}
              onChangeText={setPayNote}
            />

            <TouchableOpacity style={styles.savePayBtn} onPress={handleSavePayment} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.savePayBtnText}>Save Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment History Card */}
        {monthPayments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.historyTitle}>Payments This Month</Text>
            {monthPayments.map((p, idx) => (
              <View key={p.id}>
                <View style={styles.paymentRow}>
                  <View>
                    <Text style={styles.paymentAmount}>{formatCurrency(p.amountMinor)}</Text>
                    <Text style={styles.paymentMeta}>
                      {p.paidAt ? format(new Date(p.paidAt), 'd MMM') : ''}
                      {p.note ? ` · ${p.note}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => handleDeletePayment(p.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
                {idx < monthPayments.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        {/* Share Button */}
        {hisaab.summaries.length > 0 && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>Share Summary</Text>
          </TouchableOpacity>
        )}
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
    padding: 20,
    paddingBottom: 32,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    minWidth: 160,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  serviceCalc: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceSubtotal: {
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  totalsSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  recordPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 8,
    gap: 6,
  },
  recordPayBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  payFormCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  payFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  payFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  savePayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  savePayBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  paymentMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  trashBtn: {
    padding: 6,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  shareBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
