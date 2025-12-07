'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, ArrowRight, Save, Loader2, ClipboardPaste, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ImportRow {
  studentNo: string;
  firstName: string;
  lastName: string;
  class: string;
  section: string;
  parentName: string;
  tcId: string;
  phone: string;
  totalFee: number;
  paidAmount: number;
  remainingAmount: number;
  installmentCount: number;
  isValid: boolean;
  errors: string[];
}

// Kolon ismini esnek ara (boşlukları, büyük/küçük harf farkını yoksay)
const findColumn = (row: any, possibleNames: string[]): string => {
  const keys = Object.keys(row);
  
  for (const name of possibleNames) {
    // Tam eşleşme
    if (row[name] !== undefined) return row[name]?.toString() || '';
    
    // Küçük harfle eşleşme
    const lowerName = name.toLowerCase().trim();
    for (const key of keys) {
      if (key.toLowerCase().trim() === lowerName) {
        return row[key]?.toString() || '';
      }
      // Kısmi eşleşme (içeriyor mu)
      if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
        return row[key]?.toString() || '';
      }
    }
  }
  return '';
};

export default function StudentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [mappedData, setMappedData] = useState<ImportRow[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file');
  const [pasteData, setPasteData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });

  // Excel kolonlarını sistem alanlarıyla eşleştir
  const mapExcelRow = (row: any): ImportRow => {
    const errors: string[] = [];

    // Öğrenci adını ayır (Ad Soyad formatında)
    const fullName = findColumn(row, ['Öğrenciler', 'Ogrenciler', 'Ad Soyad', 'AdSoyad', 'Öğrenci', 'Ogrenci', 'İsim', 'Isim', 'Ad', 'Adı']);
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';

    // Şube bilgisini ayır (8/B05 -> class: 8, section: B05)
    const sube = findColumn(row, ['Şube', 'Sube', 'Sinif', 'Sınıf', 'Class']);
    const subeParts = sube.split('/');
    const classLevel = subeParts[0] || '';
    const section = subeParts[1] || '';

    // Veli telefon numarasını temizle
    let phone = findColumn(row, ['Veli İletişim Bilgisi', 'Veli Iletisim', 'Telefon', 'Tel', 'Phone', 'Cep', 'GSM', 'İletişim']);
    phone = phone.replace(/[^0-9+]/g, '');

    // Finansal bilgiler
    const totalFeeStr = findColumn(row, ['Taksit (Öğrenci)', 'Taksit', 'Toplam', 'Ücret', 'Ucret', 'Tutar', 'Total']);
    const paidStr = findColumn(row, ['Ödeme Öğrenci', 'Ödeme', 'Odeme', 'Ödenen', 'Odenen', 'Paid']);
    const remainingStr = findColumn(row, ['Kalan (Öğrenci)', 'Kalan', 'Borç', 'Borc', 'Balance']);
    
    const totalFee = parseFloat(totalFeeStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    const paidAmount = parseFloat(paidStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    const remainingAmount = parseFloat(remainingStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || (totalFee - paidAmount);

    // Taksit sayısını hesapla (satır sayısına göre veya varsayılan 12)
    const installmentCount = 12;

    // Validasyon - daha esnek
    if (!firstName && !lastName && !fullName) errors.push('İsim boş');

    return {
      studentNo: findColumn(row, ['Öğrenci No', 'Ogrenci No', 'No', 'Numara', 'ID', 'Öğrenci Numarası']),
      firstName,
      lastName,
      class: classLevel,
      section,
      parentName: findColumn(row, ['Veli Ad-Soyad', 'Veli AdSoyad', 'Veli', 'Veli Adı', 'Parent']),
      tcId: findColumn(row, ['Veli T.C.', 'Veli TC', 'TC', 'T.C.', 'TC Kimlik', 'TCKimlik', 'Kimlik']),
      phone,
      totalFee,
      paidAmount,
      remainingAmount,
      installmentCount,
      isValid: errors.length === 0,
      errors,
    };
  };

  // Kopyala-yapıştır verisini işle
  const handlePasteData = useCallback(() => {
    if (!pasteData.trim()) {
      toast.error('Lütfen Excel\'den veri yapıştırın');
      return;
    }

    try {
      const lines = pasteData.trim().split('\n');
      if (lines.length < 2) {
        toast.error('En az başlık satırı ve bir veri satırı olmalı');
        return;
      }

      // İlk satır başlık
      const headers = lines[0].split('\t').map(h => h.trim());
      setExcelColumns(headers);
      console.log('Yapıştırılan kolonlar:', headers);

      // Veri satırları
      const jsonData: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        if (values.length === 0 || (values.length === 1 && !values[0].trim())) continue;
        
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || '';
        });
        jsonData.push(row);
      }

      setRawData(jsonData);

      // Benzersiz öğrencileri bul
      const studentMap = new Map<string, any>();
      jsonData.forEach((row: any) => {
        const studentNo = findColumn(row, ['Öğrenci No', 'Ogrenci No', 'No', 'Numara', 'ID']);
        const studentName = findColumn(row, ['Öğrenciler', 'Ogrenciler', 'Ad Soyad', 'İsim', 'Öğrenci']);
        const key = studentNo || studentName;
        
        if (key && !studentMap.has(key)) {
          studentMap.set(key, row);
        }
      });

      let uniqueRows = Array.from(studentMap.values());
      if (uniqueRows.length === 0 && jsonData.length > 0) {
        uniqueRows = jsonData;
      }

      const mapped = uniqueRows.map(mapExcelRow);
      setMappedData(mapped);
      setStep('preview');

      toast.success(`${mapped.length} öğrenci bulundu (${jsonData.length} satırdan)`);
    } catch (error) {
      console.error('Yapıştırma hatası:', error);
      toast.error('Veri işlenemedi. Lütfen Excel\'den düzgün kopyaladığınızdan emin olun.');
    }
  }, [pasteData, mapExcelRow]);

  // Dosya yükleme
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // Dosya türü kontrolü
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    
    if (!validTypes.includes(uploadedFile.type) && !uploadedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Lütfen geçerli bir Excel dosyası seçin (.xlsx, .xls, .csv)');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        setRawData(jsonData);

        // Excel kolon isimlerini al (ilk satırdan)
        if (jsonData.length > 0) {
          const columns = Object.keys(jsonData[0] as object);
          setExcelColumns(columns);
          console.log('Excel Kolonları:', columns);
        }

        // Benzersiz öğrencileri bul (aynı öğrenci no'ya sahip satırları grupla)
        const studentMap = new Map<string, any>();
        jsonData.forEach((row: any) => {
          // Öğrenci No'yu esnek şekilde bul
          const studentNo = findColumn(row, ['Öğrenci No', 'Ogrenci No', 'No', 'Numara', 'ID']);
          
          // Öğrenci ismi ile de eşleştir (No yoksa)
          const studentName = findColumn(row, ['Öğrenciler', 'Ogrenciler', 'Ad Soyad', 'İsim', 'Öğrenci']);
          
          const key = studentNo || studentName;
          
          if (key && !studentMap.has(key)) {
            studentMap.set(key, row);
          }
        });

        // Eğer hiç benzersiz öğrenci bulunamadıysa, tüm satırları al
        let uniqueRows = Array.from(studentMap.values());
        if (uniqueRows.length === 0 && jsonData.length > 0) {
          // Her satırı benzersiz kabul et
          uniqueRows = jsonData as any[];
        }

        // Benzersiz öğrencileri eşleştir
        const mapped = uniqueRows.map(mapExcelRow);
        setMappedData(mapped);
        setStep('preview');

        toast.success(`${mapped.length} öğrenci bulundu (${jsonData.length} satırdan)`);
      } catch (error) {
        console.error('Excel okuma hatası:', error);
        toast.error('Excel dosyası okunamadı');
      }
    };

    reader.readAsBinaryString(uploadedFile);
  }, []);

  // Toplu kayıt işlemi
  const handleImport = async () => {
    const validRows = mappedData.filter((row) => row.isValid);
    
    if (validRows.length === 0) {
      toast.error('Aktarılacak geçerli kayıt bulunamadı');
      return;
    }

    setStep('importing');
    setImporting(true);
    setImportProgress(0);

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      try {
        // Öğrenci kaydı oluştur
        const studentPayload: Record<string, any> = {
          student_no: row.studentNo || `IMP-${Date.now()}-${i}`,
          first_name: row.firstName.toUpperCase(),
          last_name: row.lastName.toUpperCase(),
          parent_name: row.parentName.toUpperCase(),
          parent_phone: row.phone,
          phone: row.phone,
          tc_id: row.tcId || null,
          class: row.class,
          section: row.section,
          status: 'active',
          total_fee: row.totalFee,
          paid_amount: row.paidAmount,
          balance: row.remainingAmount,
        };
        
        // Boş değerleri temizle
        Object.keys(studentPayload).forEach(key => {
          if (studentPayload[key] === '' || studentPayload[key] === undefined) {
            delete studentPayload[key];
          }
        });

        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentPayload),
        });

        const result = await res.json();

        if (res.ok && result.success) {
          results.success++;

          // Taksit planı oluştur (eğer toplam ücret varsa)
          if (row.totalFee > 0 && result.data?.id) {
            const studentId = result.data.id;
            const monthlyAmount = Math.round((row.totalFee - row.paidAmount) / row.installmentCount);

            // Taksitleri oluştur
            for (let j = 1; j <= row.installmentCount; j++) {
              const dueDate = new Date();
              dueDate.setMonth(dueDate.getMonth() + j - 1);
              
              // Ödenen tutarı ilk taksitlere dağıt
              const isPaid = j * monthlyAmount <= row.paidAmount;

              await fetch('/api/installments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  student_id: studentId,
                  installment_no: j,
                  amount: monthlyAmount,
                  due_date: dueDate.toISOString().split('T')[0],
                  is_paid: isPaid,
                  paid_at: isPaid ? new Date().toISOString() : null,
                }),
              });
            }
          }
        } else {
          results.failed++;
          results.errors.push(`${row.firstName} ${row.lastName}: ${result.error || 'Kayıt hatası'}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${row.firstName} ${row.lastName}: ${error.message}`);
      }

      // Progress güncelle
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResults(results);
    setImporting(false);
    setStep('complete');

    if (results.success > 0) {
      toast.success(`${results.success} öğrenci başarıyla aktarıldı!`);
    }
    if (results.failed > 0) {
      toast.error(`${results.failed} kayıt aktarılamadı`);
    }
  };

  // Satır silme
  const handleRemoveRow = (index: number) => {
    setMappedData((prev) => prev.filter((_, i) => i !== index));
  };

  // Yeniden başla
  const handleReset = () => {
    setFile(null);
    setRawData([]);
    setMappedData([]);
    setExcelColumns([]);
    setPasteData('');
    setStep('upload');
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0, errors: [] });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/students" className="hover:text-indigo-600">Öğrenciler</Link>
          <span>/</span>
          <span>Excel'den Aktar</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Excel'den Toplu Öğrenci Aktarımı</h1>
        <p className="text-gray-600">
          Başka kurumlardan veya Excel dosyasından öğrenci verilerini toplu olarak sisteme aktarın.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {['upload', 'preview', 'importing', 'complete'].map((s, idx) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${
                step === s ? 'text-indigo-600' : 
                ['upload', 'preview', 'importing', 'complete'].indexOf(step) > idx ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s ? 'bg-indigo-600 text-white' :
                  ['upload', 'preview', 'importing', 'complete'].indexOf(step) > idx ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {['upload', 'preview', 'importing', 'complete'].indexOf(step) > idx ? '✓' : idx + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {s === 'upload' && 'Dosya Yükle'}
                  {s === 'preview' && 'Önizleme'}
                  {s === 'importing' && 'Aktarılıyor'}
                  {s === 'complete' && 'Tamamlandı'}
                </span>
              </div>
              {idx < 3 && <ArrowRight size={20} className="text-gray-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Tab Seçici */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setUploadMethod('file')}
                className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  uploadMethod === 'file'
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet size={20} />
                Dosya Yükle
              </button>
              <button
                onClick={() => setUploadMethod('paste')}
                className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  uploadMethod === 'paste'
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ClipboardPaste size={20} />
                Kopyala Yapıştır
              </button>
            </div>

            <div className="p-8">
              {/* Dosya Yükleme */}
              {uploadMethod === 'file' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload size={32} className="text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Excel Dosyası Seçin</h2>
                    <p className="text-gray-600 text-sm">
                      .xlsx, .xls veya .csv formatında dosya yükleyebilirsiniz
                    </p>
                  </div>

                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all">
                      <FileSpreadsheet size={40} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-700 font-medium mb-1">
                        Dosyayı sürükleyip bırakın veya tıklayın
                      </p>
                      <p className="text-sm text-gray-500">
                        Maksimum 10MB
                      </p>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </label>
                </>
              )}

              {/* Kopyala Yapıştır */}
              {uploadMethod === 'paste' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Table size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Excel'den Kopyala Yapıştır</h2>
                    <p className="text-gray-600 text-sm">
                      Excel'den satırları seçin, kopyalayın (Ctrl+C) ve aşağıya yapıştırın (Ctrl+V)
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-green-800">
                        <strong>💡 İpucu:</strong> Excel'de başlık satırı dahil tüm verileri seçin, 
                        <kbd className="mx-1 px-2 py-0.5 bg-white rounded border border-green-300 text-xs">Ctrl+C</kbd> 
                        ile kopyalayın ve aşağıdaki alana 
                        <kbd className="mx-1 px-2 py-0.5 bg-white rounded border border-green-300 text-xs">Ctrl+V</kbd> 
                        ile yapıştırın.
                      </p>
                    </div>
                    
                    <textarea
                      value={pasteData}
                      onChange={(e) => setPasteData(e.target.value)}
                      placeholder="Excel'den kopyaladığınız verileri buraya yapıştırın...&#10;&#10;Örnek:&#10;Öğrenci No&#9;Öğrenciler&#9;Şube&#9;Veli Ad-Soyad&#9;Telefon&#10;27&#9;ADA DİLA SAYGILI&#9;8/B05&#9;ARZU SAYGILI&#9;05321234567"
                      className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    />
                    
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-gray-500">
                        {pasteData.split('\n').filter(l => l.trim()).length} satır algılandı
                      </p>
                      <button
                        onClick={handlePasteData}
                        disabled={!pasteData.trim()}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle size={18} />
                        Verileri İşle
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Örnek Format */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Desteklenen Kolonlar
                </h3>
                <p className="text-sm text-amber-700 mb-3">
                  Excel dosyanızda şu kolonlardan bazıları olmalıdır:
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Öğrenci No', 'Öğrenciler', 'Şube', 'Veli Ad-Soyad', 'Veli T.C.', 'Veli İletişim Bilgisi', 'Taksit', 'Ödeme', 'Kalan'].map((col) => (
                    <span key={col} className="px-2 py-1 bg-white rounded border border-amber-200 font-mono text-amber-800">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Preview Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-xl font-bold">Önizleme</h2>
              <p className="text-indigo-100 text-sm">
                {mappedData.length} öğrenci bulundu • {mappedData.filter(r => r.isValid).length} geçerli
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition text-sm"
              >
                İptal
              </button>
              <button
                onClick={handleImport}
                disabled={mappedData.filter(r => r.isValid).length === 0}
                className="px-6 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {mappedData.filter(r => r.isValid).length} Öğrenciyi Kaydet
              </button>
            </div>
          </div>

          {/* Excel Kolon Bilgisi */}
          {excelColumns.length > 0 && (
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <p className="text-sm font-semibold text-blue-800 mb-2">📋 Excel'deki Kolonlar ({excelColumns.length} adet):</p>
              <div className="flex flex-wrap gap-2">
                {excelColumns.map((col, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white border border-blue-200 rounded text-xs font-mono text-blue-700">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Toplam Satır</p>
              <p className="text-2xl font-bold text-gray-900">{rawData.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="text-sm text-green-600">Benzersiz Öğrenci</p>
              <p className="text-2xl font-bold text-green-600">{mappedData.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <p className="text-sm text-emerald-600">Geçerli Kayıt</p>
              <p className="text-2xl font-bold text-emerald-600">{mappedData.filter(r => r.isValid).length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-red-200">
              <p className="text-sm text-red-600">Hatalı Kayıt</p>
              <p className="text-2xl font-bold text-red-600">{mappedData.filter(r => !r.isValid).length}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Durum</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Öğrenci No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Ad Soyad</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Sınıf</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Veli</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Telefon</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Toplam Ücret</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Ödenen</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Kalan</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {mappedData.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b hover:bg-gray-50 ${!row.isValid ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <CheckCircle size={18} className="text-green-600" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={18} className="text-red-600" />
                          <span className="text-xs text-red-600">{row.errors.join(', ')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">{row.studentNo || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {row.firstName} {row.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        {row.class}/{row.section}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.parentName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.phone || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₺{row.totalFee.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">
                      ₺{row.paidAmount.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-semibold">
                      ₺{row.remainingAmount.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Kaldır"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Öğrenciler Aktarılıyor...</h2>
            <p className="text-gray-600 mb-6">Lütfen bekleyin, bu işlem birkaç dakika sürebilir.</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-lg font-bold text-indigo-600">%{importProgress}</p>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              importResults.failed === 0 ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {importResults.failed === 0 ? (
                <CheckCircle size={40} className="text-green-600" />
              ) : (
                <AlertTriangle size={40} className="text-amber-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {importResults.failed === 0 ? 'Aktarım Tamamlandı!' : 'Aktarım Tamamlandı (Hatalarla)'}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                <p className="text-sm text-green-700">Başarılı</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-3xl font-bold text-red-600">{importResults.failed}</p>
                <p className="text-sm text-red-700">Başarısız</p>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left max-h-40 overflow-y-auto">
                <p className="text-sm font-semibold text-red-800 mb-2">Hatalar:</p>
                {importResults.errors.map((err, idx) => (
                  <p key={idx} className="text-xs text-red-700">• {err}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Yeni Aktarım
              </button>
              <Link
                href="/students"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Öğrenci Listesine Git
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

