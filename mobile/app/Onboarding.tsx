import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store/useStore';
import { v4 as uuid } from 'uuid';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState('');

  // Step 1 - Milk
  const [milkEnabled, setMilkEnabled] = useState(true);
  const [milkQty, setMilkQty] = useState('1');
  const [milkUnit, setMilkUnit] = useState<'Litre' | 'ml'>('Litre');
  const [milkRate, setMilkRate] = useState('60');

  // Step 1 - Newspaper
  const [newsEnabled, setNewsEnabled] = useState(false);
  const [newsRate, setNewsRate] = useState('15');

  const { setHousehold, addService, addRate, setSetupComplete } = useStore();

  const handleGetStarted = () => {
    const householdId = uuid();
    const now = new Date().toISOString();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    setHousehold({
      id: householdId,
      name: householdName.trim() || 'My Household',
      currency: 'INR',
      timezone: tz,
      locale: 'en-IN',
      createdAt: now,
      updatedAt: now,
    });

    if (milkEnabled) {
      const milkServiceId = addService({
        householdId,
        type: 'milk',
        name: 'Milk',
        enabled: true,
        defaultQuantity: parseFloat(milkQty) || 1,
        unit: milkUnit,
        billingModel: 'daily',
        scheduledWeekdays: [0, 1, 2, 3, 4, 5, 6],
      });
      const rate = parseFloat(milkRate) || 0;
      addRate({
        serviceId: milkServiceId,
        amountMinor: Math.round(rate * 100),
        unitBasis: milkUnit,
        effectiveFrom: now.slice(0, 10),
        effectiveTo: null,
      });
    }

    if (newsEnabled) {
      const newsServiceId = addService({
        householdId,
        type: 'newspaper',
        name: 'Newspaper',
        enabled: true,
        defaultQuantity: 1,
        unit: 'copy',
        billingModel: 'daily',
        scheduledWeekdays: [0, 1, 2, 3, 4, 5, 6],
      });
      const rate = parseFloat(newsRate) || 0;
      addRate({
        serviceId: newsServiceId,
        amountMinor: Math.round(rate * 100),
        unitBasis: 'copy',
        effectiveFrom: now.slice(0, 10),
        effectiveTo: null,
      });
    }

    setSetupComplete(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? (
            <View style={styles.stepContainer}>
              <View style={styles.logoBox}>
                <Ionicons name="calendar" size={32} color="#fff" />
              </View>

              <Text style={styles.title}>Welcome to Dailio</Text>
              <Text style={styles.subtitle}>
                Track milk, newspaper & daily deliveries with ease.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Sharma Family"
                placeholderTextColor="#9CA3AF"
                value={householdName}
                onChangeText={setHouseholdName}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setStep(1)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(0)}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color="#4338CA" />
              </TouchableOpacity>

              <Text style={styles.title}>Your Services</Text>

              {/* Milk Card */}
              <TouchableOpacity
                style={[
                  styles.serviceCard,
                  milkEnabled && styles.serviceCardActive,
                  milkEnabled && { borderColor: '#4338CA' },
                ]}
                onPress={() => setMilkEnabled(!milkEnabled)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceHeader}>
                  <Ionicons name="water" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                  <Text style={styles.serviceName}>Milk</Text>
                  <View
                    style={[
                      styles.checkCircle,
                      milkEnabled && styles.checkCircleActive,
                    ]}
                  >
                    {milkEnabled && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </View>

                {milkEnabled && (
                  <View style={styles.serviceDetails}>
                    <View style={styles.row}>
                      <Text style={styles.label}>Qty</Text>
                      <TextInput
                        style={styles.qtyInput}
                        value={milkQty}
                        onChangeText={setMilkQty}
                        keyboardType="numeric"
                      />
                      <View style={styles.unitSelector}>
                        {(['Litre', 'ml'] as const).map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.unitBtn,
                              milkUnit === u && styles.unitBtnActive,
                            ]}
                            onPress={() => setMilkUnit(u)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.unitBtnText,
                                milkUnit === u && styles.unitBtnTextActive,
                              ]}
                            >
                              {u}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Rate</Text>
                      <View style={styles.rateInputWrap}>
                        <Text style={styles.rupeeSign}>₹</Text>
                        <TextInput
                          style={styles.rateInput}
                          value={milkRate}
                          onChangeText={setMilkRate}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Newspaper Card */}
              <TouchableOpacity
                style={[
                  styles.serviceCard,
                  newsEnabled && styles.serviceCardActive,
                  newsEnabled && { borderColor: '#D97706' },
                ]}
                onPress={() => setNewsEnabled(!newsEnabled)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceHeader}>
                  <Ionicons name="newspaper" size={22} color="#D97706" style={{ marginRight: 8 }} />
                  <Text style={styles.serviceName}>Newspaper</Text>
                  <View
                    style={[
                      styles.checkCircle,
                      newsEnabled && { backgroundColor: '#D97706' },
                    ]}
                  >
                    {newsEnabled && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </View>

                {newsEnabled && (
                  <View style={styles.serviceDetails}>
                    <View style={styles.row}>
                      <Text style={styles.label}>Rate</Text>
                      <View style={styles.rateInputWrap}>
                        <Text style={styles.rupeeSign}>₹</Text>
                        <TextInput
                          style={styles.rateInput}
                          value={newsRate}
                          onChangeText={setNewsRate}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 24 }]}
                onPress={handleGetStarted}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  stepContainer: {
    alignItems: 'center',
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#4338CA',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 4,
  },
  serviceCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  serviceCardActive: {
    backgroundColor: '#F5F3FF',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  serviceName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  serviceDetails: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    width: 48,
  },
  qtyInput: {
    width: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111827',
    textAlign: 'center',
    marginRight: 8,
  },
  unitSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F9FAFB',
  },
  unitBtnActive: {
    backgroundColor: '#4338CA',
  },
  unitBtnText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  unitBtnTextActive: {
    color: '#fff',
  },
  rateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flex: 1,
  },
  rupeeSign: {
    paddingLeft: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  rateInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111827',
  },
});
