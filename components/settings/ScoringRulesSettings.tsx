'use client';

// ============================================================================
// SCORING RULES SETTINGS - Kurum Bazlı Puanlama Kuralları Yönetimi
// LGS/TYT/AYT katsayıları, taban/tavan puan, yanlış katsayısı ayarları
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Info,
  Copy,
  Star,
  Settings2,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface DersKatsayisi {
  dersKodu: string;
  dersAdi: string;
  katsayi: number;
}

interface ScoringRule {
  id: string;
  organization_id: string;
  sinav_turu: string;
  ad: string;
  aciklama?: string;
  net_hesaplama: string;
  yanlis_katsayisi: number;
  taban_puan: number;
  tavan_puan: number;
  formul_tipi: string;
  ders_katsayilari: DersKatsayisi[];
  normalizasyon: string;
  standart_sapma_dahil: boolean;
  is_active: boolean;
  is_default: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// Sınav türleri
const SINAV_TURLERI = [
  { kod: 'LGS', ad: 'LGS - Liselere Geçiş Sınavı', renk: 'bg-emerald-500' },
  { kod: 'TYT', ad: 'TYT - Temel Yeterlilik Testi', renk: 'bg-blue-500' },
  { kod: 'AYT_SAY', ad: 'AYT Sayısal', renk: 'bg-purple-500' },
  { kod: 'AYT_EA', ad: 'AYT Eşit Ağırlık', renk: 'bg-amber-500' },
  { kod: 'AYT_SOZ', ad: 'AYT Sözel', renk: 'bg-rose-500' },
  { kod: 'AYT_DIL', ad: 'YDT - Yabancı Dil', renk: 'bg-cyan-500' },
  { kod: 'DENEME', ad: 'Kurum Denemesi', renk: 'bg-slate-500' },
];

const NET_HESAPLAMA_YONTEMLERI = [
  { kod: 'standart_4', ad: '4 Yanlış 1 Doğruyu Götürür' },
  { kod: 'standart_3', ad: '3 Yanlış 1 Doğruyu Götürür' },
  { kod: 'yok', ad: 'Yanlış Götürmez' },
];

const FORMUL_TIPLERI = [
  { kod: 'lgs', ad: 'LGS Formülü' },
  { kod: 'tyt', ad: 'TYT Formülü' },
  { kod: 'ayt_say', ad: 'AYT Sayısal Formülü' },
  { kod: 'ayt_soz', ad: 'AYT Sözel Formülü' },
  { kod: 'ayt_ea', ad: 'AYT EA Formülü' },
  { kod: 'linear', ad: 'Doğrusal (Net/Toplam × 100)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ScoringRulesSettings() {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTur, setSelectedTur] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  // ─────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/scoring-rules');
      const data = await res.json();
      
      if (data.success) {
        setRules(data.data || []);
      } else {
        toast({ title: 'Hata', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({ title: 'Hata', description: 'Puanlama kuralları yüklenemedi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────

  const handleSave = async (rule: Partial<ScoringRule>) => {
    try {
      setSaving(true);
      const method = rule.id ? 'PUT' : 'POST';
      
      const res = await fetch('/api/settings/scoring-rules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: 'Başarılı', description: 'Puanlama kuralı kaydedildi' });
        setEditingRule(null);
        setIsCreating(false);
        fetchRules();
      } else {
        toast({ title: 'Hata', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Hata', description: 'Kaydetme başarısız', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu puanlama kuralını silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/settings/scoring-rules?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: 'Başarılı', description: 'Puanlama kuralı silindi' });
        fetchRules();
      } else {
        toast({ title: 'Hata', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Hata', description: 'Silme başarısız', variant: 'destructive' });
    }
  };

  const handleSetDefault = async (rule: ScoringRule) => {
    await handleSave({ ...rule, is_default: true });
  };

  const handleDuplicate = (rule: ScoringRule) => {
    const newRule: Partial<ScoringRule> = {
      ...rule,
      id: undefined,
      ad: `${rule.ad} (Kopya)`,
      is_default: false,
      is_system: false,
    };
    setEditingRule(newRule as ScoringRule);
    setIsCreating(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // Filtrelenmiş kurallar
  const filteredRules = selectedTur 
    ? rules.filter(r => r.sinav_turu === selectedTur)
    : rules;

  // Sınav türüne göre grupla
  const groupedRules = SINAV_TURLERI.reduce((acc, tur) => {
    acc[tur.kod] = filteredRules.filter(r => r.sinav_turu === tur.kod);
    return acc;
  }, {} as Record<string, ScoringRule[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-slate-600">Puanlama kuralları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-600" />
            Puanlama Kuralları
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            LGS, TYT, AYT sınavları için puan hesaplama kurallarını ve ders katsayılarını yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRules}
            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
            title="Yenile"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setEditingRule({
                sinav_turu: 'LGS',
                ad: '',
                net_hesaplama: 'standart_4',
                yanlis_katsayisi: 4,
                taban_puan: 0,
                tavan_puan: 500,
                formul_tipi: 'linear',
                ders_katsayilari: [],
                normalizasyon: 'yok',
                standart_sapma_dahil: false,
                is_active: true,
                is_default: false,
              } as ScoringRule);
              setIsCreating(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Yeni Kural
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Puanlama kuralları nasıl çalışır?</p>
          <ul className="mt-1 space-y-1 text-blue-700">
            <li>• Her sınav türü için birden fazla puanlama kuralı oluşturabilirsiniz</li>
            <li>• <Star className="inline h-3 w-3" /> işaretli kural, o sınav türü için varsayılan olarak kullanılır</li>
            <li>• Sistem kuralları silinemez, ancak yeni kurallar ekleyip varsayılan yapabilirsiniz</li>
            <li>• Ders katsayıları, ÖSYM/MEB standartlarına göre önceden tanımlıdır</li>
          </ul>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedTur(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedTur === null
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tümü ({rules.length})
        </button>
        {SINAV_TURLERI.map(tur => {
          const count = rules.filter(r => r.sinav_turu === tur.kod).length;
          if (count === 0) return null;
          return (
            <button
              key={tur.kod}
              onClick={() => setSelectedTur(tur.kod)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                selectedTur === tur.kod
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${tur.renk}`} />
              {tur.kod} ({count})
            </button>
          );
        })}
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {selectedTur === null ? (
          // Grouped view
          SINAV_TURLERI.map(tur => {
            const turRules = groupedRules[tur.kod] || [];
            if (turRules.length === 0) return null;

            return (
              <div key={tur.kod} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className={`px-4 py-3 ${tur.renk} bg-opacity-10 border-b border-slate-200`}>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${tur.renk}`} />
                    {tur.ad}
                    <span className="text-xs text-slate-500 font-normal">({turRules.length} kural)</span>
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {turRules.map(rule => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      isExpanded={expandedRules.has(rule.id)}
                      onToggle={() => toggleExpand(rule.id)}
                      onEdit={() => { setEditingRule(rule); setIsCreating(false); }}
                      onDelete={() => handleDelete(rule.id)}
                      onSetDefault={() => handleSetDefault(rule)}
                      onDuplicate={() => handleDuplicate(rule)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Flat view for selected type
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredRules.map(rule => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  isExpanded={expandedRules.has(rule.id)}
                  onToggle={() => toggleExpand(rule.id)}
                  onEdit={() => { setEditingRule(rule); setIsCreating(false); }}
                  onDelete={() => handleDelete(rule.id)}
                  onSetDefault={() => handleSetDefault(rule)}
                  onDuplicate={() => handleDuplicate(rule)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {(editingRule || isCreating) && (
        <RuleEditModal
          rule={editingRule!}
          isCreating={isCreating}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setEditingRule(null); setIsCreating(false); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE ROW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface RuleRowProps {
  rule: ScoringRule;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onDuplicate: () => void;
}

function RuleRow({ rule, isExpanded, onToggle, onEdit, onDelete, onSetDefault, onDuplicate }: RuleRowProps) {
  const netHesaplamaText = NET_HESAPLAMA_YONTEMLERI.find(n => n.kod === rule.net_hesaplama)?.ad || rule.net_hesaplama;

  return (
    <div className="hover:bg-slate-50 transition">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={onToggle} className="p-1 hover:bg-slate-200 rounded">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 truncate">{rule.ad}</span>
              {rule.is_default && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                  <Star className="h-3 w-3" fill="currentColor" />
                  Varsayılan
                </span>
              )}
              {rule.is_system && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                  Sistem
                </span>
              )}
              {!rule.is_active && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  Pasif
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
              <span>Yanlış: 1/{rule.yanlis_katsayisi}</span>
              <span>Taban: {rule.taban_puan}</span>
              <span>Tavan: {rule.tavan_puan}</span>
              <span>{netHesaplamaText}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!rule.is_default && (
            <button
              onClick={onSetDefault}
              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
              title="Varsayılan yap"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onDuplicate}
            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
            title="Kopyala"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
            title="Düzenle"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {!rule.is_system && (
            <button
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content - Ders Katsayıları */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Ders Katsayıları</h4>
            {rule.ders_katsayilari && rule.ders_katsayilari.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {rule.ders_katsayilari.map((ders, i) => (
                  <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200">
                    <span className="text-sm text-slate-700">{ders.dersAdi}</span>
                    <span className="font-mono font-semibold text-emerald-600">{ders.katsayi.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Ders katsayısı tanımlanmamış</p>
            )}

            {rule.aciklama && (
              <p className="mt-3 text-sm text-slate-500">{rule.aciklama}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface RuleEditModalProps {
  rule: ScoringRule;
  isCreating: boolean;
  saving: boolean;
  onSave: (rule: Partial<ScoringRule>) => void;
  onClose: () => void;
}

function RuleEditModal({ rule, isCreating, saving, onSave, onClose }: RuleEditModalProps) {
  const [formData, setFormData] = useState<Partial<ScoringRule>>({ ...rule });
  const [katsayilar, setKatsayilar] = useState<DersKatsayisi[]>(rule.ders_katsayilari || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      ders_katsayilari: katsayilar,
    });
  };

  const updateKatsayi = (index: number, field: keyof DersKatsayisi, value: string | number) => {
    const updated = [...katsayilar];
    updated[index] = { ...updated[index], [field]: value };
    setKatsayilar(updated);
  };

  const addKatsayi = () => {
    setKatsayilar([...katsayilar, { dersKodu: '', dersAdi: '', katsayi: 1.0 }]);
  };

  const removeKatsayi = (index: number) => {
    setKatsayilar(katsayilar.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Settings2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                {isCreating ? 'Yeni Puanlama Kuralı' : 'Puanlama Kuralını Düzenle'}
              </h3>
              <p className="text-sm text-slate-500">
                {formData.sinav_turu && SINAV_TURLERI.find(t => t.kod === formData.sinav_turu)?.ad}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sınav Türü *</label>
              <select
                value={formData.sinav_turu || ''}
                onChange={e => setFormData({ ...formData, sinav_turu: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                disabled={!isCreating && rule.is_system}
              >
                <option value="">Seçiniz</option>
                {SINAV_TURLERI.map(t => (
                  <option key={t.kod} value={t.kod}>{t.ad}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kural Adı *</label>
              <input
                type="text"
                value={formData.ad || ''}
                onChange={e => setFormData({ ...formData, ad: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Örn: TYT Özel Puanlama"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
            <textarea
              value={formData.aciklama || ''}
              onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={2}
              placeholder="Bu kural hakkında açıklama..."
            />
          </div>

          {/* Puanlama Ayarları */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <h4 className="font-semibold text-slate-900">Puanlama Ayarları</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Net Hesaplama</label>
                <select
                  value={formData.net_hesaplama || 'standart_4'}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      net_hesaplama: val,
                      yanlis_katsayisi: val === 'standart_4' ? 4 : val === 'standart_3' ? 3 : 0,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {NET_HESAPLAMA_YONTEMLERI.map(n => (
                    <option key={n.kod} value={n.kod}>{n.ad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yanlış Katsayısı</label>
                <input
                  type="number"
                  value={formData.yanlis_katsayisi ?? 4}
                  onChange={e => setFormData({ ...formData, yanlis_katsayisi: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Taban Puan</label>
                <input
                  type="number"
                  value={formData.taban_puan ?? 0}
                  onChange={e => setFormData({ ...formData, taban_puan: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tavan Puan</label>
                <input
                  type="number"
                  value={formData.tavan_puan ?? 500}
                  onChange={e => setFormData({ ...formData, tavan_puan: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Formül Tipi</label>
                <select
                  value={formData.formul_tipi || 'linear'}
                  onChange={e => setFormData({ ...formData, formul_tipi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {FORMUL_TIPLERI.map(f => (
                    <option key={f.kod} value={f.kod}>{f.ad}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default ?? false}
                    onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700">Varsayılan</span>
                </label>
              </div>
            </div>
          </div>

          {/* Ders Katsayıları */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">Ders Katsayıları</h4>
              <button
                type="button"
                onClick={addKatsayi}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-100 rounded-lg transition"
              >
                <Plus className="h-4 w-4" />
                Ders Ekle
              </button>
            </div>

            {katsayilar.length > 0 ? (
              <div className="space-y-2">
                {katsayilar.map((ders, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      value={ders.dersKodu}
                      onChange={e => updateKatsayi(index, 'dersKodu', e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                      placeholder="Kod"
                    />
                    <input
                      type="text"
                      value={ders.dersAdi}
                      onChange={e => updateKatsayi(index, 'dersAdi', e.target.value)}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                      placeholder="Ders Adı"
                    />
                    <input
                      type="number"
                      value={ders.katsayi}
                      onChange={e => updateKatsayi(index, 'katsayi', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-center font-mono"
                      step="0.01"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => removeKatsayi(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">
                Henüz ders katsayısı eklenmedi
              </p>
            )}
          </div>

          {/* System Warning */}
          {rule.is_system && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Bu bir sistem kuralıdır. Değişiklikler yeni bir kopyaya kaydedilecektir.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
