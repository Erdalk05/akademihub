'use client';

import React, { useState, useCallback } from 'react';
import { 
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, ArrowRight, Save, Loader2, 
  ClipboardPaste, Table, User, Users, GraduationCap, Wallet, Download, HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Genişletilmiş Import Row - Kayıt Sözleşmesindeki Tüm Alanlar
interface ImportRow {
  // Öğrenci Bilgileri
  studentNo: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  phone2: string;
  email: string;
  city: string;
  district: string;
  address: string;
  previousSchool: string;
  healthNotes: string;
  
  // Eğitim Bilgileri
  class: string;
  section: string;
  programName: string;
  academicYear: string;
  
  // Veli Bilgileri
  parentType: string;
  parentName: string;
  parentTcNo: string;
  parentPhone: string;
  parentEmail: string;
  parentJob: string;
  parentWorkplace: string;
  parentWorkAddress: string;
  parentWorkPhone: string;
  parentHomeAddress: string;
  parentHomeCity: string;
  parentHomeDistrict: string;
  
  // Ödeme Bilgileri
  totalFee: number;
  discountPercent: number;
  discountAmount: number;
  netFee: number;
  downPayment: number;
  installmentCount: number;
  firstInstallmentDate: string;
  paymentMethod: string;
  paidAmount: number;
  remainingAmount: number;
  
  // Validasyon
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Kolon ismini esnek ara
const findColumn = (row: any, possibleNames: string[]): string => {
  const keys = Object.keys(row);
  
  for (const name of possibleNames) {
    if (row[name] !== undefined) return row[name]?.toString().trim() || '';
    
    const lowerName = name.toLowerCase().trim();
    for (const key of keys) {
      const lowerKey = key.toLowerCase().trim();
      if (lowerKey === lowerName) return row[key]?.toString().trim() || '';
      if (lowerKey.includes(lowerName) || lowerName.includes(lowerKey)) {
        return row[key]?.toString().trim() || '';
      }
    }
  }
  return '';
};

// Para formatını sayıya çevir
const parseAmount = (str: string): number => {
  if (!str) return 0;
  return parseFloat(str.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
};

// Desteklenen kolonlar listesi
const SUPPORTED_COLUMNS = {
  student: [
    { key: 'Öğrenci No', desc: 'Benzersiz öğrenci numarası' },
    { key: 'Ad', desc: 'Öğrenci adı' },
    { key: 'Soyad', desc: 'Öğrenci soyadı' },
    { key: 'TC Kimlik', desc: '11 haneli TC kimlik numarası' },
    { key: 'Doğum Tarihi', desc: 'GG.AA.YYYY formatında' },
    { key: 'Doğum Yeri', desc: 'Doğum yeri/şehri' },
    { key: 'Cinsiyet', desc: 'Erkek veya Kadın' },
    { key: 'Kan Grubu', desc: 'A+, B-, O+, AB+ vb.' },
    { key: 'Uyruk', desc: 'TC veya diğer' },
    { key: 'Telefon', desc: 'Öğrenci telefonu' },
    { key: 'Telefon 2', desc: 'İkinci telefon' },
    { key: 'E-posta', desc: 'Öğrenci e-postası' },
    { key: 'Şehir', desc: 'İkamet şehri' },
    { key: 'İlçe', desc: 'İkamet ilçesi' },
    { key: 'Adres', desc: 'Tam adres' },
    { key: 'Önceki Okul', desc: 'Önceki okul adı' },
    { key: 'Sağlık Notu', desc: 'Alerji, hastalık vb.' },
  ],
  education: [
    { key: 'Sınıf', desc: '1, 2, 3... veya 8/A' },
    { key: 'Şube', desc: 'A, B, C veya şube adı' },
    { key: 'Program', desc: 'Eğitim programı adı' },
    { key: 'Akademik Yıl', desc: '2024-2025 formatında' },
  ],
  parent: [
    { key: 'Veli Tipi', desc: 'Anne/Baba/Vasi' },
    { key: 'Veli Ad Soyad', desc: 'Veli tam adı' },
    { key: 'Veli TC', desc: 'Veli TC kimlik' },
    { key: 'Veli Telefon', desc: 'Veli telefonu' },
    { key: 'Veli E-posta', desc: 'Veli e-postası' },
    { key: 'Veli Meslek', desc: 'Meslek' },
    { key: 'İş Yeri', desc: 'Çalıştığı kurum' },
    { key: 'İş Adresi', desc: 'İş yeri adresi' },
    { key: 'İş Telefonu', desc: 'İş telefonu' },
    { key: 'Ev Adresi', desc: 'Veli ev adresi' },
    { key: 'Ev Şehri', desc: 'Veli ikamet şehri' },
    { key: 'Ev İlçesi', desc: 'Veli ikamet ilçesi' },
  ],
  payment: [
    { key: 'Toplam Ücret', desc: 'Brüt eğitim ücreti' },
    { key: 'İndirim %', desc: 'Yüzde olarak indirim' },
    { key: 'İndirim Tutarı', desc: 'TL olarak indirim' },
    { key: 'Net Ücret', desc: 'Ödenecek toplam' },
    { key: 'Peşinat', desc: 'Peşin ödeme tutarı' },
    { key: 'Taksit Sayısı', desc: 'Aylık taksit adedi' },
    { key: 'İlk Taksit Tarihi', desc: 'GG.AA.YYYY' },
    { key: 'Ödeme Yöntemi', desc: 'Nakit/Kredi/Havale' },
    { key: 'Ödenen', desc: 'Şu ana kadar ödenen' },
    { key: 'Kalan', desc: 'Kalan borç' },
  ],
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
  const [showColumnGuide, setShowColumnGuide] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });

  // Excel satırını eşleştir
  const mapExcelRow = (row: any): ImportRow => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Öğrenci adını ayır (Ad Soyad formatında olabilir)
    let firstName = findColumn(row, ['Ad', 'Adı', 'FirstName', 'First Name']);
    let lastName = findColumn(row, ['Soyad', 'Soyadı', 'LastName', 'Last Name']);
    
    // Eğer ayrı alanlar yoksa, birleşik alandan ayır
    if (!firstName && !lastName) {
      const fullName = findColumn(row, ['Öğrenciler', 'Ogrenciler', 'Ad Soyad', 'AdSoyad', 'Öğrenci', 'Ogrenci', 'İsim', 'Isim', 'Tam Ad']);
      const nameParts = fullName.trim().split(' ');
      firstName = nameParts.slice(0, -1).join(' ') || nameParts[0] || '';
      lastName = nameParts[nameParts.length - 1] || '';
    }

    // Şube bilgisini ayır (8/B05 -> class: 8, section: B05)
    let classLevel = findColumn(row, ['Sınıf', 'Sinif', 'Class', 'Seviye']);
    let section = findColumn(row, ['Şube', 'Sube', 'Section', 'Bölüm']);
    
    if (!section && classLevel.includes('/')) {
      const subeParts = classLevel.split('/');
      classLevel = subeParts[0] || '';
      section = subeParts[1] || '';
    }

    // Telefon numaralarını temizle
    let phone = findColumn(row, ['Telefon', 'Tel', 'Phone', 'Cep', 'GSM', 'Öğrenci Telefon']);
    phone = phone.replace(/[^0-9+]/g, '');
    
    let phone2 = findColumn(row, ['Telefon 2', 'Tel 2', 'İkinci Telefon', 'Diğer Telefon']);
    phone2 = phone2.replace(/[^0-9+]/g, '');
    
    let parentPhone = findColumn(row, ['Veli Telefon', 'Veli Tel', 'Veli İletişim', 'Veli İletişim Bilgisi', 'Veli GSM']);
    parentPhone = parentPhone.replace(/[^0-9+]/g, '');

    // Finansal bilgiler
    const totalFee = parseAmount(findColumn(row, ['Toplam Ücret', 'Taksit (Öğrenci)', 'Taksit', 'Toplam', 'Ücret', 'Ucret', 'Brüt Tutar', 'Total']));
    const discountPercent = parseAmount(findColumn(row, ['İndirim %', 'İndirim Yüzde', 'İndirim Oranı', 'Discount %']));
    const discountAmount = parseAmount(findColumn(row, ['İndirim Tutarı', 'İndirim', 'Discount Amount']));
    const netFee = parseAmount(findColumn(row, ['Net Ücret', 'Net Tutar', 'Ödenecek', 'Net Fee'])) || (totalFee - discountAmount);
    const downPayment = parseAmount(findColumn(row, ['Peşinat', 'Kapora', 'Ön Ödeme', 'Down Payment']));
    const paidAmount = parseAmount(findColumn(row, ['Ödeme Öğrenci', 'Ödeme', 'Odeme', 'Ödenen', 'Odenen', 'Paid', 'Tahsil Edilen']));
    const remainingAmount = parseAmount(findColumn(row, ['Kalan (Öğrenci)', 'Kalan', 'Borç', 'Borc', 'Balance', 'Kalan Borç'])) || (netFee - paidAmount);
    const installmentCount = parseInt(findColumn(row, ['Taksit Sayısı', 'Taksit Adedi', 'Installments'])) || 12;

    // Cinsiyet
    let gender = findColumn(row, ['Cinsiyet', 'Gender', 'Sex']).toLowerCase();
    if (gender.includes('erkek') || gender === 'male' || gender === 'e' || gender === 'm') {
      gender = 'Erkek';
    } else if (gender.includes('kadın') || gender.includes('kız') || gender === 'female' || gender === 'k' || gender === 'f') {
      gender = 'Kadın';
    }

    // Validasyon
    if (!firstName && !lastName) errors.push('İsim boş');
    if (totalFee > 0 && !parentPhone && !phone) warnings.push('Telefon eksik');

    return {
      // Öğrenci Bilgileri
      studentNo: findColumn(row, ['Öğrenci No', 'Ogrenci No', 'No', 'Numara', 'ID', 'Öğrenci Numarası']),
      firstName,
      lastName,
      tcNo: findColumn(row, ['TC Kimlik', 'TC', 'T.C.', 'TC No', 'Kimlik No', 'Öğrenci TC']),
      birthDate: findColumn(row, ['Doğum Tarihi', 'Dogum Tarihi', 'Birth Date', 'Doğum']),
      birthPlace: findColumn(row, ['Doğum Yeri', 'Dogum Yeri', 'Birth Place']),
      nationality: findColumn(row, ['Uyruk', 'Nationality', 'Vatandaşlık']) || 'TC',
      gender,
      bloodGroup: findColumn(row, ['Kan Grubu', 'Blood Group', 'Kan']),
      phone,
      phone2,
      email: findColumn(row, ['E-posta', 'Email', 'Mail', 'Öğrenci E-posta']),
      city: findColumn(row, ['Şehir', 'Sehir', 'İl', 'City']),
      district: findColumn(row, ['İlçe', 'Ilce', 'District']),
      address: findColumn(row, ['Adres', 'Address', 'Tam Adres']),
      previousSchool: findColumn(row, ['Önceki Okul', 'Onceki Okul', 'Eski Okul', 'Previous School']),
      healthNotes: findColumn(row, ['Sağlık Notu', 'Saglik Notu', 'Sağlık', 'Health Notes', 'Alerji']),
      
      // Eğitim Bilgileri
      class: classLevel,
      section,
      programName: findColumn(row, ['Program', 'Program Adı', 'Eğitim Programı', 'Kurs']),
      academicYear: findColumn(row, ['Akademik Yıl', 'Eğitim Yılı', 'Dönem', 'Academic Year']) || '2024-2025',
      
      // Veli Bilgileri
      parentType: findColumn(row, ['Veli Tipi', 'Veli Türü', 'Yakınlık', 'Parent Type']) || 'Anne',
      parentName: findColumn(row, ['Veli Ad-Soyad', 'Veli AdSoyad', 'Veli', 'Veli Adı', 'Parent Name']),
      parentTcNo: findColumn(row, ['Veli T.C.', 'Veli TC', 'Veli TC Kimlik', 'Veli Kimlik']),
      parentPhone,
      parentEmail: findColumn(row, ['Veli E-posta', 'Veli Email', 'Veli Mail', 'Parent Email']),
      parentJob: findColumn(row, ['Veli Meslek', 'Meslek', 'Job', 'Occupation']),
      parentWorkplace: findColumn(row, ['İş Yeri', 'Çalıştığı Yer', 'Workplace', 'Şirket']),
      parentWorkAddress: findColumn(row, ['İş Adresi', 'Work Address']),
      parentWorkPhone: findColumn(row, ['İş Telefonu', 'Work Phone', 'İş Tel']),
      parentHomeAddress: findColumn(row, ['Ev Adresi', 'Home Address', 'Veli Adres']),
      parentHomeCity: findColumn(row, ['Ev Şehri', 'Veli Şehir', 'Home City']),
      parentHomeDistrict: findColumn(row, ['Ev İlçesi', 'Veli İlçe', 'Home District']),
      
      // Ödeme Bilgileri
      totalFee,
      discountPercent,
      discountAmount,
      netFee,
      downPayment,
      installmentCount,
      firstInstallmentDate: findColumn(row, ['İlk Taksit Tarihi', 'Taksit Başlangıç', 'First Installment']),
      paymentMethod: findColumn(row, ['Ödeme Yöntemi', 'Ödeme Şekli', 'Payment Method']) || 'Nakit',
      paidAmount,
      remainingAmount,
      
      // Validasyon
      isValid: errors.length === 0,
      errors,
      warnings,
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

      const headers = lines[0].split('\t').map(h => h.trim());
      setExcelColumns(headers);

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
        const key = studentNo || studentName || `row-${jsonData.indexOf(row)}`;
        
        if (!studentMap.has(key)) {
          studentMap.set(key, row);
        }
      });

      const uniqueRows = Array.from(studentMap.values());
      const mapped = uniqueRows.map(mapExcelRow);
      setMappedData(mapped);
      setStep('preview');

      toast.success(`${mapped.length} öğrenci bulundu (${jsonData.length} satırdan)`);
    } catch (error) {
      console.error('Yapıştırma hatası:', error);
      toast.error('Veri işlenemedi. Lütfen Excel\'den düzgün kopyaladığınızdan emin olun.');
    }
  }, [pasteData]);

  // Dosya yükleme
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

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

        if (jsonData.length > 0) {
          const columns = Object.keys(jsonData[0] as object);
          setExcelColumns(columns);
        }

        // Benzersiz öğrencileri bul
        const studentMap = new Map<string, any>();
        jsonData.forEach((row: any, idx: number) => {
          const studentNo = findColumn(row, ['Öğrenci No', 'Ogrenci No', 'No', 'Numara', 'ID']);
          const studentName = findColumn(row, ['Öğrenciler', 'Ogrenciler', 'Ad Soyad', 'İsim', 'Öğrenci']);
          const key = studentNo || studentName || `row-${idx}`;
          
          if (!studentMap.has(key)) {
            studentMap.set(key, row);
          }
        });

        const uniqueRows = Array.from(studentMap.values());
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

  // Örnek Excel şablonu indir
  const downloadTemplate = () => {
    const templateData = [
      {
        'Öğrenci No': '2024-001',
        'Ad': 'Ahmet',
        'Soyad': 'Yılmaz',
        'TC Kimlik': '12345678901',
        'Doğum Tarihi': '15.05.2010',
        'Doğum Yeri': 'Ankara',
        'Cinsiyet': 'Erkek',
        'Kan Grubu': 'A+',
        'Uyruk': 'TC',
        'Telefon': '05321234567',
        'E-posta': 'ahmet@mail.com',
        'Şehir': 'Ankara',
        'İlçe': 'Çankaya',
        'Adres': 'Örnek Mah. 123 Sok. No:5',
        'Sınıf': '8',
        'Şube': 'A',
        'Program': 'Ortaokul',
        'Akademik Yıl': '2024-2025',
        'Veli Tipi': 'Anne',
        'Veli Ad Soyad': 'Ayşe Yılmaz',
        'Veli TC': '98765432109',
        'Veli Telefon': '05551234567',
        'Veli E-posta': 'ayse@mail.com',
        'Veli Meslek': 'Öğretmen',
        'Toplam Ücret': '50000',
        'İndirim %': '10',
        'Net Ücret': '45000',
        'Peşinat': '5000',
        'Taksit Sayısı': '10',
        'Ödeme Yöntemi': 'Nakit',
        'Ödenen': '5000',
        'Kalan': '40000',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Öğrenci Şablonu');
    XLSX.writeFile(wb, 'ogrenci_kayit_sablonu.xlsx');
    toast.success('Şablon indirildi!');
  };

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
        // Öğrenci kaydı oluştur - tüm alanlarla
        const studentPayload: Record<string, any> = {
          student_no: row.studentNo || `IMP-${Date.now()}-${i}`,
          first_name: row.firstName.toUpperCase(),
          last_name: row.lastName.toUpperCase(),
          full_name: `${row.firstName} ${row.lastName}`.toUpperCase(),
          tc_id: row.tcNo || null,
          birth_date: row.birthDate || null,
          birth_place: row.birthPlace || null,
          nationality: row.nationality || 'TC',
          gender: row.gender === 'Erkek' ? 'male' : row.gender === 'Kadın' ? 'female' : null,
          blood_type: row.bloodGroup || null,
          phone: row.phone || row.parentPhone || null,
          phone2: row.phone2 || null,
          email: row.email || null,
          city: row.city || row.parentHomeCity || null,
          district: row.district || row.parentHomeDistrict || null,
          address: row.address || row.parentHomeAddress || null,
          previous_school: row.previousSchool || null,
          health_notes: row.healthNotes || null,
          class: row.class || null,
          section: row.section || null,
          program_name: row.programName || null,
          academic_year: row.academicYear || '2024-2025',
          parent_name: row.parentName?.toUpperCase() || null,
          parent_phone: row.parentPhone || null,
          parent_email: row.parentEmail || null,
          status: 'active',
          total_amount: row.netFee || row.totalFee || 0,
          paid_amount: row.paidAmount || 0,
          balance: row.remainingAmount || 0,
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

          // Taksit planı oluştur
          if ((row.netFee > 0 || row.totalFee > 0) && result.data?.id) {
            const studentId = result.data.id;
            const totalAmount = row.netFee || row.totalFee;
            const remainingAfterDown = totalAmount - (row.downPayment || 0);
            const monthlyAmount = Math.round(remainingAfterDown / row.installmentCount);

            // Peşinat taksiti
            if (row.downPayment > 0) {
              await fetch('/api/installments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  student_id: studentId,
                  installment_no: 0,
                  amount: row.downPayment,
                  due_date: new Date().toISOString().split('T')[0],
                  status: row.paidAmount >= row.downPayment ? 'paid' : 'pending',
                  paid_amount: Math.min(row.paidAmount, row.downPayment),
                }),
              });
            }

            // Diğer taksitler
            let remainingPaid = row.paidAmount - (row.downPayment || 0);
            for (let j = 1; j <= row.installmentCount; j++) {
              const dueDate = new Date();
              if (row.firstInstallmentDate) {
                const parts = row.firstInstallmentDate.split(/[./-]/);
                if (parts.length === 3) {
                  dueDate.setFullYear(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                }
              }
              dueDate.setMonth(dueDate.getMonth() + j - 1);
              
              const isPaid = remainingPaid >= monthlyAmount;
              const paidForThis = isPaid ? monthlyAmount : Math.max(0, remainingPaid);
              remainingPaid -= paidForThis;

              await fetch('/api/installments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  student_id: studentId,
                  installment_no: j,
                  amount: monthlyAmount,
                  due_date: dueDate.toISOString().split('T')[0],
                  status: isPaid ? 'paid' : 'pending',
                  paid_amount: paidForThis,
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
          <span>Excel'den Kayıt Aktar</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Excel'den Toplu Kayıt Aktarımı</h1>
            <p className="text-gray-600">
              Kayıt sözleşmesindeki tüm bilgileri içeren Excel dosyasından öğrenci verilerini aktarın.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download size={18} />
            Şablon İndir
          </button>
        </div>
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
        <div className="max-w-4xl mx-auto">
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
                    <textarea
                      value={pasteData}
                      onChange={(e) => setPasteData(e.target.value)}
                      placeholder="Excel'den kopyaladığınız verileri buraya yapıştırın..."
                      className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
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

              {/* Desteklenen Kolonlar Butonu */}
              <div className="mt-6">
                <button
                  onClick={() => setShowColumnGuide(!showColumnGuide)}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <HelpCircle size={18} />
                  {showColumnGuide ? 'Kolon Rehberini Gizle' : 'Desteklenen Kolonları Göster'}
                </button>
              </div>

              {/* Kolon Rehberi */}
              {showColumnGuide && (
                <div className="mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-4 text-lg">📋 Kayıt Sözleşmesi Kolon Rehberi</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Öğrenci Bilgileri */}
                    <div>
                      <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                        <User size={16} /> Öğrenci Bilgileri
                      </h4>
                      <div className="space-y-1">
                        {SUPPORTED_COLUMNS.student.map((col) => (
                          <div key={col.key} className="flex items-start gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-white rounded border font-mono text-indigo-600 text-xs whitespace-nowrap">
                              {col.key}
                            </span>
                            <span className="text-gray-600 text-xs">{col.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Veli Bilgileri */}
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <Users size={16} /> Veli Bilgileri
                      </h4>
                      <div className="space-y-1">
                        {SUPPORTED_COLUMNS.parent.map((col) => (
                          <div key={col.key} className="flex items-start gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-white rounded border font-mono text-green-600 text-xs whitespace-nowrap">
                              {col.key}
                            </span>
                            <span className="text-gray-600 text-xs">{col.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Eğitim Bilgileri */}
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                        <GraduationCap size={16} /> Eğitim Bilgileri
                      </h4>
                      <div className="space-y-1">
                        {SUPPORTED_COLUMNS.education.map((col) => (
                          <div key={col.key} className="flex items-start gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-white rounded border font-mono text-purple-600 text-xs whitespace-nowrap">
                              {col.key}
                            </span>
                            <span className="text-gray-600 text-xs">{col.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ödeme Bilgileri */}
                    <div>
                      <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                        <Wallet size={16} /> Ödeme Bilgileri
                      </h4>
                      <div className="space-y-1">
                        {SUPPORTED_COLUMNS.payment.map((col) => (
                          <div key={col.key} className="flex items-start gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-white rounded border font-mono text-amber-600 text-xs whitespace-nowrap">
                              {col.key}
                            </span>
                            <span className="text-gray-600 text-xs">{col.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                {mappedData.length} öğrenci • {mappedData.filter(r => r.isValid).length} geçerli • {mappedData.filter(r => r.warnings.length > 0).length} uyarılı
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
          <div className="grid grid-cols-5 gap-4 p-6 bg-gray-50 border-b">
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
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <p className="text-sm text-amber-600">Uyarılı</p>
              <p className="text-2xl font-bold text-amber-600">{mappedData.filter(r => r.warnings.length > 0).length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-red-200">
              <p className="text-sm text-red-600">Hatalı</p>
              <p className="text-2xl font-bold text-red-600">{mappedData.filter(r => !r.isValid).length}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Durum</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Öğrenci No</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Ad Soyad</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">TC</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Sınıf</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Veli</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Telefon</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700">Net Ücret</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700">Ödenen</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700">Kalan</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {mappedData.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b hover:bg-gray-50 ${!row.isValid ? 'bg-red-50' : row.warnings.length > 0 ? 'bg-amber-50' : ''}`}
                  >
                    <td className="px-3 py-3">
                      {row.isValid ? (
                        row.warnings.length > 0 ? (
                          <div className="flex items-center gap-1" title={row.warnings.join(', ')}>
                            <AlertTriangle size={16} className="text-amber-500" />
                          </div>
                        ) : (
                          <CheckCircle size={16} className="text-green-600" />
                        )
                      ) : (
                        <div className="flex items-center gap-1" title={row.errors.join(', ')}>
                          <X size={16} className="text-red-600" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-600 text-xs">{row.studentNo || '-'}</td>
                    <td className="px-3 py-3 font-semibold text-gray-900">
                      {row.firstName} {row.lastName}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-600 text-xs">{row.tcNo?.slice(0, 3)}***</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        {row.class}/{row.section || 'A'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-xs">{row.parentName || '-'}</td>
                    <td className="px-3 py-3 text-gray-600 font-mono text-xs">{row.parentPhone || row.phone || '-'}</td>
                    <td className="px-3 py-3 text-right font-semibold">
                      ₺{(row.netFee || row.totalFee).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 text-right text-green-600 font-semibold">
                      ₺{row.paidAmount.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 text-right text-red-600 font-semibold">
                      ₺{row.remainingAmount.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 text-center">
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
