import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { calculateMonthlyHisaab, formatCurrency } from '../src/lib/billing';
import { dateKey, isDatePaused, getApplicableRate } from '../src/lib/dates';

export default function HomeDashboard() {
  const router = useRouter();
  const household = useStore((s) => s.household);
  const services = useStore((s) => s.services);
  const records = useStore((s) => s.records);
  const rates = useStore((s) => s.rates);
  const pauses = useStore((s) => s.pauses);
  const payments = useStore((s) => s.payments);
  const currentYear = useStore((s) => s.currentYear);
  const currentMonth = useStore((s) => s.currentMonth);
  const setRecord = useStore((s) => s.setRecord);
  const clearRecord = useStore((s) => s.clearRecord);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayKeyStr = useMemo(() => dateKey(today), [today]);
  const todayLabel = useMemo(() => format(today, 'EEEE, d MMMM'), [today]);

  // Active services
  const milkService = useMemo(() => services.find((s) => s.type === 'milk' && s.enabled), [services]);
  const paperService = useMemo(() => services.find((s) => s.type === 'newspaper' && s.enabled), [services]);

  // Today's records
  const milkRecord = useMemo(
    () => (milkService ? records.find((r) => r.serviceId === milkService.id && r.date === todayKeyStr) : undefined),
    [records, milkService, todayKeyStr]
  );
  const paperRecord = useMemo(
    () => (paperService ? records.find((r) => r.serviceId === paperService.id && r.date === todayKeyStr) : undefined),
    [records, paperService, todayKeyStr]
  );

  const defaultMilkQty = milkService?.defaultQuantity ?? 1;

  // 1-Click Milk Handler (using default onboarding quantity)
  const handleToggleMilkDefault = useCallback(() => {
    if (!milkService) return;
    if (milkRecord?.status === 'delivered') {
      clearRecord(milkService.id, todayKeyStr);
      showToast('Milk reset to pending');
    } else {
      setRecord(milkService.id, todayKeyStr, 'delivered', defaultMilkQty);
      showToast(`Recorded ${defaultMilkQty}${milkService.unit} milk!`);
    }
  }, [milkService, milkRecord, defaultMilkQty, todayKeyStr, clearRecord, setRecord, showToast]);

  const handleSetMilkQty = useCallback(
    (qty: number) => {
      if (!milkService) return;
      setRecord(milkService.id, todayKeyStr, 'delivered', qty);
      showToast(`Milk updated to ${qty}${milkService.unit}`);
    },
    [milkService, todayKeyStr, setRecord, showToast]
  );

  const handleSetMilkMissed = useCallback(() => {
    if (!milkService) return;
    if (milkRecord?.status === 'not_delivered') {
      clearRecord(milkService.id, todayKeyStr);
      showToast('Milk reset to pending');
    } else {
      setRecord(milkService.id, todayKeyStr, 'not_delivered', 0);
      showToast('Milk marked as missed today');
    }
  }, [milkService, milkRecord, todayKeyStr, clearRecord, setRecord, showToast]);

  // 1-Click Newspaper Handler
  const handleTogglePaper = useCallback(() => {
    if (!paperService) return;
    if (paperRecord?.status === 'delivered') {
      clearRecord(paperService.id, todayKeyStr);
      showToast('Newspaper reset to pending');
    } else {
      setRecord(paperService.id, todayKeyStr, 'delivered', 1);
      showToast('Newspaper marked as delivered!');
    }
  }, [paperService, paperRecord, todayKeyStr, clearRecord, setRecord, showToast]);

  const handleSetPaperMissed = useCallback(() => {
    if (!paperService) return;
    if (paperRecord?.status === 'not_delivered') {
      clearRecord(paperService.id, todayKeyStr);
      showToast('Newspaper reset to pending');
    } else {
      setRecord(paperService.id, todayKeyStr, 'not_delivered', 0);
      showToast('Newspaper marked as missed');
    }
  }, [paperService, paperRecord, todayKeyStr, clearRecord, setRecord, showToast]);

  // This Week Strip (Last 7 days ending with today)
  const weekDays = useMemo(() => {
    const start = subDays(today, 6);
    return eachDayOfInterval({ start, end: today });
  }, [today]);

  // Progress summary
  const totalActive = (milkService ? 1 : 0) + (paperService ? 1 : 0);
  const recordedCount = (milkRecord ? 1 : 0) + (paperRecord ? 1 : 0);
  const allDelivered = (milkRecord?.status === 'delivered' || !milkService) && (paperRecord?.status === 'delivered' || !paperService);

  // Live Month Hisaab
  const hisaab = useMemo(
    () => calculateMonthlyHisaab(services, records, rates, pauses, payments, currentYear, currentMonth),
    [services, records, rates, pauses, payments, currentYear, currentMonth]
  );

  const milkSummary = hisaab.summaries.find((s) => s.serviceType === 'milk');
  const paperSummary = hisaab.summaries.find((s) => s.serviceType === 'newspaper');

  // Rates
  const todayMilkRate = milkService ? getApplicableRate(milkService.id, rates, today) : undefined;
  const todayPaperRate = paperService ? getApplicableRate(paperService.id, rates, today) : undefined;

  const currentMilkQty = milkRecord?.status === 'delivered' ? milkRecord.quantity : defaultMilkQty;
  const currentMilkCostMinor = todayMilkRate ? Math.round(currentMilkQty * todayMilkRate.amountMinor) : 0;
  const currentPaperCostMinor = todayPaperRate ? todayPaperRate.amountMinor : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Toast Notification */}
      {toastMsg && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* App Header */}
        <View style={styles.appHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <Ionicons name="calendar" size={22} color="#fff" />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.appTitle}>Dailio</Text>
                <View style={styles.homeBadge}>
                  <Text style={styles.homeBadgeText}>HOME</Text>
                </View>
              </View>
              <Text style={styles.appSubtitle}>{household?.name || 'Household Tracker'}</Text>
            </View>
          </View>

          {/* Status Badge */}
          {totalActive > 0 && recordedCount === totalActive && allDelivered ? (
            <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
              <Text style={[styles.statusBadgeText, { color: '#16A34A' }]}>All Done</Text>
            </View>
          ) : totalActive > 0 && recordedCount > 0 ? (
            <View style={[styles.statusBadge, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
              <Text style={[styles.statusBadgeText, { color: '#4338CA' }]}>
                {recordedCount}/{totalActive} Logged
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
              <Text style={[styles.statusBadgeText, { color: '#6B7280' }]}>Pending Today</Text>
            </View>
          )}
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.welcomeTitle}>Today's Deliveries</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A' }}>
              <Ionicons name="flash" size={11} color="#D97706" />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#D97706' }}>Quick Log</Text>
            </View>
          </View>
          <Text style={styles.welcomeSubtitle}>{todayLabel}</Text>
        </View>

        {/* 🔝 1. THIS WEEK STRIP (TOP) */}
        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>THIS WEEK</Text>
            <TouchableOpacity
              onPress={() => router.push('/calendar')}
              style={styles.weekLink}
              activeOpacity={0.7}
            >
              <Text style={styles.weekLinkText}>Full Calendar</Text>
              <Ionicons name="chevron-forward" size={13} color="#4F46E5" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day) => {
              const dk = dateKey(day);
              const isToday = dk === todayKeyStr;
              const dayLetter = format(day, 'EEEEEE');
              const dayNum = day.getDate();

              const mRec = milkService ? records.find((r) => r.serviceId === milkService.id && r.date === dk) : undefined;
              const pRec = paperService ? records.find((r) => r.serviceId === paperService.id && r.date === dk) : undefined;
              const mPaused = milkService ? isDatePaused(day, pauses, milkService.id) : false;
              const pPaused = paperService ? isDatePaused(day, pauses, paperService.id) : false;

              const mDel = mRec?.status === 'delivered';
              const pDel = pRec?.status === 'delivered';
              const mMiss = mRec?.status === 'not_delivered';
              const pMiss = pRec?.status === 'not_delivered';

              return (
                <TouchableOpacity
                  key={dk}
                  onPress={() => router.push('/calendar')}
                  activeOpacity={0.8}
                  style={[
                    styles.weekDayCell,
                    isToday && styles.weekDayCellToday,
                    (mDel || pDel) && !isToday && styles.weekDayCellDelivered,
                    (mMiss || pMiss) && !isToday && styles.weekDayCellMissed,
                  ]}
                >
                  <Text style={[styles.weekDayLetter, isToday && { color: '#4338CA', fontWeight: '700' }]}>
                    {dayLetter}
                  </Text>
                  <Text style={[styles.weekDayNum, isToday && { color: '#4338CA', fontWeight: '800' }]}>
                    {dayNum}
                  </Text>
                  <View style={styles.weekDayDot}>
                    {mPaused || pPaused ? (
                      <Text style={{ fontSize: 7, fontWeight: '700', color: '#9CA3AF' }}>PAUSE</Text>
                    ) : mDel && pDel ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                        <Ionicons name="water" size={8} color="#3B82F6" />
                        <Ionicons name="newspaper" size={8} color="#D97706" />
                      </View>
                    ) : mDel ? (
                      <Ionicons name="water" size={9} color="#3B82F6" />
                    ) : pDel ? (
                      <Ionicons name="newspaper" size={9} color="#D97706" />
                    ) : mMiss || pMiss ? (
                      <Ionicons name="close-circle" size={9} color="#DC2626" />
                    ) : (
                      <Text style={{ fontSize: 9, color: '#D1D5DB' }}>·</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ⚡ 2. 1-CLICK TODAY QUICK LOGGING */}
        {/* Milk Card */}
        {milkService && (
          <View style={styles.actionCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="water" size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.cardTitle}>{milkService.name}</Text>
                  {milkRecord?.status === 'delivered' ? (
                    <View style={styles.badgeDelivered}>
                      <Ionicons name="checkmark-circle" size={11} color="#fff" />
                      <Text style={styles.badgeText}>{milkRecord.quantity}{milkService.unit} Done</Text>
                    </View>
                  ) : milkRecord?.status === 'not_delivered' ? (
                    <View style={styles.badgeMissed}>
                      <Text style={styles.badgeText}>Missed</Text>
                    </View>
                  ) : (
                    <View style={styles.badgePending}>
                      <Text style={styles.badgePendingText}>Pending</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtext}>
                  Default: <Text style={{ fontWeight: '700' }}>{defaultMilkQty}{milkService.unit}</Text> @ ₹
                  {todayMilkRate ? (todayMilkRate.amountMinor / 100).toFixed(0) : '60'}/{milkService.unit}
                </Text>
              </View>
              <Text style={styles.cardCost}>{formatCurrency(currentMilkCostMinor)}</Text>
            </View>

            {/* Main 1-Click Button (uses Onboarding Default Quantity) */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleToggleMilkDefault}
                activeOpacity={0.8}
                style={[
                  styles.oneClickBtn,
                  milkRecord?.status === 'delivered' ? styles.oneClickBtnDone : styles.oneClickBtnPrimary,
                ]}
              >
                <Ionicons
                  name={milkRecord?.status === 'delivered' ? 'checkmark-circle' : 'flash'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.oneClickBtnText}>
                  {milkRecord?.status === 'delivered'
                    ? `${milkRecord.quantity}${milkService.unit} Delivered (Undo)`
                    : `Record Milk (${defaultMilkQty}${milkService.unit} Default)`}
                </Text>
              </TouchableOpacity>

              {/* Quick overrides */}
              {[0.5, 1, 2].filter((q) => q !== defaultMilkQty).slice(0, 2).map((qty) => (
                <TouchableOpacity
                  key={qty}
                  onPress={() => handleSetMilkQty(qty)}
                  activeOpacity={0.7}
                  style={[
                    styles.miniQtyBtn,
                    milkRecord?.status === 'delivered' && milkRecord.quantity === qty && styles.miniQtyBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.miniQtyBtnText,
                      milkRecord?.status === 'delivered' && milkRecord.quantity === qty && styles.miniQtyBtnTextActive,
                    ]}
                  >
                    {qty}{milkService.unit}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={handleSetMilkMissed}
                activeOpacity={0.7}
                style={[styles.miniMissBtn, milkRecord?.status === 'not_delivered' && styles.miniMissBtnActive]}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={milkRecord?.status === 'not_delivered' ? '#fff' : '#DC2626'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Newspaper Card */}
        {paperService && (
          <View style={styles.actionCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="newspaper" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.cardTitle}>{paperService.name}</Text>
                  {paperRecord?.status === 'delivered' ? (
                    <View style={styles.badgeDelivered}>
                      <Ionicons name="checkmark-circle" size={11} color="#fff" />
                      <Text style={styles.badgeText}>Delivered</Text>
                    </View>
                  ) : paperRecord?.status === 'not_delivered' ? (
                    <View style={styles.badgeMissed}>
                      <Text style={styles.badgeText}>Missed</Text>
                    </View>
                  ) : (
                    <View style={styles.badgePending}>
                      <Text style={styles.badgePendingText}>Pending</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtext}>
                  Daily delivery · ₹{todayPaperRate ? (todayPaperRate.amountMinor / 100).toFixed(0) : '8'}/day
                </Text>
              </View>
              <Text style={styles.cardCost}>{formatCurrency(currentPaperCostMinor)}</Text>
            </View>

            {/* Newspaper 1-Click Action */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleTogglePaper}
                activeOpacity={0.8}
                style={[
                  styles.oneClickBtn,
                  paperRecord?.status === 'delivered' ? styles.oneClickBtnDone : styles.oneClickBtnAmber,
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.oneClickBtnText}>
                  {paperRecord?.status === 'delivered' ? 'Delivered (Tap to Undo)' : 'Mark Delivered'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSetPaperMissed}
                activeOpacity={0.7}
                style={[styles.paperMissBtn, paperRecord?.status === 'not_delivered' && styles.paperMissBtnActive]}
              >
                <Text
                  style={[
                    styles.paperMissBtnText,
                    paperRecord?.status === 'not_delivered' && styles.paperMissBtnTextActive,
                  ]}
                >
                  Missed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 💰 3. LIVE MONTH HISAAB CARD */}
        <View style={styles.hisaabCard}>
          <View style={styles.hisaabHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.hisaabDot} />
              <Text style={styles.hisaabTitle}>
                {format(new Date(currentYear, currentMonth), 'MMMM').toUpperCase()} HISAAB
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/hisaab')}
              style={styles.weekLink}
              activeOpacity={0.7}
            >
              <Text style={styles.weekLinkText}>Full Hisaab</Text>
              <Ionicons name="chevron-forward" size={14} color="#4338CA" />
            </TouchableOpacity>
          </View>

          <View style={styles.hisaabGrid}>
            <View style={styles.hisaabCol}>
              <Text style={styles.hisaabLabel}>TOTAL BILL</Text>
              <Text style={styles.hisaabValue}>{formatCurrency(hisaab.totalMinor)}</Text>
              <Text style={styles.hisaabSub}>
                {milkSummary ? `${milkSummary.billableQuantity}${milkSummary.unit}` : ''}
              </Text>
            </View>

            <View style={[styles.hisaabCol, styles.hisaabColBorder]}>
              <Text style={[styles.hisaabLabel, { color: '#16A34A' }]}>PAID</Text>
              <Text style={[styles.hisaabValue, { color: '#16A34A' }]}>
                {formatCurrency(hisaab.paidMinor)}
              </Text>
              <Text style={[styles.hisaabSub, { color: '#16A34A' }]}>
                {payments.filter((p) => p.billingPeriod === hisaab.period).length} payments
              </Text>
            </View>

            <View style={styles.hisaabCol}>
              <Text style={[styles.hisaabLabel, { color: '#DC2626' }]}>DUE</Text>
              <Text style={[styles.hisaabValue, { color: '#DC2626' }]}>
                {formatCurrency(hisaab.dueMinor)}
              </Text>
              <Text style={[styles.hisaabSub, { color: '#DC2626' }]}>Remaining</Text>
            </View>
          </View>

          <View style={styles.hisaabFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              {milkSummary && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="water" size={12} color="#3B82F6" />
                  <Text style={styles.hisaabBreakdown}>{milkSummary.billableQuantity} {milkSummary.unit}</Text>
                </View>
              )}
              {milkSummary && paperSummary && <Text style={{ color: '#9CA3AF' }}>·</Text>}
              {paperSummary && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="newspaper" size={12} color="#D97706" />
                  <Text style={styles.hisaabBreakdown}>{paperSummary.billableQuantity} days</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => router.push('/hisaab')}
              style={styles.recordPaymentBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.recordPaymentText}>+ Record Payment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🚀 4. QUICK UTILITIES */}
        <View style={styles.quickUtilsRow}>
          <TouchableOpacity
            onPress={() => router.push('/calendar')}
            style={styles.utilBtn}
            activeOpacity={0.7}
          >
            <View style={[styles.utilIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="pause" size={16} color="#4338CA" />
            </View>
            <View>
              <Text style={styles.utilTitle}>Pause Delivery</Text>
              <Text style={styles.utilSub}>Vacation / holiday</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/calendar')}
            style={styles.utilBtn}
            activeOpacity={0.7}
          >
            <View style={[styles.utilIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="layers" size={16} color="#D97706" />
            </View>
            <View>
              <Text style={styles.utilTitle}>Bulk Entry</Text>
              <Text style={styles.utilSub}>Fill date range</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
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
  toast: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  homeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  homeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  welcomeSection: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  weekCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  weekLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  weekLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
  },
  weekDayCell: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 2,
  },
  weekDayCellToday: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
    borderWidth: 1.5,
  },
  weekDayCellDelivered: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  weekDayCellMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  weekDayLetter: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekDayNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  weekDayDot: {
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  cardCost: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  badgeDelivered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16A34A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeMissed: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgePending: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  badgePendingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oneClickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  oneClickBtnPrimary: {
    backgroundColor: '#4338CA',
  },
  oneClickBtnDone: {
    backgroundColor: '#16A34A',
  },
  oneClickBtnAmber: {
    backgroundColor: '#D97706',
  },
  oneClickBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  miniQtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  miniQtyBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  miniQtyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  miniQtyBtnTextActive: {
    color: '#fff',
  },
  miniMissBtn: {
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  miniMissBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  paperMissBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paperMissBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  paperMissBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  paperMissBtnTextActive: {
    color: '#fff',
  },
  hisaabCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  hisaabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  hisaabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4338CA',
  },
  hisaabTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  hisaabGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  hisaabCol: {
    flex: 1,
    alignItems: 'center',
  },
  hisaabColBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  hisaabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  hisaabValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  hisaabSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  hisaabFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  hisaabBreakdown: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  recordPaymentBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recordPaymentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  quickUtilsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
    marginTop: 6,
  },
  utilBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  utilIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  utilTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  utilSub: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});
