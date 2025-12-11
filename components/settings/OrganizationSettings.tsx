'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Save, X, 
  Check, AlertCircle, Users, MapPin, Phone, Mail, 
  Globe, FileText, Settings, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrganizationStore, Organization } from '@/lib/store/organizationStore';

interface NewOrganization {
  name: string;
  slug: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
}

const defaultNewOrg: NewOrganization = {
  name: '',
  slug: '',
  tax_id: '',
  address: '',
  phone: '',
  email: '',
  logo_url: '',
};

export default function OrganizationSettings() {
  const { organizations, currentOrganization, fetchOrganizations, setCurrentOrganization } = useOrganizationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [newOrg, setNewOrg] = useState<NewOrganization>(defaultNewOrg);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setIsLoading(true);
    await fetchOrganizations();
    setIsLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAddOrganization = async () => {
    if (!newOrg.name.trim()) {
      toast.error('Kurum adı zorunludur');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOrg,
          slug: newOrg.slug || generateSlug(newOrg.name),
          is_active: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Kurum başarıyla eklendi!');
        setShowAddModal(false);
        setNewOrg(defaultNewOrg);
        await loadOrganizations();
      } else {
        toast.error(data.error || 'Kurum eklenirken hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOrganization = async () => {
    if (!editingOrg) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${editingOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOrg),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Kurum güncellendi!');
        setEditingOrg(null);
        await loadOrganizations();
        
        // Eğer aktif kurum güncellendiyse store'u da güncelle
        if (currentOrganization?.id === editingOrg.id) {
          setCurrentOrganization(data.data);
        }
      } else {
        toast.error(data.error || 'Güncellenirken hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Bu kurumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Kurum silindi');
        await loadOrganizations();
      } else {
        toast.error(data.error || 'Silinirken hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
        <span className="ml-3 text-gray-600">Kurumlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Kurum Yönetimi</h2>
          <p className="text-sm text-gray-500">Çoklu kurum/şube yapısını yönetin</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white rounded-xl hover:opacity-90 transition shadow-lg"
        >
          <Plus size={18} />
          Yeni Kurum Ekle
        </button>
      </div>

      {/* Kurum Listesi */}
      <div className="grid gap-4">
        {organizations.map((org) => (
          <div
            key={org.id}
            className={`bg-white border-2 rounded-2xl p-5 transition-all ${
              currentOrganization?.id === org.id 
                ? 'border-[#25D366] shadow-lg shadow-[#25D366]/20' 
                : 'border-gray-100 hover:border-[#25D366]/30'
            }`}
          >
            <div className="flex items-start justify-between">
              {/* Sol: Kurum Bilgileri */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#075E54] to-[#25D366] rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {org.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-lg">{org.name}</h3>
                    {currentOrganization?.id === org.id && (
                      <span className="px-2 py-0.5 bg-[#25D366] text-white text-xs rounded-full font-medium">
                        Aktif
                      </span>
                    )}
                    {org.is_demo && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-medium">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-mono">/{org.slug}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                    {org.address && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {org.address.substring(0, 30)}...
                      </span>
                    )}
                    {org.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={14} className="text-gray-400" />
                        {org.phone}
                      </span>
                    )}
                    {org.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {org.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ: Aksiyonlar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingOrg(org)}
                  className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition"
                  title="Düzenle"
                >
                  <Edit2 size={18} />
                </button>
                {organizations.length > 1 && (
                  <button
                    onClick={() => handleDeleteOrganization(org.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kurum Ekleme Modali */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#075E54] to-[#25D366] rounded-xl flex items-center justify-center">
                    <Building2 className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Yeni Kurum Ekle</h3>
                </div>
                <button 
                  onClick={() => { setShowAddModal(false); setNewOrg(defaultNewOrg); }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Kurum Adı */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Kurum Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="Örn: Dikmen Çözüm Kurs"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#25D366] outline-none transition"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  URL Kodu (Slug)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">/</span>
                  <input
                    type="text"
                    value={newOrg.slug || generateSlug(newOrg.name)}
                    onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="dikmen-cozum-kurs"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#25D366] outline-none transition font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Sadece küçük harf, rakam ve tire (-) kullanılabilir</p>
              </div>

              {/* 2'li grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vergi No</label>
                  <input
                    type="text"
                    value={newOrg.tax_id}
                    onChange={(e) => setNewOrg({ ...newOrg, tax_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#25D366] outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={newOrg.phone}
                    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#25D366] outline-none transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={newOrg.email}
                  onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#25D366] outline-none transition"
                />
              </div>

              {/* Adres */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Adres</label>
                <textarea
                  value={newOrg.address}
                  onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#25D366] outline-none transition resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowAddModal(false); setNewOrg(defaultNewOrg); }}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                İptal
              </button>
              <button
                onClick={handleAddOrganization}
                disabled={isSaving || !newOrg.name.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-[#075E54] to-[#25D366] text-white rounded-xl hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Kurum Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kurum Düzenleme Modali */}
      {editingOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Edit2 className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Kurumu Düzenle</h3>
                </div>
                <button 
                  onClick={() => setEditingOrg(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Kurum Adı */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kurum Adı *</label>
                <input
                  type="text"
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Slug (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">URL Kodu</label>
                <input
                  type="text"
                  value={editingOrg.slug}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">URL kodu değiştirilemez</p>
              </div>

              {/* 2'li grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vergi No</label>
                  <input
                    type="text"
                    value={editingOrg.tax_id || ''}
                    onChange={(e) => setEditingOrg({ ...editingOrg, tax_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={editingOrg.phone || ''}
                    onChange={(e) => setEditingOrg({ ...editingOrg, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={editingOrg.email || ''}
                  onChange={(e) => setEditingOrg({ ...editingOrg, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Adres */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Adres</label>
                <textarea
                  value={editingOrg.address || ''}
                  onChange={(e) => setEditingOrg({ ...editingOrg, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingOrg(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                İptal
              </button>
              <button
                onClick={handleUpdateOrganization}
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bilgi Kartı */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="text-blue-600" size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Çoklu Kurum Yapısı</h4>
            <p className="text-sm text-blue-700">
              Her kurum kendi öğrenci, finans ve raporlama verilerine sahip olacaktır. 
              Üst menüden kurumlar arasında geçiş yapabilirsiniz. 
              Yeni kurum eklendiğinde otomatik olarak ayrı bir veri alanı oluşturulur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




