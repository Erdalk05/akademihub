'use client';

import { useState } from 'react';
import { X, CreditCard, Loader } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  studentName?: string;
  amount?: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  studentName = 'Öğrenci',
  amount = 0
}: PaymentModalProps) {
  const [formData, setFormData] = useState({
    cardHolder: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    paymentMethod: 'krediKarti'
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '').slice(0, 4);
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }
    }
    if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setFormData({
        cardHolder: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        paymentMethod: 'krediKarti'
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">💳 Ödeme Yap</h2>
            <p className="text-sm text-gray-600 mt-1">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Display */}
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Tutar:</span>
            <span className="text-2xl font-bold text-blue-600">₺{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="krediKarti">💳 Kredi Kartı</option>
              <option value="bankaTransferi">🏦 Banka Transferi</option>
              <option value="eft">📱 EFT</option>
              <option value="nakit">💵 Nakit Ödeme</option>
              <option value="manuel">✍️ Manuel Ödeme Kaydı</option>
            </select>
          </div>

          {/* Card Holder Name */}
          {formData.paymentMethod === 'krediKarti' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kart Sahibinin Adı</label>
                <input
                  type="text"
                  name="cardHolder"
                  value={formData.cardHolder}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                  placeholder="ADIM SOYADIM"
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kart Numarası</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  maxLength={19}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                  placeholder="0000 0000 0000 0000"
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Son Kullanma</label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    maxLength={5}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
                    maxLength={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                    placeholder="000"
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
                ✓ Tüm işlemler güvenli ve şifrelenmiştir.
              </div>
            </>
          )}

          {/* Manuel Ödeme */}
          {formData.paymentMethod === 'manuel' && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 mb-3">
                <strong>✍️ Manuel Ödeme Kaydı</strong><br/>
                Bu ödemeyi manuel olarak kaydedeceksiniz. Lütfen öğrenci adı, tutarı ve ödeme notunu doğru şekilde girin.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Notu</label>
                <textarea
                  placeholder="Örn: Nakit ödeme - El teslim (Tarih: 20.10.2025)"
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Banka Transferi */}
          {formData.paymentMethod === 'bankaTransferi' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">🏦 Banka Transferi Bilgileri:</p>
              <div className="text-xs text-blue-800 space-y-1">
                <p><strong>Hesap Adı:</strong> AkademiHub Eğitim A.Ş.</p>
                <p><strong>IBAN:</strong> TR95 0001 2009 7600 1234 5678</p>
                <p><strong>Banka:</strong> Türkiye İş Bankası</p>
                <p><strong>Referans:</strong> Öğrenci Adı - {studentName}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Ödeme Yap
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
