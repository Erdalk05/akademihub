'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2, CheckCircle, Settings, Percent, DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface PenaltySettings {
  enabled: boolean;
  type: 'fixed' | 'percentage' | 'daily_percentage';
  fixed_amount: number;
  percentage: number;
  daily_rate: number;
  grace_period_days: number;
  max_penalty_percentage: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: PenaltySettings = {
  enabled: true,
  type: 'daily_percentage',
  fixed_amount: 50,
  percentage: 5,
  daily_rate: 0.1,
  grace_period_days: 3,
  max_penalty_percentage: 20,
};

export default function PenaltySettingsModal({ isOpen, onClose }: Props) {
  const [settings, setSettings] = useState<PenaltySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/installments/calculate-penalty');
      const data = await response.json();
      if (data.success && data.data.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data.settings });
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/installments/calculate-penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Gecikme cezası ayarları kaydedildi');
        onClose();
      } else {
        toast.error(data.error || 'Kayıt başarısız');
      }
    } catch (error: any) {
      toast.error('Bir hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Gecikme Cezası Ayarları</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Aktif/Pasif */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <span className="font-semibold text-gray-900">Ceza Sistemi</span>
                <p className="text-sm text-gray-500">Gecikmiş ödemeler için otomatik ceza hesaplama</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            {settings.enabled && (
              <>
                {/* Ceza Türü */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Ceza Hesaplama Yöntemi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'fixed', label: 'Sabit Tutar', icon: DollarSign },
                      { value: 'percentage', label: 'Yüzde', icon: Percent },
                      { value: 'daily_percentage', label: 'Günlük Yüzde', icon: Calendar },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSettings({ ...settings, type: opt.value as any })}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          settings.type === opt.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <opt.icon size={20} className="mx-auto mb-1" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sabit Tutar */}
                {settings.type === 'fixed' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sabit Ceza Tutarı (₺)
                    </label>
                    <input
                      type="number"
                      value={settings.fixed_amount}
                      onChange={(e) => setSettings({ ...settings, fixed_amount: Number(e.target.value) })}
                      min={0}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                )}

                {/* Yüzde */}
                {settings.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ceza Oranı (%)
                    </label>
                    <input
                      type="number"
                      value={settings.percentage}
                      onChange={(e) => setSettings({ ...settings, percentage: Number(e.target.value) })}
                      min={0}
                      max={100}
                      step={0.1}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                )}

                {/* Günlük Yüzde */}
                {settings.type === 'daily_percentage' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Günlük Ceza Oranı (%)
                    </label>
                    <input
                      type="number"
                      value={settings.daily_rate}
                      onChange={(e) => setSettings({ ...settings, daily_rate: Number(e.target.value) })}
                      min={0}
                      max={10}
                      step={0.01}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Örnek: 0.1% = 1000₺ için günlük 1₺ ceza
                    </p>
                  </div>
                )}

                {/* Tolerans Süresi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tolerans Süresi (gün)
                  </label>
                  <input
                    type="number"
                    value={settings.grace_period_days}
                    onChange={(e) => setSettings({ ...settings, grace_period_days: Number(e.target.value) })}
                    min={0}
                    max={30}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Vade tarihinden sonra ceza uygulanmayacak gün sayısı
                  </p>
                </div>

                {/* Maksimum Ceza */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maksimum Ceza Oranı (%)
                  </label>
                  <input
                    type="number"
                    value={settings.max_penalty_percentage}
                    onChange={(e) => setSettings({ ...settings, max_penalty_percentage: Number(e.target.value) })}
                    min={0}
                    max={100}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ceza tutarı, kalan borcun bu yüzdesini geçemez
                  </p>
                </div>

                {/* Bilgi */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle size={18} />
                    <span className="font-medium">Bilgi</span>
                  </div>
                  <p className="text-sm text-amber-600 mt-1">
                    Cezalar her gün saat 06:00'da otomatik olarak hesaplanır ve uygulanır. 
                    Manuel hesaplama için "Finans → Taksitler" sayfasını kullanabilirsiniz.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Ayarları Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

