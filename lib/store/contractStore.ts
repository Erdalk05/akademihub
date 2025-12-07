/**
 * 📋 CONTRACT STORE - Zustand
 * Sözleşme state management
 * AI Features: Auto-draft, Smart suggestions, Real-time validation
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Contract, ContractTemplate, ContractFormData, AIContractAnalysis, AIContractSuggestions, ContractValidationResult } from '@/types/contract.types';

interface ContractStore {
  // ==================== STATE ====================
  contracts: Contract[];
  templates: ContractTemplate[];
  currentContract: Contract | null;
  selectedTemplate: ContractTemplate | null;
  draftFormData: Partial<ContractFormData>;
  loading: boolean;
  error: string | null;

  // ==================== AI STATE ====================
  aiAnalysis: AIContractAnalysis | null;
  aiSuggestions: AIContractSuggestions | null;
  validationErrors: ContractValidationResult | null;

  // ==================== ACTIONS ====================
  
  // Contract CRUD
  createContract: (data: Partial<Contract>) => Promise<Contract>;
  updateContract: (id: string, data: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  fetchContracts: () => Promise<Contract[]>;
  fetchContractById: (id: string) => Promise<Contract | null>;

  // Template Management
  fetchTemplates: () => Promise<ContractTemplate[]>;
  selectTemplate: (template: ContractTemplate) => void;
  createTemplate: (template: Partial<ContractTemplate>) => void;

  // Draft Management
  saveDraftFormData: (data: Partial<ContractFormData>) => void;
  clearDraft: () => void;
  getDraft: () => Partial<ContractFormData>;

  // AI Features
  analyzeContract: (contractId: string) => Promise<AIContractAnalysis>;
  getAISuggestions: (ogrenciId: string) => Promise<AIContractSuggestions>;
  validateContract: (contract: Partial<Contract>) => ContractValidationResult;

  // Status Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useContractStore = create<ContractStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ==================== INITIAL STATE ====================
        contracts: [],
        templates: [],
        currentContract: null,
        selectedTemplate: null,
        draftFormData: {},
        loading: false,
        error: null,
        aiAnalysis: null,
        aiSuggestions: null,
        validationErrors: null,

        // ==================== CONTRACT CRUD ====================

        /**
         * 🆕 Yeni sözleşme oluştur
         * AI: Öğrenci profiline göre otomatik suggests
         */
        createContract: async (data: Partial<Contract>) => {
          set({ loading: true });
          try {
            // Mock API call - Replace with real API
            const newContract: Contract = {
              id: `SOZ-${Date.now()}`,
              contractNo: `SOZ-2025-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
              sablon: 'Standart',
              durum: 'Taslak',
              olusturmaTarihi: new Date(),
              sonGuncellemeTarihi: new Date(),
              ...data,
              ogrenci: data.ogrenci || { id: '', ad: '', soyad: '', tcKimlik: '', dogumTarihi: new Date(), sinif: '', program: '' },
              veli: data.veli || { ad: '', soyad: '', tcKimlik: '', adres: '', ilce: '', il: '', telefon: '', email: '' },
              okul: data.okul || { ad: '', vergiNo: '', adres: '', ilce: '', il: '', telefon: '', email: '', yetkili: { ad: '', soyad: '', gorev: '' } },
              finans: data.finans || { brutUcret: 0, indirimler: [], toplamIndirim: 0, netUcret: 0, kayitBedeli: { tutar: 0 }, kalanTutar: 0, taksitPlani: [] },
              maddeler: data.maddeler || [],
              indirimSartlari: data.indirimSartlari || { aciklama: '', gecerlilikKosullari: [], iptalDurumlari: [] },
              kvkk: data.kvkk || { metni: '', onaylandi: false },
              acikRiza: data.acikRiza || { metni: '', onaylandi: false },
              imzalar: data.imzalar || {
                veli: { ad: '', soyad: '', onayDurumu: 'Beklemede' },
                yetkili: { ad: '', soyad: '', gorev: '', onayDurumu: 'Beklemede' },
              },
              ekler: data.ekler || [],
              pdf: data.pdf || {},
              tarihler: data.tarihler || {
                olusturma: new Date(),
                sonGuncelleme: new Date(),
                gecerlilikBaslangic: new Date(),
                gecerlilikBitis: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              },
              olusturan: 'user-id',
              durum_Gecmisi: [{ durum: 'Taslak', tarih: new Date(), yapan: 'user-id' }],
            } as Contract;

            set((state) => ({
              contracts: [...state.contracts, newContract],
              currentContract: newContract,
              loading: false,
            }));

            return newContract;
          } catch (error) {
            set({ error: 'Sözleşme oluşturma hatası', loading: false });
            throw error;
          }
        },

        /**
         * ✏️ Sözleşmeyi güncelle
         */
        updateContract: (id: string, data: Partial<Contract>) => {
          set((state) => ({
            contracts: state.contracts.map((c) =>
              c.id === id
                ? {
                    ...c,
                    ...data,
                    sonGuncellemeTarihi: new Date(),
                    durum_Gecmisi: [
                      ...c.durum_Gecmisi,
                      {
                        durum: data.durum || c.durum,
                        tarih: new Date(),
                        yapan: 'user-id',
                        neden: data.notlar,
                      },
                    ],
                  }
                : c
            ),
            currentContract: state.currentContract?.id === id ? { ...state.currentContract, ...data, sonGuncellemeTarihi: new Date() } : state.currentContract,
          }));
        },

        /**
         * 🗑️ Sözleşmeyi sil
         */
        deleteContract: (id: string) => {
          set((state) => ({
            contracts: state.contracts.filter((c) => c.id !== id),
            currentContract: state.currentContract?.id === id ? null : state.currentContract,
          }));
        },

        /**
         * 📥 Sözleşmeleri fetch et
         */
        fetchContracts: async () => {
          set({ loading: true });
          try {
            // Mock data - Replace with real API
            const mockContracts: Contract[] = [];
            set({ contracts: mockContracts, loading: false });
            return mockContracts;
          } catch (error) {
            set({ error: 'Sözleşmeler yüklenemedi', loading: false });
            return [];
          }
        },

        /**
         * 🔍 Belirtilen ID'li sözleşmeyi getir
         */
        fetchContractById: async (id: string) => {
          set({ loading: true });
          try {
            const contract = get().contracts.find((c) => c.id === id) || null;
            set({ currentContract: contract, loading: false });
            return contract;
          } catch (error) {
            set({ error: 'Sözleşme yüklenemedi', loading: false });
            return null;
          }
        },

        // ==================== TEMPLATE MANAGEMENT ====================

        /**
         * 📋 Şablonları fetch et
         */
        fetchTemplates: async () => {
          set({ loading: true });
          try {
            // Mock templates
            const mockTemplates: ContractTemplate[] = [
              {
                id: 'tmpl-1',
                ad: 'Standart Kayıt Sözleşmesi',
                tip: 'Standart',
                versiyon: 1,
                aktif: true,
                icerik: {
                  baslik: 'Eğitim-Öğretim Hizmet Sözleşmesi',
                  giris: 'İşbu sözleşme {{OGRENCI_ADI}} isimli öğrencinin {{OKUL_ADI}} bünyesinde eğitim görmesi konusundaki şartları belirler.',
                  maddeler: [
                    {
                      no: 1,
                      baslik: 'Sözleşmenin Konusu',
                      icerik: 'Eğitim hizmetinin sağlanması',
                      zorunlu: true,
                      duzenlenebilir: false,
                      kategori: 'Genel',
                    },
                  ],
                  sonuc: 'Taraflar işbu sözleşmeyi kabul etmektedir.',
                },
                degiskenler: {
                  kisisel: ['{{OGRENCI_ADI}}', '{{OGRENCI_TC}}', '{{OGRENCI_SINIF}}'],
                  finansal: ['{{NET_UCRET}}', '{{TAKSIT_SAYISI}}', '{{ILKTAKSIT_TUTARI}}'],
                  okul: ['{{OKUL_ADI}}', '{{OKUL_TELEFON}}'],
                  veli: ['{{VELI_ADI}}', '{{VELI_TELEFON}}'],
                },
                kvkkMetni: 'KVKK aydınlatma metni...',
                acikRizaMetni: 'Açık rıza metni...',
                aiOzellikleri: {
                  dinamikMaddeler: true,
                  akıllıIndirmi: true,
                  kisiselestirme: true,
                  otomatikSozlesmeSuggestion: true,
                },
                doküman: {},
                olusturan: 'admin',
                olusturmaTarihi: new Date(),
                sonGuncellemeTarihi: new Date(),
                kullanimSayisi: 0,
              },
            ];

            set({ templates: mockTemplates, loading: false });
            return mockTemplates;
          } catch (error) {
            set({ error: 'Şablonlar yüklenemedi', loading: false });
            return [];
          }
        },

        /**
         * 📌 Şablon seç
         */
        selectTemplate: (template: ContractTemplate) => {
          set({ selectedTemplate: template });
        },

        /**
         * ➕ Yeni şablon oluştur
         */
        createTemplate: (template: Partial<ContractTemplate>) => {
          const newTemplate: ContractTemplate = {
            id: `tmpl-${Date.now()}`,
            ad: template.ad || 'Yeni Şablon',
            tip: template.tip || 'Standart',
            versiyon: 1,
            aktif: true,
            icerik: template.icerik || { baslik: '', giris: '', maddeler: [], sonuc: '' },
            degiskenler: template.degiskenler || { kisisel: [], finansal: [], okul: [], veli: [] },
            kvkkMetni: template.kvkkMetni || '',
            acikRizaMetni: template.acikRizaMetni || '',
            doküman: {},
            olusturan: 'user-id',
            olusturmaTarihi: new Date(),
            sonGuncellemeTarihi: new Date(),
            kullanimSayisi: 0,
          } as ContractTemplate;

          set((state) => ({
            templates: [...state.templates, newTemplate],
          }));
        },

        // ==================== DRAFT MANAGEMENT ====================

        /**
         * 💾 Draft form datası kaydet
         */
        saveDraftFormData: (data: Partial<ContractFormData>) => {
          set((state) => ({
            draftFormData: { ...state.draftFormData, ...data },
          }));
        },

        /**
         * 🧹 Draft'ı temizle
         */
        clearDraft: () => {
          set({ draftFormData: {} });
        },

        /**
         * 📄 Draft'ı getir
         */
        getDraft: () => {
          return get().draftFormData;
        },

        // ==================== AI FEATURES ====================

        /**
         * 🤖 Sözleşmeyi analiz et (AI)
         * - Risk skoru hesapla
         * - Anomali tespiti
         * - Benzer sözleşmeleri bul
         */
        analyzeContract: async (contractId: string) => {
          set({ loading: true });
          try {
            // Mock AI analysis
            const analysis: AIContractAnalysis = {
              riskSkoru: Math.floor(Math.random() * 50) + 10,
              anormalities: {
                bulundu: false,
                listesi: [],
              },
              recommendations: [
                'Taksit sayısı arttırılabilir',
                'Önceki öğrenci profili ile benzerdir',
              ],
              autoFillPercentage: 85,
              estimatedSigningTime: 8,
              similarContracts: [],
            };

            set({ aiAnalysis: analysis, loading: false });
            return analysis;
          } catch (error) {
            set({ error: 'AI analiz hatası', loading: false });
            throw error;
          }
        },

        /**
         * 💡 AI önerileri al
         * - Uygun şablon önerisi
         * - İndirim önerisi
         * - Taksit planı önerisi
         */
        getAISuggestions: async (ogrenciId: string) => {
          set({ loading: true });
          try {
            // Mock AI suggestions
            const suggestions: AIContractSuggestions = {
              tavsiye_edilen_sablonlar: [
                {
                  templateId: 'tmpl-1',
                  adi: 'Standart Sözleşme',
                  uygunlukOrani: 95,
                  neden: ['Önceki öğrenci profiline benzer', 'Aynı sınıf seviyesi'],
                },
              ],
              onerilen_indirimler: [
                {
                  tip: 'Erken Kayıt',
                  tutar: 5000,
                  neden: 'Kaydın erken yapılması',
                },
              ],
              onerilen_taksit_plani: {
                taksitSayisi: 8,
                ilkTaksitTarihi: new Date(),
                taksitTutari: 12750,
                faydalar: ['Uygun ödeme planı', 'Velinin ödeme gücüne uygun'],
              },
            };

            set({ aiSuggestions: suggestions, loading: false });
            return suggestions;
          } catch (error) {
            set({ error: 'AI önerileri alınamadı', loading: false });
            throw error;
          }
        },

        /**
         * ✔️ Sözleşmeyi valide et
         * - Gerekli alanlar kontrol
         * - Format kontrol
         * - İş kuralları kontrol
         */
        validateContract: (contract: Partial<Contract>) => {
          const errors: Array<{ alan: string; mesaj: string; onem: 'Kritik' | 'Uyarı' | 'Bilgi' }> = [];
          const uyarilar: string[] = [];

          // Kritik kontroller
          if (!contract.ogrenci?.ad) errors.push({ alan: 'Öğrenci', mesaj: 'Öğrenci adı zorunludur', onem: 'Kritik' });
          if (!contract.veli?.email) errors.push({ alan: 'Veli', mesaj: 'Veli email zorunludur', onem: 'Kritik' });
          if (!contract.finans?.netUcret || contract.finans.netUcret <= 0) {
            errors.push({ alan: 'Finans', mesaj: 'Geçerli ücret girilmelidir', onem: 'Kritik' });
          }
          if (!contract.kvkk?.onaylandi) errors.push({ alan: 'KVKK', mesaj: 'KVKK onayı zorunludur', onem: 'Kritik' });

          // Uyarılar
          if (!contract.ogrenci?.tcKimlik) uyarilar.push('TC Kimlik numarası girilmemiştir');
          if (!contract.maddeler || contract.maddeler.length === 0) uyarilar.push('Sözleşme maddeleri eklenmemiştir');

          const result: ContractValidationResult = {
            isValid: errors.length === 0,
            errors,
            uyarilar,
          };

          set({ validationErrors: result });
          return result;
        },

        // ==================== STATUS MANAGEMENT ====================

        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'contract-store',
        partialize: (state) => ({
          draftFormData: state.draftFormData,
          contracts: state.contracts,
          templates: state.templates,
        }),
      }
    )
  )
);

export default useContractStore;
