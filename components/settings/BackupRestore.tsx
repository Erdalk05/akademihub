'use client';

import React, { useState, useRef } from 'react';
import { 
  Download, Upload, Database, AlertTriangle, Check, 
  RefreshCw, Trash2, FileJson, Calendar, HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BackupData {
  version: string;
  timestamp: string;
  data: {
    students: any[];
    installments: any[];
    expenses: any[];
    contracts: any[];
    users: any[];
    settings: any;
    academicYears: any[];
  };
  checksum: string;
}

export default function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // localStorage'daki tüm verileri al
  const getAllData = (): BackupData['data'] => {
    const data: BackupData['data'] = {
      students: [],
      installments: [],
      expenses: [],
      contracts: [],
      users: [],
      settings: {},
      academicYears: [],
    };

    try {
      // Students
      const studentsStr = localStorage.getItem('students');
      if (studentsStr) data.students = JSON.parse(studentsStr);

      // Installments
      const installmentsStr = localStorage.getItem('installments');
      if (installmentsStr) data.installments = JSON.parse(installmentsStr);

      // Expenses
      const expensesStr = localStorage.getItem('expenses');
      if (expensesStr) data.expenses = JSON.parse(expensesStr);

      // Contracts
      const contractsStr = localStorage.getItem('contracts');
      if (contractsStr) data.contracts = JSON.parse(contractsStr);

      // Users
      const usersStr = localStorage.getItem('app_users');
      if (usersStr) data.users = JSON.parse(usersStr);

      // Settings
      const settingsKeys = ['schoolInfo', 'paymentTemplates', 'smsSettings', 'emailSettings', 'whatsappSettings'];
      settingsKeys.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) data.settings[key] = JSON.parse(val);
      });

      // Academic Years
      const academicStr = localStorage.getItem('academicYears');
      if (academicStr) data.academicYears = JSON.parse(academicStr);
    } catch (error) {
      console.error('Veri okuma hatası:', error);
    }

    return data;
  };

  // Checksum hesapla
  const calculateChecksum = (data: any): string => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  // Yedekleme oluştur
  const createBackup = async () => {
    setIsBackingUp(true);
    
    try {
      const data = getAllData();
      const backup: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data,
        checksum: calculateChecksum(data),
      };

      // JSON dosyası oluştur ve indir
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `akademihub-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Son yedekleme zamanını kaydet
      const backupTime = new Date().toISOString();
      localStorage.setItem('lastBackupTime', backupTime);
      setLastBackup(backupTime);

      toast.success('Yedekleme başarıyla oluşturuldu!');
    } catch (error: any) {
      toast.error('Yedekleme oluşturulamadı: ' + error.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Dosya seç
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup: BackupData = JSON.parse(content);

        // Validasyon
        if (!backup.version || !backup.timestamp || !backup.data || !backup.checksum) {
          toast.error('Geçersiz yedekleme dosyası');
          return;
        }

        // Checksum kontrolü
        const calculatedChecksum = calculateChecksum(backup.data);
        if (calculatedChecksum !== backup.checksum) {
          toast.error('Yedekleme dosyası bozulmuş olabilir (checksum uyuşmuyor)');
          return;
        }

        setPendingRestoreData(backup);
        setShowConfirmRestore(true);
      } catch (error) {
        toast.error('Dosya okunamadı. Geçerli bir JSON dosyası olduğundan emin olun.');
      }
    };
    reader.readAsText(file);
    
    // Input'u sıfırla
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Geri yükleme uygula
  const applyRestore = async () => {
    if (!pendingRestoreData) return;
    
    setIsRestoring(true);
    
    try {
      const { data } = pendingRestoreData;

      // Tüm verileri localStorage'a yaz
      if (data.students?.length) localStorage.setItem('students', JSON.stringify(data.students));
      if (data.installments?.length) localStorage.setItem('installments', JSON.stringify(data.installments));
      if (data.expenses?.length) localStorage.setItem('expenses', JSON.stringify(data.expenses));
      if (data.contracts?.length) localStorage.setItem('contracts', JSON.stringify(data.contracts));
      if (data.users?.length) localStorage.setItem('app_users', JSON.stringify(data.users));
      if (data.academicYears?.length) localStorage.setItem('academicYears', JSON.stringify(data.academicYears));
      
      // Settings
      if (data.settings) {
        Object.entries(data.settings).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
      }

      toast.success('Veriler başarıyla geri yüklendi! Sayfa yenileniyor...');
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      toast.error('Geri yükleme başarısız: ' + error.message);
    } finally {
      setIsRestoring(false);
      setShowConfirmRestore(false);
      setPendingRestoreData(null);
    }
  };

  // Tüm verileri temizle
  const clearAllData = () => {
    if (!confirm('TÜM VERİLER SİLİNECEK! Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
      return;
    }
    
    const keysToRemove = [
      'students', 'installments', 'expenses', 'contracts', 
      'app_users', 'academicYears', 'schoolInfo', 'paymentTemplates',
      'smsSettings', 'emailSettings', 'whatsappSettings'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    toast.success('Tüm veriler temizlendi. Sayfa yenileniyor...');
    setTimeout(() => window.location.reload(), 1500);
  };

  // Son yedekleme zamanını yükle
  React.useEffect(() => {
    const last = localStorage.getItem('lastBackupTime');
    if (last) setLastBackup(last);
  }, []);

  // Veri istatistikleri
  const stats = React.useMemo(() => {
    const data = getAllData();
    return {
      students: data.students.length,
      installments: data.installments.length,
      expenses: data.expenses.length,
      contracts: data.contracts.length,
      users: data.users.length,
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Yedekleme & Geri Yükleme</h2>
          <p className="text-sm text-slate-500">Verilerinizi yedekleyin veya önceki yedeği geri yükleyin</p>
        </div>
      </div>

      {/* Veri İstatistikleri */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <HardDrive size={16} />
          Mevcut Veri Özeti
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.students}</p>
            <p className="text-xs text-slate-500">Öğrenci</p>
          </div>
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.installments}</p>
            <p className="text-xs text-slate-500">Taksit</p>
          </div>
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.expenses}</p>
            <p className="text-xs text-slate-500">Gider</p>
          </div>
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.contracts}</p>
            <p className="text-xs text-slate-500">Sözleşme</p>
          </div>
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.users}</p>
            <p className="text-xs text-slate-500">Kullanıcı</p>
          </div>
        </div>
      </div>

      {/* Son Yedekleme */}
      {lastBackup && (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <Check className="w-4 h-4 text-green-600" />
          <span>Son yedekleme: {new Date(lastBackup).toLocaleString('tr-TR')}</span>
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Yedekle */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Yedekle</h3>
              <p className="text-xs text-slate-500">Tüm verileri JSON olarak indir</p>
            </div>
          </div>
          <button
            onClick={createBackup}
            disabled={isBackingUp}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Yedekleniyor...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Yedek Oluştur
              </>
            )}
          </button>
        </div>

        {/* Geri Yükle */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Geri Yükle</h3>
              <p className="text-xs text-slate-500">Yedek dosyasından verileri yükle</p>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
          >
            <FileJson className="w-4 h-4" />
            Dosya Seç
          </button>
        </div>
      </div>

      {/* Tehlikeli Bölge */}
      <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-400">Tehlikeli Bölge</h3>
            <p className="text-xs text-red-600/70">Bu işlemler geri alınamaz</p>
          </div>
        </div>
        <button
          onClick={clearAllData}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
        >
          <Trash2 className="w-4 h-4" />
          Tüm Verileri Sil
        </button>
      </div>

      {/* Geri Yükleme Onay Modalı */}
      {showConfirmRestore && pendingRestoreData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmRestore(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Geri Yükleme Onayı</h3>
                <p className="text-sm text-slate-500">Mevcut veriler değiştirilecek</p>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4 text-sm">
              <p className="mb-2"><strong>Yedek Tarihi:</strong> {new Date(pendingRestoreData.timestamp).toLocaleString('tr-TR')}</p>
              <p className="mb-2"><strong>Versiyon:</strong> {pendingRestoreData.version}</p>
              <p><strong>İçerik:</strong></p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1">
                <li>{pendingRestoreData.data.students?.length || 0} öğrenci</li>
                <li>{pendingRestoreData.data.installments?.length || 0} taksit</li>
                <li>{pendingRestoreData.data.expenses?.length || 0} gider</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmRestore(false);
                  setPendingRestoreData(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                İptal
              </button>
              <button
                onClick={applyRestore}
                disabled={isRestoring}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  'Geri Yükle'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

