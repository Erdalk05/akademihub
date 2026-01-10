'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Share2,
  Download,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple inline components
const Label = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('text-sm font-medium', className)} {...props}>{children}</label>
);

const Checkbox = ({ id, defaultChecked }: { id?: string; defaultChecked?: boolean }) => (
  <input
    type="checkbox"
    id={id}
    defaultChecked={defaultChecked}
    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
  />
);

const RadioGroup = ({ value, onValueChange, defaultValue, children }: {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2" onChange={(e: any) => onValueChange?.(e.target.value)}>
    {children}
  </div>
);

const RadioGroupItem = ({ value, id }: { value: string; id?: string }) => (
  <input type="radio" value={value} id={id} name={`radio-${id?.split('-')[0]}`} className="h-4 w-4 text-emerald-600" />
);

interface ExportOptionsProps {
  onExportExcel: (format: 'ozdebir' | 'k12net' | 'standart') => void;
  onExportPdf: (format: 'toplu' | 'bireysel' | 'detayli') => void;
  onPrint: () => void;
  isExporting: boolean;
}

export function ExportOptions({
  onExportExcel,
  onExportPdf,
  onPrint,
  isExporting,
}: ExportOptionsProps) {
  const [excelFormat, setExcelFormat] = useState<'ozdebir' | 'k12net' | 'standart'>('ozdebir');
  const [pdfFormat, setPdfFormat] = useState<'toplu' | 'bireysel' | 'detayli'>('toplu');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Excel Export */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <h4 className="font-medium">Excel</h4>
          </div>
          <div className="mb-3">
            <Label className="text-xs text-gray-500 mb-2 block">Format</Label>
            <RadioGroup value={excelFormat} onValueChange={(v: any) => setExcelFormat(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ozdebir" id="excel-ozdebir" />
                <Label htmlFor="excel-ozdebir" className="text-sm">Özdebir</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="k12net" id="excel-k12net" />
                <Label htmlFor="excel-k12net" className="text-sm">K12Net</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standart" id="excel-standart" />
                <Label htmlFor="excel-standart" className="text-sm">Standart</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="mb-3">
            <Label className="text-xs text-gray-500 mb-2 block">İçerik</Label>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="excel-bilgi" defaultChecked />
                <Label htmlFor="excel-bilgi" className="text-xs">Öğrenci Bilgileri</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="excel-ders" defaultChecked />
                <Label htmlFor="excel-ders" className="text-xs">Tüm Dersler</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="excel-dyb" defaultChecked />
                <Label htmlFor="excel-dyb" className="text-xs">D/Y/B Detay</Label>
              </div>
            </div>
          </div>
          <Button 
            className="w-full" 
            onClick={() => onExportExcel(excelFormat)}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            İndir
          </Button>
        </div>

        {/* PDF Export */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-8 w-8 text-red-600" />
            <h4 className="font-medium">PDF</h4>
          </div>
          <div className="mb-3">
            <Label className="text-xs text-gray-500 mb-2 block">Format</Label>
            <RadioGroup value={pdfFormat} onValueChange={(v: any) => setPdfFormat(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="toplu" id="pdf-toplu" />
                <Label htmlFor="pdf-toplu" className="text-sm">Toplu Liste</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bireysel" id="pdf-bireysel" />
                <Label htmlFor="pdf-bireysel" className="text-sm">Bireysel Karneler</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detayli" id="pdf-detayli" />
                <Label htmlFor="pdf-detayli" className="text-sm">Detaylı Rapor</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="mb-3">
            <Label className="text-xs text-gray-500 mb-2 block">İçerik</Label>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="pdf-ozet" defaultChecked />
                <Label htmlFor="pdf-ozet" className="text-xs">Özet Bilgiler</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="pdf-grafik" defaultChecked />
                <Label htmlFor="pdf-grafik" className="text-xs">Grafikler</Label>
              </div>
            </div>
          </div>
          <Button 
            className="w-full" 
            onClick={() => onExportPdf(pdfFormat)}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            İndir
          </Button>
        </div>

        {/* Yazdır */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Printer className="h-8 w-8 text-gray-600" />
            <h4 className="font-medium">Yazdır</h4>
          </div>
          <div className="mb-3">
            <Label className="text-xs text-gray-500 mb-2 block">Sayfa</Label>
            <RadioGroup defaultValue="a4-yatay">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a4-yatay" id="print-a4y" />
                <Label htmlFor="print-a4y" className="text-sm">A4 Yatay</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a4-dikey" id="print-a4d" />
                <Label htmlFor="print-a4d" className="text-sm">A4 Dikey</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a3-yatay" id="print-a3y" />
                <Label htmlFor="print-a3y" className="text-sm">A3 Yatay</Label>
              </div>
            </RadioGroup>
          </div>
          <Button className="w-full" variant="outline" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Yazdır
          </Button>
        </div>

        {/* Paylaş */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Share2 className="h-8 w-8 text-blue-600" />
            <h4 className="font-medium">Paylaş</h4>
          </div>
          <div className="mb-3">
            <Label className="text-xs text-gray-500 mb-2 block">Kanal</Label>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="share-wp" />
                <Label htmlFor="share-wp" className="text-sm">WhatsApp</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="share-email" />
                <Label htmlFor="share-email" className="text-sm">E-posta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="share-sms" />
                <Label htmlFor="share-sms" className="text-sm">SMS</Label>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <Label className="text-xs text-gray-500 mb-2 block">Alıcı</Label>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="alici-veli" />
                <Label htmlFor="alici-veli" className="text-sm">Veliler</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="alici-ogretmen" />
                <Label htmlFor="alici-ogretmen" className="text-sm">Öğretmenler</Label>
              </div>
            </div>
          </div>
          <Button className="w-full" variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Gönder
          </Button>
        </div>
      </div>

      {/* Hazır Raporlar */}
      <div className="pt-4 border-t">
        <Label className="text-sm font-medium mb-3 block">📋 Hazır Raporlar</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { icon: '📊', label: 'Toplu Sonuç' },
            { icon: '📈', label: 'Sınav Analizi' },
            { icon: '🏆', label: 'Derece Raporu' },
            { icon: '👤', label: 'Bireysel Karne' },
            { icon: '📚', label: 'Ders Dökümü' },
          ].map((r) => (
            <Button key={r.label} variant="outline" className="justify-start h-auto py-2">
              <span className="mr-2">{r.icon}</span>
              <span className="text-xs">{r.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
