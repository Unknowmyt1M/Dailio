import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Settings as SettingsIcon, Download, Upload, Trash2, Plus, X, Sun, Moon, Monitor, Pencil, Check, Milk, Newspaper, ShieldCheck, Database, Calendar } from 'lucide-react';
import { exportAllData, importAllData } from '../lib/storage';
import { dateKey } from '../lib/dates';
import type { Service } from '../types';

const WEEKDAYS = [
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
  { day: 0, label: 'S' },
];

export default function Settings() {
  const { household, services, rates, records, theme, setTheme, addService, updateService, removeService, addRate, updateRate } = useStore();
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceType, setNewServiceType] = useState<'milk' | 'newspaper'>('milk');
  const [newServiceName, setNewServiceName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('L');

  // Edit Service State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editUnit, setEditUnit] = useState('L');
  const [editRate, setEditRate] = useState('');
  const [editWeekdays, setEditWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [editEnabled, setEditEnabled] = useState(true);

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setEditName(service.name);
    setEditQty(String(service.defaultQuantity));
    setEditUnit(service.unit);
    setEditWeekdays(service.scheduledWeekdays || [0, 1, 2, 3, 4, 5, 6]);
    setEditEnabled(service.enabled);

    const serviceRates = rates.filter(r => r.serviceId === service.id);
    const currentRate = serviceRates.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
    setEditRate(currentRate ? String(currentRate.amountMinor / 100) : '');
  };

  const handleSaveEdit = () => {
    if (!editingService) return;
    const name = editName.trim();
    const qty = parseFloat(editQty);
    const rateNum = parseFloat(editRate);

    if (!name) return;
    if (isNaN(qty) || qty <= 0) return;
    if (isNaN(rateNum) || rateNum < 0) return;

    updateService(editingService.id, {
      name,
      defaultQuantity: qty,
      unit: editUnit,
      scheduledWeekdays: editWeekdays,
      enabled: editEnabled,
    });

    const serviceRates = rates.filter(r => r.serviceId === editingService.id);
    const currentRate = serviceRates.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
    const newAmountMinor = Math.round(rateNum * 100);
    const todayStr = dateKey(new Date());

    if (!currentRate || currentRate.amountMinor !== newAmountMinor) {
      if (currentRate && currentRate.effectiveFrom === todayStr) {
        updateRate(currentRate.id, { amountMinor: newAmountMinor, unitBasis: editUnit });
      } else {
        addRate({
          serviceId: editingService.id,
          amountMinor: newAmountMinor,
          unitBasis: editUnit,
          effectiveFrom: todayStr,
          effectiveTo: null,
        });
      }
    }

    setEditingService(null);
  };

  const handleDeleteService = () => {
    if (!editingService) return;
    if (window.confirm(`Are you sure you want to delete "${editingService.name}"? All associated delivery data will be removed.`)) {
      removeService(editingService.id);
      setEditingService(null);
    }
  };

  const toggleWeekday = (dayIndex: number) => {
    setEditWeekdays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (importAllData(text)) {
          useStore.getState().init();
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleAddService = () => {
    if (!newServiceName) return;
    addService({
      householdId: household?.id ?? '',
      type: newServiceType,
      name: newServiceName,
      enabled: true,
      defaultQuantity: parseFloat(newQty) || 1,
      unit: newUnit,
      billingModel: newServiceType === 'milk' ? 'quantity' : 'per_day',
      scheduledWeekdays: [0, 1, 2, 3, 4, 5, 6],
    });
    const newServices = useStore.getState().services;
    const latestService = newServices[newServices.length - 1];
    if (newRate) {
      addRate({
        serviceId: latestService.id,
        amountMinor: Math.round(parseFloat(newRate) * 100),
        unitBasis: newUnit,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: null,
      });
    }
    setShowAddService(false);
    setNewServiceName('');
    setNewRate('');
    setNewQty('1');
  };

  const handleReset = () => {
    if (confirm('This will delete ALL data. Are you sure?')) {
      localStorage.clear();
      useStore.getState().init();
    }
  };

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-lg shadow-primary/25">
            <SettingsIcon size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-text">Control Center</h1>
            <p className="text-[11px] text-text-muted font-medium">Preferences, Products & Backup</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <ShieldCheck size={12} /> Local-First
        </span>
      </div>

      {/* Household Overview Hero Card */}
      {household && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-xl space-y-4 border border-slate-700/60 relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tracked Household</span>
              <h2 className="text-xl font-extrabold tracking-tight text-white mt-0.5">{household.name}</h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 text-primary-200">
              <Calendar size={18} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 relative z-10 text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Active Services</div>
              <div className="text-base font-extrabold text-white mt-0.5">{services.filter(s => s.enabled).length}</div>
            </div>
            <div className="border-x border-white/10">
              <div className="text-[10px] text-slate-400 font-medium">Deliveries</div>
              <div className="text-base font-extrabold text-white mt-0.5">{records.length}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Engine</div>
              <div className="text-[11px] font-bold text-emerald-400 mt-1 flex items-center justify-center gap-0.5">
                <Database size={11} /> IndexedDB
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearance / Dark Mode */}
      <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Appearance</div>
            <div className="font-bold text-sm text-text mt-0.5">App Theme</div>
          </div>
          <span className="text-[11px] font-medium text-text-secondary capitalize">{theme} mode</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-alt border-border/60 text-text hover:bg-primary-50 hover:text-primary'
            }`}
          >
            <Sun size={14} /> Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              theme === 'dark'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-alt border-border/60 text-text hover:bg-primary-50 hover:text-primary'
            }`}
          >
            <Moon size={14} /> Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              theme === 'system'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-alt border-border/60 text-text hover:bg-primary-50 hover:text-primary'
            }`}
          >
            <Monitor size={14} /> Auto
          </button>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-text">Products & Services</h3>
            <p className="text-[11px] text-text-muted">Manage rates, units, and delivery schedules</p>
          </div>
          <button
            onClick={() => setShowAddService(true)}
            className="h-8 px-3 rounded-xl bg-primary-50 hover:bg-primary-100 dark:bg-primary/20 text-primary flex items-center gap-1.5 font-bold text-xs transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} /> Add
          </button>
        </div>
        <div className="divide-y divide-border/60">
          {services.map(s => {
            const serviceRates = rates.filter(r => r.serviceId === s.id);
            const currentRate = serviceRates.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
            return (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.type === 'milk' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                    {s.type === 'milk' ? (
                      <Milk size={18} />
                    ) : (
                      <Newspaper size={18} />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text">{s.name}</div>
                    <div className="text-[11px] text-text-muted">
                      {s.defaultQuantity}{s.unit} · ₹{currentRate ? (currentRate.amountMinor / 100).toFixed(0) : '0'}/{s.type === 'milk' ? s.unit : 'day'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="w-8 h-8 rounded-xl bg-surface-alt hover:bg-primary-50 hover:text-primary text-text-secondary flex items-center justify-center transition-all active:scale-95 border border-border/40"
                    title="Edit Product Details"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => updateService(s.id, { enabled: !s.enabled })}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 ${s.enabled ? 'bg-success/10 text-success' : 'bg-surface-alt text-text-muted'}`}
                  >
                    {s.enabled ? 'Active' : 'Off'}
                  </button>
                </div>
              </div>
            );
          })}
          {services.length === 0 && (
            <div className="p-6 text-center text-sm text-text-muted">
              No services yet. Tap + to add one.
            </div>
          )}
        </div>
      </div>

      {/* Add service modal */}
      {showAddService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAddService(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 space-y-4 animate-slide-up shadow-2xl">
            <div className="flex justify-center sm:hidden"><div className="w-10 h-1 bg-border rounded-full" /></div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Add Service</h3>
              <button onClick={() => setShowAddService(false)} className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center hover:bg-danger/10 hover:text-danger transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNewServiceType('milk')}
                className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${newServiceType === 'milk' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-surface-alt text-text-secondary hover:text-text'}`}
              >
                <Milk size={17} /> Milk
              </button>
              <button
                onClick={() => setNewServiceType('newspaper')}
                className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${newServiceType === 'newspaper' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'bg-surface-alt text-text-secondary hover:text-text'}`}
              >
                <Newspaper size={17} /> Newspaper
              </button>
            </div>

            <input
              type="text"
              value={newServiceName}
              onChange={e => setNewServiceName(e.target.value)}
              placeholder="Service name"
              className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Qty</label>
                <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} step="0.5" className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Unit</label>
                <select value={newUnit} onChange={e => setNewUnit(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="L">Litre</option>
                  <option value="ml">ml</option>
                  <option value="copy">Copy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-semibold">₹</span>
                <input type="number" value={newRate} onChange={e => setNewRate(e.target.value)} placeholder="0" className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <button onClick={handleAddService} className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark active:scale-[0.97] transition-all shadow-lg shadow-primary/25">Add Service</button>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingService(null)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 space-y-4 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-center sm:hidden"><div className="w-10 h-1 bg-border rounded-full" /></div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${editingService.type === 'milk' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                  {editingService.type === 'milk' ? <Milk size={18} /> : <Newspaper size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-text">Edit Product</h3>
                  <p className="text-[11px] text-text-muted capitalize">{editingService.type} Service</p>
                </div>
              </div>
              <button onClick={() => setEditingService(null)} className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center hover:bg-danger/10 hover:text-danger transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Product / Service Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="e.g. Amul Gold, Dainik Bhaskar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Default Quantity & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Default Quantity
                </label>
                <input
                  type="number"
                  value={editQty}
                  onChange={e => setEditQty(e.target.value)}
                  step="0.5"
                  min="0.1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Unit
                </label>
                <select
                  value={editUnit}
                  onChange={e => setEditUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="L">Litre (L)</option>
                  <option value="ml">Millilitre (ml)</option>
                  <option value="copy">Copy</option>
                  <option value="packet">Packet</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            {/* Applicable Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  Rate (₹ per {editUnit})
                </label>
                <span className="text-[10px] text-primary font-medium">Effective today</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                <input
                  type="number"
                  value={editRate}
                  onChange={e => setEditRate(e.target.value)}
                  placeholder="0"
                  step="0.5"
                  min="0"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-border/60 bg-surface text-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                Updating rate saves new price from today onward, preserving past history.
              </p>
            </div>

            {/* Scheduled Days */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  Scheduled Delivery Days
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditWeekdays([0, 1, 2, 3, 4, 5, 6])}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    All Days
                  </button>
                  <span className="text-[10px] text-text-muted">·</span>
                  <button
                    type="button"
                    onClick={() => setEditWeekdays([1, 2, 3, 4, 5, 6])}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    Mon–Sat
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map(({ day, label }) => {
                  const isSelected = editWeekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-surface border border-border/60 text-text-muted hover:border-primary/40'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border/60">
              <div>
                <div className="text-xs font-bold text-text">Delivery Status</div>
                <div className="text-[11px] text-text-muted">
                  {editEnabled ? 'Active daily tracking' : 'Temporarily paused / turned off'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditEnabled(!editEnabled)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  editEnabled ? 'bg-success/15 text-success border border-success/30' : 'bg-surface-alt text-text-muted border border-border/60'
                }`}
              >
                {editEnabled ? 'Active' : 'Off'}
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeleteService}
                className="px-4 py-3 border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                title="Delete this product"
              >
                <Trash2 size={15} /> Delete
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                <Check size={16} strokeWidth={2.5} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data section */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <h3 className="p-4 border-b border-border/60 font-bold text-sm">Data</h3>
        <div className="divide-y divide-border/60">
          <button onClick={handleExport} className="w-full p-4 flex items-center gap-3 hover:bg-surface transition-colors text-left">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
              <Download size={16} />
            </div>
            <div>
              <div className="font-semibold text-sm">Export Data</div>
              <div className="text-[11px] text-text-muted">Download backup as JSON</div>
            </div>
          </button>
          <button onClick={handleImport} className="w-full p-4 flex items-center gap-3 hover:bg-surface transition-colors text-left">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
              <Upload size={16} />
            </div>
            <div>
              <div className="font-semibold text-sm">Import Data</div>
              <div className="text-[11px] text-text-muted">Restore from JSON backup</div>
            </div>
          </button>
          <button onClick={handleReset} className="w-full p-4 flex items-center gap-3 hover:bg-danger/5 transition-colors text-left">
            <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
              <Trash2 size={16} />
            </div>
            <div>
              <div className="font-semibold text-sm text-danger">Reset All Data</div>
              <div className="text-[11px] text-text-muted">Delete everything and start fresh</div>
            </div>
          </button>
        </div>
      </div>

      <div className="text-center text-[11px] text-text-muted py-6">
        Dailio v1.0 &middot; Made for Indian households
      </div>
    </div>
  );
}
