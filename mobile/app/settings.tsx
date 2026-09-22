import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store/useStore';
import { storage } from '../src/lib/storage';
import type { Service, ServiceType } from '../src/types';

const UNIT_OPTIONS = ['litre', 'packet', 'copy'] as const;
const TYPE_OPTIONS: { label: string; value: ServiceType }[] = [
  { label: 'Milk', value: 'milk' },
  { label: 'Newspaper', value: 'newspaper' },
];

export default function Settings() {
  const household = useStore((s) => s.household);
  const services = useStore((s) => s.services);
  const rates = useStore((s) => s.rates);
  const addService = useStore((s) => s.addService);
  const addRate = useStore((s) => s.addRate);
  const updateService = useStore((s) => s.updateService);
  const removeService = useStore((s) => s.removeService);
  const updateRate = useStore((s) => s.updateRate);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<ServiceType>('milk');
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('litre');
  const [newRate, setNewRate] = useState('');

  // Edit Service State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editUnit, setEditUnit] = useState('litre');
  const [editRate, setEditRate] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);

  const handleStartEdit = useCallback(
    (service: Service) => {
      setEditingServiceId(service.id);
      setEditName(service.name);
      setEditQty(String(service.defaultQuantity));
      setEditUnit(service.unit);
      setEditEnabled(service.enabled);
      const rate = rates.find((r) => r.serviceId === service.id);
      setEditRate(rate ? String(Math.floor(rate.amountMinor / 100)) : '');
      setShowAddForm(false);
    },
    [rates],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingServiceId(null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingServiceId) return;
    const name = editName.trim();
    const qty = parseFloat(editQty);
    const rateRupees = parseFloat(editRate);

    if (!name) {
      Alert.alert('Validation', 'Product name is required.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation', 'Quantity must be a positive number.');
      return;
    }
    if (isNaN(rateRupees) || rateRupees < 0) {
      Alert.alert('Validation', 'Rate must be a valid number.');
      return;
    }

    updateService(editingServiceId, {
      name,
      defaultQuantity: qty,
      unit: editUnit,
      enabled: editEnabled,
    });

    const newAmountMinor = Math.round(rateRupees * 100);
    const existingRate = rates.find((r) => r.serviceId === editingServiceId);
    const todayStr = new Date().toISOString().slice(0, 10);

    if (!existingRate || existingRate.amountMinor !== newAmountMinor) {
      if (existingRate && existingRate.effectiveFrom === todayStr) {
        updateRate(existingRate.id, { amountMinor: newAmountMinor, unitBasis: editUnit });
      } else {
        addRate({
          serviceId: editingServiceId,
          amountMinor: newAmountMinor,
          unitBasis: editUnit,
          effectiveFrom: todayStr,
          effectiveTo: null,
        });
      }
    }

    setEditingServiceId(null);
    Alert.alert('Saved', 'Product details have been updated.');
  }, [editingServiceId, editName, editQty, editRate, editUnit, editEnabled, rates, updateService, updateRate, addRate]);

  const handleDeleteService = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        'Delete Product',
        `Are you sure you want to delete "${name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              removeService(id);
              if (editingServiceId === id) setEditingServiceId(null);
            },
          },
        ],
      );
    },
    [removeService, editingServiceId],
  );

  const resetForm = useCallback(() => {
    setNewType('milk');
    setNewName('');
    setNewQty('1');
    setNewUnit('litre');
    setNewRate('');
    setShowAddForm(false);
  }, []);

  const handleAddService = useCallback(() => {
    const name = newName.trim();
    const qty = parseFloat(newQty);
    const ratePaise = parseInt(newRate, 10);

    if (!name) {
      Alert.alert('Validation', 'Service name is required.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation', 'Quantity must be a positive number.');
      return;
    }
    if (isNaN(ratePaise) || ratePaise <= 0) {
      Alert.alert('Validation', 'Rate must be a positive number (in paise).');
      return;
    }

    const id = addService({
      householdId: household?.id ?? '',
      type: newType,
      name,
      enabled: true,
      defaultQuantity: qty,
      unit: newUnit,
      billingModel: 'daily',
      scheduledWeekdays: [0, 1, 2, 3, 4, 5, 6],
    });

    addRate({
      serviceId: id,
      amountMinor: ratePaise,
      unitBasis: newUnit,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: null,
    });

    resetForm();
    Alert.alert('Added', `${name} has been added.`);
  }, [newType, newName, newQty, newUnit, newRate, household, addService, addRate, resetForm]);

  const handleToggle = useCallback(
    (id: string, current: boolean) => {
      updateService(id, { enabled: !current });
    },
    [updateService],
  );

  const handleExport = useCallback(async () => {
    try {
      const json = await storage.exportAll();
      Alert.alert('Export Ready', 'Data exported. Length: ' + json.length + ' chars.');
    } catch {
      Alert.alert('Error', 'Export failed.');
    }
  }, []);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                storage.saveHousehold(null as any),
                storage.saveServices([]),
                storage.saveRates([]),
                storage.saveRecords([]),
                storage.savePauses([]),
                storage.savePayments([]),
              ]);
              Alert.alert('Done', 'All data has been reset. Restart the app.');
            } catch {
              Alert.alert('Error', 'Reset failed.');
            }
          },
        },
      ],
    );
  }, []);

  const getRateLabel = useCallback(
    (serviceId: string) => {
      const rate = rates.find((r) => r.serviceId === serviceId);
      if (!rate) return 'No rate set';
      const rupees = Math.floor(rate.amountMinor / 100);
      const paise = rate.amountMinor % 100;
      const amountStr = paise > 0 ? `₹${rupees}.${paise}` : `₹${rupees}`;
      return `${amountStr} / ${rate.unitBasis}`;
    },
    [rates],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.gearBox}>
              <Ionicons name="settings" size={20} color="#4338CA" />
            </View>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>

        {/* Household Card */}
        {household && (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.cardIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="home" size={20} color="#4338CA" />
              </View>
              <View style={styles.cardTextGroup}>
                <Text style={styles.cardLabel}>Household</Text>
                <Text style={styles.cardValue}>{household.name}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Services Section */}
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.card}>
          {services.length === 0 && (
            <Text style={styles.emptyText}>No services added yet.</Text>
          )}
          {services.map((service, i) => (
            <View key={service.id}>
              <View style={styles.serviceRow}>
                <View style={styles.serviceLeft}>
                  <View
                    style={[
                      styles.serviceIcon,
                      { backgroundColor: service.type === 'milk' ? '#E0E7FF' : '#FEF3C7' },
                    ]}
                  >
                    <Ionicons
                      name={service.type === 'milk' ? 'water' : 'newspaper'}
                      size={18}
                      color={service.type === 'milk' ? '#4338CA' : '#D97706'}
                    />
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceRate}>{getRateLabel(service.id)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.editIconBtn}
                    onPress={() => handleStartEdit(service)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={15} color="#4338CA" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, service.enabled && styles.toggleBtnActive]}
                    onPress={() => handleToggle(service.id, service.enabled)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.toggleText, service.enabled && styles.toggleTextActive]}>
                      {service.enabled ? 'Active' : 'Off'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Inline Edit Form */}
              {editingServiceId === service.id && (
                <View style={styles.inlineEditCard}>
                  <Text style={styles.editSectionTitle}>Edit Product Details</Text>

                  <Text style={styles.formLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Product name"
                    placeholderTextColor="#9CA3AF"
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formLabel}>Default Qty</Text>
                      <TextInput
                        style={styles.input}
                        value={editQty}
                        onChangeText={setEditQty}
                        keyboardType="numeric"
                        placeholder="1"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formLabel}>Unit</Text>
                      <TextInput
                        style={styles.input}
                        value={editUnit}
                        onChangeText={setEditUnit}
                        placeholder="litre, copy"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <Text style={styles.formLabel}>Rate (₹ per {editUnit})</Text>
                  <TextInput
                    style={styles.input}
                    value={editRate}
                    onChangeText={setEditRate}
                    keyboardType="numeric"
                    placeholder="Rate in ₹"
                    placeholderTextColor="#9CA3AF"
                  />

                  <View style={styles.editStatusRow}>
                    <Text style={styles.editStatusLabel}>Status</Text>
                    <TouchableOpacity
                      style={[styles.toggleBtn, editEnabled && styles.toggleBtnActive]}
                      onPress={() => setEditEnabled(!editEnabled)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.toggleText, editEnabled && styles.toggleTextActive]}>
                        {editEnabled ? 'Active' : 'Off'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteService(service.id, service.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelEditBtn}
                      onPress={handleCancelEdit}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelEditBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.saveEditBtn}
                      onPress={handleSaveEdit}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.saveEditBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {i < services.length - 1 && <View style={styles.divider} />}
            </View>
          ))}

          {/* Add Service Button */}
          {!showAddForm && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddForm(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color="#4338CA" />
              <Text style={styles.addBtnText}>Add Service</Text>
            </TouchableOpacity>
          )}

          {/* Inline Add Form */}
          {showAddForm && (
            <View style={styles.addForm}>
              <View style={styles.divider} />
              <Text style={styles.formLabel}>Type</Text>
              <View style={styles.typeRow}>
                {TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.typeBtn, newType === opt.value && styles.typeBtnActive]}
                    onPress={() => setNewType(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.typeBtnText, newType === opt.value && styles.typeBtnTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Amul Gold"
                placeholderTextColor="#9CA3AF"
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.formLabel}>Default Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={newQty}
                onChangeText={setNewQty}
              />

              <Text style={styles.formLabel}>Unit</Text>
              <View style={styles.typeRow}>
                {UNIT_OPTIONS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.typeBtn, newUnit === u && styles.typeBtnActive]}
                    onPress={() => setNewUnit(u)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.typeBtnText, newUnit === u && styles.typeBtnTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Rate (paise per unit)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 4500 = ₹45"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={newRate}
                onChangeText={setNewRate}
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={resetForm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmAddBtn}
                  onPress={handleAddService}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmAddBtnText}>Add Service</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Data Section */}
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dataRow} onPress={handleExport} activeOpacity={0.7}>
            <View style={styles.dataLeft}>
              <View style={[styles.dataIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="download" size={18} color="#4338CA" />
              </View>
              <Text style={styles.dataLabel}>Export Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.dataRow} onPress={handleReset} activeOpacity={0.7}>
            <View style={styles.dataLeft}>
              <View style={[styles.dataIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash" size={18} color="#DC2626" />
              </View>
              <Text style={[styles.dataLabel, { color: '#DC2626' }]}>Reset All Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Dailio v1.0 {'\u00B7'} Made for Indian households</Text>
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
  gearBox: {
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTextGroup: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
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
    flex: 1,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  serviceRate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    gap: 6,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4338CA',
  },
  addForm: {
    marginTop: 4,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmAddBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4338CA',
    alignItems: 'center',
  },
  confirmAddBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineEditCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  editStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 6,
  },
  editStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  cancelEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4338CA',
  },
  saveEditBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  dataLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dataIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  footer: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
    paddingVertical: 16,
  },
});
