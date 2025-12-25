'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  ClipboardPaste,
  Check,
  X,
  AlertTriangle,
  Table,
  Eye,
  Save,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
  Lightbulb
} from 'lucide-react';
import { CevapAnahtariSatir, DERS_RENKLERI, DERS_ISIMLERI, BLOOM_SEVIYELERI } from './types';

interface KazanimCevapAnahtariProps {
  examId?: string;
  examType?: 'LGS' | 'TYT' | 'AYT' | 'DENEME';
  onSave?: (data: CevapAnahtariSatir[]) => void;
  initialData?: CevapAnahtariSatir[];
}

export default function KazanimCevapAnahtari({
  examId,
  examType = 'LGS',
  onSave,
  initialData = []
}: KazanimCevapAnahtariProps) {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'manual'>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedData, setParsedData] = useState<CevapAnahtariSatir[]>(initialData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  // Yapıştırılan veriyi parse et
  const parseClipboardData = useCallback((content: string) => {
    const lines = content.trim().split('\n');
    const parsed: CevapAnahtariSatir[] = [];
    const parseErrors: string[] = [];

    lines.forEach((line, index) => {
      if (index === 0 && line.toLowerCase().includes('soru')) {
        // Başlık satırını atla
        return;
      }

      // Tab veya virgül ile ayır
      const cells = line.split(/[\t,;]/).map(c => c.trim());
      
      if (cells.length < 4) {
        parseErrors.push(`Satır ${index + 1}: Yetersiz sütun sayısı`);
        return;
      }

      const soruNo = parseInt(cells[0]);
      if (isNaN(soruNo)) {
        parseErrors.push(`Satır ${index + 1}: Geçersiz soru numarası`);
        return;
      }

      const dogruCevap = cells[1]?.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
      if (!['A', 'B', 'C', 'D', 'E'].includes(dogruCevap)) {
        parseErrors.push(`Satır ${index + 1}: Geçersiz cevap (${cells[1]})`);
        return;
      }

      const dersKodu = cells[2]?.toUpperCase();
      if (!DERS_ISIMLERI[dersKodu]) {
        parseErrors.push(`Satır ${index + 1}: Bilinmeyen ders kodu (${cells[2]})`);
        return;
      }

      parsed.push({
        soruNo,
        dogruCevap,
        dersKodu,
        kazanimKodu: cells[3] || undefined,
        kazanimMetni: cells[4] || undefined,
        konuAdi: cells[5] || undefined,
        zorluk: cells[6] ? parseFloat(cells[6]) : 0.5
      });
    });

    setParsedData(parsed);
    setErrors(parseErrors);
    
    if (parsed.length > 0) {
      setIsPreviewOpen(true);
    }
  }, []);

  // Dosya yükle
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseClipboardData(content);
    };
    reader.readAsText(file);
  }, [parseClipboardData]);

  // Ders bazlı gruplama
  const groupedByDers = useMemo(() => {
    const groups: Record<string, CevapAnahtariSatir[]> = {};
    parsedData.forEach(item => {
      if (!groups[item.dersKodu]) {
        groups[item.dersKodu] = [];
      }
      groups[item.dersKodu].push(item);
    });
    return groups;
  }, [parsedData]);

  // İstatistikler
  const stats = useMemo(() => {
    const dersler = Object.keys(groupedByDers);
    const kazanimSayisi = new Set(parsedData.filter(d => d.kazanimKodu).map(d => d.kazanimKodu)).size;
    return {
      toplamSoru: parsedData.length,
      dersSayisi: dersler.length,
      kazanimSayisi
    };
  }, [parsedData, groupedByDers]);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kazanım Bazlı Cevap Anahtarı</h2>
          <p className="text-sm text-slate-500">Excel veya kopyala-yapıştır ile kazanım yükleyin</p>
        </div>
      </div>

      {/* Tab Seçimi */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {[
          { id: 'paste', label: 'Yapıştır', icon: ClipboardPaste },
          { id: 'upload', label: 'Dosya Yükle', icon: Upload },
          { id: 'manual', label: 'Manuel Giriş', icon: Edit2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-md text-emerald-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* İçerik Alanları */}
      <AnimatePresence mode="wait">
        {activeTab === 'paste' && (
          <motion.div
            key="paste"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Excel Format:</strong> Her satırda şu sütunlar olmalı (tab ile ayrılmış):
                  <div className="mt-2 font-mono text-xs bg-white/50 p-2 rounded">
                    Soru No | Cevap | Ders Kodu | Kazanım Kodu | Kazanım Metni
                  </div>
                  <div className="mt-2 text-xs">
                    Örnek: <code className="bg-white/50 px-1 py-0.5 rounded">1	A	TUR	T.8.1.2	Sözcüğün mecaz anlamını kavrar</code>
                  </div>
                </div>
              </div>
            </div>

            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Excel'den kopyaladığınız veriyi buraya yapıştırın..."
              className="w-full h-64 p-4 border-2 border-dashed border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-mono text-sm resize-none"
            />

            <button
              onClick={() => parseClipboardData(pasteContent)}
              disabled={!pasteContent.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Table size={18} />
              Veriyi Ayrıştır
            </button>
          </motion.div>
        )}

        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all">
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-4" />
              <p className="text-lg font-medium text-slate-600">Excel veya CSV Dosyası Yükle</p>
              <p className="text-sm text-slate-400 mt-1">.xlsx, .xls, .csv formatları desteklenir</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </motion.div>
        )}

        {activeTab === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600 mb-4">
                Manuel olarak soru eklemek için aşağıdaki formu kullanın:
              </p>
              <ManuelGirisForm onAdd={(item) => setParsedData(prev => [...prev, item])} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hatalar */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Parse Hataları ({errors.length})</p>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {errors.slice(0, 5).map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
                {errors.length > 5 && (
                  <li className="text-red-500">... ve {errors.length - 5} hata daha</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Önizleme */}
      {parsedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          {/* Önizleme Başlık */}
          <button
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-700">Önizleme</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                {parsedData.length} soru
              </span>
            </div>
            {isPreviewOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <AnimatePresence>
            {isPreviewOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-200"
              >
                {/* İstatistikler */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50">
                  <div className="text-center p-3 bg-white rounded-xl">
                    <div className="text-2xl font-bold text-emerald-600">{stats.toplamSoru}</div>
                    <div className="text-sm text-slate-500">Toplam Soru</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{stats.dersSayisi}</div>
                    <div className="text-sm text-slate-500">Ders</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">{stats.kazanimSayisi}</div>
                    <div className="text-sm text-slate-500">Kazanım</div>
                  </div>
                </div>

                {/* Ders Bazlı Gruplar */}
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(groupedByDers).map(([dersKodu, sorular]) => (
                    <div key={dersKodu} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div 
                        className="flex items-center gap-3 p-3"
                        style={{ backgroundColor: `${DERS_RENKLERI[dersKodu]}15` }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: DERS_RENKLERI[dersKodu] }}
                        />
                        <span className="font-semibold" style={{ color: DERS_RENKLERI[dersKodu] }}>
                          {DERS_ISIMLERI[dersKodu] || dersKodu}
                        </span>
                        <span className="text-sm text-slate-500">({sorular.length} soru)</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-slate-600">No</th>
                              <th className="px-3 py-2 text-center text-slate-600">Cevap</th>
                              <th className="px-3 py-2 text-left text-slate-600">Kazanım Kodu</th>
                              <th className="px-3 py-2 text-left text-slate-600">Kazanım Metni</th>
                              <th className="px-3 py-2 text-center text-slate-600">İşlem</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sorular.map((soru, idx) => (
                              <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium">{soru.soruNo}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="w-7 h-7 inline-flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full font-bold">
                                    {soru.dogruCevap}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                                    {soru.kazanimKodu || '-'}
                                  </code>
                                </td>
                                <td className="px-3 py-2 text-slate-600 max-w-xs truncate">
                                  {soru.kazanimMetni || '-'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => setParsedData(prev => prev.filter((_, i) => i !== parsedData.indexOf(soru)))}
                                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kaydet Butonu */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => onSave?.(parsedData)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Save size={18} />
                    Cevap Anahtarını Kaydet
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// Manuel Giriş Formu
function ManuelGirisForm({ onAdd }: { onAdd: (item: CevapAnahtariSatir) => void }) {
  const [formData, setFormData] = useState({
    soruNo: 1,
    dogruCevap: 'A' as const,
    dersKodu: 'TUR',
    kazanimKodu: '',
    kazanimMetni: '',
    konuAdi: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      soruNo: formData.soruNo,
      dogruCevap: formData.dogruCevap as 'A' | 'B' | 'C' | 'D' | 'E',
      dersKodu: formData.dersKodu,
      kazanimKodu: formData.kazanimKodu || undefined,
      kazanimMetni: formData.kazanimMetni || undefined,
      konuAdi: formData.konuAdi || undefined,
    });
    setFormData(prev => ({ ...prev, soruNo: prev.soruNo + 1, kazanimKodu: '', kazanimMetni: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-6 gap-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Soru No</label>
        <input
          type="number"
          value={formData.soruNo}
          onChange={(e) => setFormData({ ...formData, soruNo: parseInt(e.target.value) || 1 })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
          min={1}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Cevap</label>
        <select
          value={formData.dogruCevap}
          onChange={(e) => setFormData({ ...formData, dogruCevap: e.target.value as any })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
        >
          {['A', 'B', 'C', 'D', 'E'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Ders</label>
        <select
          value={formData.dersKodu}
          onChange={(e) => setFormData({ ...formData, dersKodu: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
        >
          {Object.entries(DERS_ISIMLERI).map(([kod, ad]) => (
            <option key={kod} value={kod}>{ad}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Kazanım Kodu</label>
        <input
          type="text"
          value={formData.kazanimKodu}
          onChange={(e) => setFormData({ ...formData, kazanimKodu: e.target.value })}
          placeholder="T.8.1.2"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
        />
      </div>
      <div className="col-span-2 flex items-end gap-2">
        <input
          type="text"
          value={formData.kazanimMetni}
          onChange={(e) => setFormData({ ...formData, kazanimMetni: e.target.value })}
          placeholder="Kazanım açıklaması..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
        >
          <Check size={18} />
        </button>
      </div>
    </form>
  );
}

