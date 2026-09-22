import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useStore } from '../src/store/useStore';
import { dateKey } from '../src/lib/dates';
import type { DeliveryStatus } from '../src/types';

const QUANTITIES = [0.5, 1, 1.5, 2] as const;

export default function Entry() {
  const services = useStore((s) => s.services);
  const records = useStore((s) => s.records);
  const setRecord = useStore((s) => s.setRecord);
  const clearRecord = useStore((s) => s.clearRecord);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dateKey(today), [today]);
  const dateLabel = format(today, 'EEE, d MMM');

  const milkService = useMemo(
    () => services.find((s) => s.type === 'milk' && s.enabled),
    [services],
  );
  const newsService = useMemo(
    () => services.find((s) => s.type === 'newspaper' && s.enabled),
    [services],
  );

  const milkRecord = useMemo(
    () => records.find((r) => r.serviceId === milkService?.id && r.date === todayKey),
    [records, milkService?.id, todayKey],
  );
  const newsRecord = useMemo(
    () => records.find((r) => r.serviceId === newsService?.id && r.date === todayKey),
    [records, newsService?.id, todayKey],
  );

  const handleMilkQty = useCallback(
    (qty: number) => {
      if (!milkService) return;
      setRecord(milkService.id, todayKey, 'delivered', qty);
    },
    [milkService, todayKey, setRecord],
  );

  const handleMilkNotDelivered = useCallback(() => {
    if (!milkService) return;
    if (milkRecord?.status === 'not_delivered') {
      clearRecord(milkService.id, todayKey);
    } else {
      setRecord(milkService.id, todayKey, 'not_delivered', 0);
    }
  }, [milkService, milkRecord, todayKey, setRecord, clearRecord]);

  const handleNewsDelivered = useCallback(() => {
    if (!newsService) return;
    if (newsRecord?.status === 'delivered') {
      clearRecord(newsService.id, todayKey);
    } else {
      setRecord(newsService.id, todayKey, 'delivered', 1);
    }
  }, [newsService, newsRecord, todayKey, setRecord, clearRecord]);

  const handleNewsMissed = useCallback(() => {
    if (!newsService) return;
    if (newsRecord?.status === 'not_delivered') {
      clearRecord(newsService.id, todayKey);
    } else {
      setRecord(newsService.id, todayKey, 'not_delivered', 0);
    }
  }, [newsService, newsRecord, todayKey, setRecord, clearRecord]);

  const renderBadge = (status?: DeliveryStatus) => {
    if (!status || status === 'unrecorded') return null;
    const delivered = status === 'delivered';
    return (
      <View style={[styles.badge, delivered ? styles.badgeDelivered : styles.badgeMissed]}>
        <Ionicons name={delivered ? 'checkmark-circle' : 'close-circle'} size={12} color="#fff" />
        <Text style={styles.badgeText}>{delivered ? 'Done' : status === 'not_delivered' ? 'Missed' : status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.zapBox}>
              <Ionicons name="flash" size={20} color="#4338CA" />
            </View>
            <Text style={styles.headerTitle}>Quick Entry</Text>
          </View>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        {/* Milk Card */}
        {milkService && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="water" size={22} color="#4338CA" />
              </View>
              <Text style={styles.cardTitle}>{milkService.name}</Text>
              {renderBadge(milkRecord?.status)}
            </View>

            {/* Quantity row */}
            <View style={styles.qtyRow}>
              {QUANTITIES.map((qty) => {
                const active = milkRecord?.status === 'delivered' && milkRecord?.quantity === qty;
                return (
                  <TouchableOpacity
                    key={qty}
                    style={[styles.qtyBtn, active && styles.qtyBtnActive]}
                    onPress={() => handleMilkQty(qty)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.qtyBtnText, active && styles.qtyBtnTextActive]}>
                      {qty}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Not Delivered button */}
            <TouchableOpacity
              style={[
                styles.notDeliveredBtn,
                milkRecord?.status === 'not_delivered' && styles.notDeliveredBtnActive,
              ]}
              onPress={handleMilkNotDelivered}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={milkRecord?.status === 'not_delivered' ? '#fff' : '#DC2626'}
              />
              <Text
                style={[
                  styles.notDeliveredText,
                  milkRecord?.status === 'not_delivered' && styles.notDeliveredTextActive,
                ]}
              >
                Not Delivered
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Newspaper Card */}
        {newsService && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="newspaper" size={22} color="#D97706" />
              </View>
              <Text style={styles.cardTitle}>{newsService.name}</Text>
              {renderBadge(newsRecord?.status)}
            </View>

            <View style={styles.newsRow}>
              <TouchableOpacity
                style={[
                  styles.newsBtn,
                  newsRecord?.status === 'delivered' && styles.newsBtnDeliveredActive,
                ]}
                onPress={handleNewsDelivered}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={newsRecord?.status === 'delivered' ? '#fff' : '#16A34A'}
                />
                <Text
                  style={[
                    styles.newsBtnText,
                    newsRecord?.status === 'delivered' && styles.newsBtnTextActive,
                  ]}
                >
                  Delivered
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.newsBtn,
                  newsRecord?.status === 'not_delivered' && styles.newsBtnMissedActive,
                ]}
                onPress={handleNewsMissed}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={newsRecord?.status === 'not_delivered' ? '#fff' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.newsBtnText,
                    newsRecord?.status === 'not_delivered' && styles.newsBtnTextActive,
                  ]}
                >
                  Missed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* No services fallback */}
        {!milkService && !newsService && (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No services enabled.</Text>
            <Text style={styles.emptySubtext}>Add services in Settings to start tracking.</Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zapBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeDelivered: {
    backgroundColor: '#16A34A',
  },
  badgeMissed: {
    backgroundColor: '#DC2626',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  qtyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  qtyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qtyBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  qtyBtnTextActive: {
    color: '#fff',
  },
  notDeliveredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  notDeliveredBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  notDeliveredText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  notDeliveredTextActive: {
    color: '#fff',
  },
  newsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  newsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  newsBtnDeliveredActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  newsBtnMissedActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  newsBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  newsBtnTextActive: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
