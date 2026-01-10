'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple inline components
const Label = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('text-sm font-medium', className)} {...props}>{children}</label>
);

const Checkbox = ({ id, checked, onCheckedChange, defaultChecked }: {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
}) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    defaultChecked={defaultChecked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
  />
);

const RadioGroup = ({ value, onValueChange, children }: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) => (
  <div className="space-y-2" onChange={(e: any) => onValueChange?.(e.target.value)}>
    {children}
  </div>
);

const RadioGroupItem = ({ value, id }: { value: string; id?: string }) => (
  <input type="radio" value={value} id={id} name="view-mode" className="h-4 w-4 text-emerald-600" />
);

const Slider = ({ defaultValue, max, step, className }: {
  defaultValue?: number[];
  max?: number;
  step?: number;
  className?: string;
}) => (
  <input
    type="range"
    min={0}
    max={max}
    step={step}
    defaultValue={defaultValue?.[0]}
    className={cn("w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer", className)}
  />
);
import type { ExamSection, ColumnSettings, ViewMode } from '@/types/spectra-detail';

interface ViewSettingsProps {
  sections: ExamSection[];
  columns: ColumnSettings;
  onColumnChange: (key: keyof ColumnSettings, value: any) => void;
  onReset: () => void;
}

export function ViewSettings({
  sections,
  columns,
  onColumnChange,
  onReset,
}: ViewSettingsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Kolon Gösterimi */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-medium text-sm text-gray-700 mb-3">📋 Kolon Gösterimi</h4>
        <div className="space-y-4">
          {/* Bilgi Kolonları */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Bilgi Kolonları</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'sira', label: 'Sıra Numarası' },
                { key: 'numara', label: 'Öğrenci Numarası' },
                { key: 'ogrenci', label: 'Öğrenci Adı' },
                { key: 'sinif', label: 'Sınıf/Şube' },
                { key: 'tip', label: 'Tip (Asil/Misafir)' },
                { key: 'kitapcik', label: 'Kitapçık' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${key}`}
                    checked={columns[key as keyof ColumnSettings] as boolean}
                    onCheckedChange={(c) => onColumnChange(key as keyof ColumnSettings, c)}
                  />
                  <Label htmlFor={`col-${key}`} className="text-xs">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Puan Kolonları */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Puan Kolonları</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'puan', label: 'Tahmini Puan' },
                { key: 'subeSira', label: 'Şube Sırası' },
                { key: 'kurumSira', label: 'Kurum Sırası' },
                { key: 'yuzdelikDilim', label: 'Yüzdelik Dilim' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${key}`}
                    checked={columns[key as keyof ColumnSettings] as boolean}
                    onCheckedChange={(c) => onColumnChange(key as keyof ColumnSettings, c)}
                  />
                  <Label htmlFor={`col-${key}`} className="text-xs">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Toplam Kolonları */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Toplam Kolonları</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'toplamNet', label: 'Toplam Net' },
                { key: 'sozelToplam', label: 'Sözel Toplam' },
                { key: 'sayisalToplam', label: 'Sayısal Toplam' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${key}`}
                    checked={columns[key as keyof ColumnSettings] as boolean}
                    onCheckedChange={(c) => onColumnChange(key as keyof ColumnSettings, c)}
                  />
                  <Label htmlFor={`col-${key}`} className="text-xs">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Ders Kolonları */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Ders Kolonları</Label>
            <div className="grid grid-cols-2 gap-2">
              {sections.map((s) => (
                <div key={s.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-ders-${s.code}`}
                    checked={columns.dersler[s.code] ?? true}
                    onCheckedChange={(c) =>
                      onColumnChange('dersler', { ...columns.dersler, [s.code]: !!c })
                    }
                  />
                  <Label htmlFor={`col-ders-${s.code}`} className="text-xs">
                    {s.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tablo Görünümü */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-medium text-sm text-gray-700 mb-3">🎨 Tablo Görünümü</h4>
        <div className="space-y-4">
          {/* Görünüm Modu */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Görünüm Modu</Label>
            <RadioGroup
              value={columns.gorunumModu}
              onValueChange={(v: ViewMode) => onColumnChange('gorunumModu', v)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standart" id="mod-standart" />
                <Label htmlFor="mod-standart" className="text-sm">
                  Standart (Net + D/Y)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="kompakt" id="mod-kompakt" />
                <Label htmlFor="mod-kompakt" className="text-sm">
                  Kompakt (Sadece Net)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detayli" id="mod-detayli" />
                <Label htmlFor="mod-detayli" className="text-sm">
                  Detaylı (Net + D + Y + B)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yuzdelik" id="mod-yuzdelik" />
                <Label htmlFor="mod-yuzdelik" className="text-sm">
                  Yüzdelik (% başarı)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Satır Yüksekliği */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Satır Yüksekliği</Label>
            <Slider defaultValue={[50]} max={100} step={25} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Dar</span>
              <span>Normal</span>
              <span>Geniş</span>
            </div>
          </div>

          {/* Renklendirme */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Renklendirme</Label>
            <div className="space-y-2">
              {[
                { key: 'ilk3Vurgula', label: 'İlk 3\'ü vurgula (madalya)' },
                { key: 'ortalamaAltiKirmizi', label: 'Ortalamanın altını kırmızı' },
                { key: 'ortalamaUstuYesil', label: 'Ortalamanın üstünü yeşil' },
                { key: 'zebraSatirlar', label: 'Zebra satırlar' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`renk-${key}`}
                    checked={columns.renklendirme[key as keyof typeof columns.renklendirme]}
                    onCheckedChange={(c) =>
                      onColumnChange('renklendirme', {
                        ...columns.renklendirme,
                        [key]: !!c,
                      })
                    }
                  />
                  <Label htmlFor={`renk-${key}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="md:col-span-2 flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Varsayılana Dön
        </Button>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Ayarları Kaydet
        </Button>
      </div>
    </div>
  );
}
