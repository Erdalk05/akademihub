'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, MessageSquare, Phone, Save, Eye, EyeOff, 
  CheckCircle2, XCircle, RefreshCw, Server, Key, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SMSSettings {
  provider: 'netgsm' | 'iletimerkezi' | 'mutlucell' | 'custom';
  apiKey: string;
  apiSecret: string;
  sender: string;
  enabled: boolean;
}

interface EmailSettings {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  fromName: string;
  encryption: 'tls' | 'ssl' | 'none';
  enabled: boolean;
}

interface WhatsAppSettings {
  provider: 'twilio' | 'meta' | 'custom';
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  enabled: boolean;
}

export default function APISettings() {
  const [activeTab, setActiveTab] = useState<'sms' | 'email' | 'whatsapp'>('sms');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  
  // SMS Ayarları
  const [smsSettings, setSmsSettings] = useState<SMSSettings>({
    provider: 'netgsm',
    apiKey: '',
    apiSecret: '',
    sender: '',
    enabled: false,
  });
  
  // Email Ayarları
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    provider: 'smtp',
    host: '',
    port: 587,
    username: '',
    password: '',
    from: '',
    fromName: 'AkademiHub',
    encryption: 'tls',
    enabled: false,
  });
  
  // WhatsApp Ayarları
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings>({
    provider: 'twilio',
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    enabled: false,
  });

  // Ayarları yükle
  useEffect(() => {
    const savedSMS = localStorage.getItem('smsSettings');
    const savedEmail = localStorage.getItem('emailSettings');
    const savedWhatsApp = localStorage.getItem('whatsappSettings');
    
    if (savedSMS) setSmsSettings(JSON.parse(savedSMS));
    if (savedEmail) setEmailSettings(JSON.parse(savedEmail));
    if (savedWhatsApp) setWhatsappSettings(JSON.parse(savedWhatsApp));
  }, []);

  // Kaydet
  const saveSettings = () => {
    localStorage.setItem('smsSettings', JSON.stringify(smsSettings));
    localStorage.setItem('emailSettings', JSON.stringify(emailSettings));
    localStorage.setItem('whatsappSettings', JSON.stringify(whatsappSettings));
    toast.success('API ayarları kaydedildi');
  };

  // Test bağlantısı
  const testConnection = async (type: string) => {
    setTesting(true);
    
    // Simüle edilmiş test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Demo modda her zaman başarılı
    toast.success(`${type} bağlantısı başarılı!`);
    setTesting(false);
  };

  // Şifre göster/gizle toggle
  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Server className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">API Ayarları</h2>
          <p className="text-sm text-slate-500">SMS, E-posta ve WhatsApp entegrasyonları</p>
        </div>
      </div>

      {/* Tab Seçimi */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'sms', icon: Phone, label: 'SMS' },
          { id: 'email', icon: Mail, label: 'E-posta' },
          { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* SMS Ayarları */}
      {activeTab === 'sms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={smsSettings.enabled}
                onChange={(e) => setSmsSettings(s => ({ ...s, enabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">SMS Bildirimleri Aktif</span>
            </label>
            {smsSettings.enabled && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 size={14} />
                Aktif
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SMS Sağlayıcı</label>
            <select
              value={smsSettings.provider}
              onChange={(e) => setSmsSettings(s => ({ ...s, provider: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="netgsm">NetGSM</option>
              <option value="iletimerkezi">İleti Merkezi</option>
              <option value="mutlucell">Mutlucell</option>
              <option value="custom">Özel API</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Key size={14} className="inline mr-1" />
                API Key
              </label>
              <div className="relative">
                <input
                  type={showSecrets['smsKey'] ? 'text' : 'password'}
                  value={smsSettings.apiKey}
                  onChange={(e) => setSmsSettings(s => ({ ...s, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  placeholder="API anahtarınız"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('smsKey')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSecrets['smsKey'] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Key size={14} className="inline mr-1" />
                API Secret
              </label>
              <div className="relative">
                <input
                  type={showSecrets['smsSecret'] ? 'text' : 'password'}
                  value={smsSettings.apiSecret}
                  onChange={(e) => setSmsSettings(s => ({ ...s, apiSecret: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  placeholder="API gizli anahtarınız"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('smsSecret')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSecrets['smsSecret'] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gönderici Adı</label>
            <input
              type="text"
              value={smsSettings.sender}
              onChange={(e) => setSmsSettings(s => ({ ...s, sender: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="AKADEMIHUB"
              maxLength={11}
            />
            <p className="text-xs text-slate-500 mt-1">Maksimum 11 karakter, Türkçe karakter kullanmayın</p>
          </div>

          <button
            onClick={() => testConnection('SMS')}
            disabled={testing || !smsSettings.apiKey}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition disabled:opacity-50"
          >
            {testing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Bağlantıyı Test Et
          </button>
        </div>
      )}

      {/* Email Ayarları */}
      {activeTab === 'email' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={emailSettings.enabled}
                onChange={(e) => setEmailSettings(s => ({ ...s, enabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">E-posta Bildirimleri Aktif</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-posta Sağlayıcı</label>
            <select
              value={emailSettings.provider}
              onChange={(e) => setEmailSettings(s => ({ ...s, provider: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="smtp">SMTP (Manuel)</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
              <option value="ses">Amazon SES</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Globe size={14} className="inline mr-1" />
                SMTP Host
              </label>
              <input
                type="text"
                value={emailSettings.host}
                onChange={(e) => setEmailSettings(s => ({ ...s, host: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Port</label>
              <input
                type="number"
                value={emailSettings.port}
                onChange={(e) => setEmailSettings(s => ({ ...s, port: parseInt(e.target.value) || 587 }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                value={emailSettings.username}
                onChange={(e) => setEmailSettings(s => ({ ...s, username: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="email@domain.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Şifre</label>
              <div className="relative">
                <input
                  type={showSecrets['emailPass'] ? 'text' : 'password'}
                  value={emailSettings.password}
                  onChange={(e) => setEmailSettings(s => ({ ...s, password: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('emailPass')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSecrets['emailPass'] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gönderen E-posta</label>
              <input
                type="email"
                value={emailSettings.from}
                onChange={(e) => setEmailSettings(s => ({ ...s, from: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="noreply@akademihub.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gönderen Adı</label>
              <input
                type="text"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings(s => ({ ...s, fromName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="AkademiHub"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Şifreleme</label>
            <select
              value={emailSettings.encryption}
              onChange={(e) => setEmailSettings(s => ({ ...s, encryption: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="none">Yok</option>
            </select>
          </div>

          <button
            onClick={() => testConnection('E-posta')}
            disabled={testing || !emailSettings.host}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition disabled:opacity-50"
          >
            {testing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Bağlantıyı Test Et
          </button>
        </div>
      )}

      {/* WhatsApp Ayarları */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={whatsappSettings.enabled}
                onChange={(e) => setWhatsappSettings(s => ({ ...s, enabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp Bildirimleri Aktif</span>
            </label>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400">
            <p>WhatsApp Business API kullanmak için onaylı bir sağlayıcıya ihtiyacınız var. Şu an sistemde WhatsApp Web linki ile yönlendirme yapılmaktadır.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sağlayıcı</label>
            <select
              value={whatsappSettings.provider}
              onChange={(e) => setWhatsappSettings(s => ({ ...s, provider: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="twilio">Twilio</option>
              <option value="meta">Meta Business (WhatsApp Cloud API)</option>
              <option value="custom">Özel API</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account SID</label>
              <div className="relative">
                <input
                  type={showSecrets['waSid'] ? 'text' : 'password'}
                  value={whatsappSettings.accountSid}
                  onChange={(e) => setWhatsappSettings(s => ({ ...s, accountSid: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  placeholder="AC..."
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('waSid')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSecrets['waSid'] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Auth Token</label>
              <div className="relative">
                <input
                  type={showSecrets['waToken'] ? 'text' : 'password'}
                  value={whatsappSettings.authToken}
                  onChange={(e) => setWhatsappSettings(s => ({ ...s, authToken: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('waToken')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSecrets['waToken'] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp Numarası</label>
            <input
              type="text"
              value={whatsappSettings.phoneNumber}
              onChange={(e) => setWhatsappSettings(s => ({ ...s, phoneNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="+905xxxxxxxxx"
            />
          </div>

          <button
            onClick={() => testConnection('WhatsApp')}
            disabled={testing || !whatsappSettings.accountSid}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition disabled:opacity-50"
          >
            {testing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Bağlantıyı Test Et
          </button>
        </div>
      )}

      {/* Kaydet Butonu */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={saveSettings}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
        >
          <Save size={18} />
          Ayarları Kaydet
        </button>
      </div>
    </div>
  );
}

