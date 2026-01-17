'use client';

// ============================================================================
// ANSWER KEY LIBRARY
// Cevap Anahtarı Kütüphanesi - Kaydet / Yükle / Sil
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Library, Save, Download, Trash2, Loader2, FolderOpen, Plus, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AnswerKeyItem, ExamType } from '@/lib/spectra/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AnswerKeyTemplate {
  id: string;
  name: string;
  total_questions: number;
  answer_data: AnswerKeyItem[];
  created_at: string;
}

interface AnswerKeyLibraryProps {
  organizationId: string;
  examType: ExamType;
  currentAnswerKey: AnswerKeyItem[];
  totalQuestions: number;
  onLoad: (answerKey: AnswerKeyItem[]) => void;
}

export function AnswerKeyLibrary({
  organizationId,
  examType,
  currentAnswerKey,
  totalQuestions,
  onLoad,
}: AnswerKeyLibraryProps) {
  const [templates, setTemplates] = useState<AnswerKeyTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);

  const supabase = createClient();

  // Şablonları yükle
  const loadTemplates = useCallback(async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('answer_key_templates')
        .select('id, name, total_questions, answer_data, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Şablonlar yüklenemedi:', err);
      toast.error('Şablonlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, supabase]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Şablon yükle
  const handleLoad = async () => {
    if (!selectedTemplateId) {
      toast.error('Lütfen bir şablon seçin');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    if (template.answer_data && Array.isArray(template.answer_data)) {
      onLoad(template.answer_data);
      toast.success(`"${template.name}" yüklendi`);
    } else {
      toast.error('Şablon verisi geçersiz');
    }
  };

  // Şablon kaydet
  const handleSave = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Şablon adı giriniz');
      return;
    }

    const filledCount = currentAnswerKey.filter(k => k.correct_answer !== null).length;
    if (filledCount === 0) {
      toast.error('Kaydedilecek cevap yok');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('answer_key_templates')
        .insert({
          organization_id: organizationId,
          name: newTemplateName.trim(),
          exam_type: examType,
          total_questions: totalQuestions,
          answer_data: currentAnswerKey,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Bu isimde bir şablon zaten var');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Şablon kaydedildi');
      setNewTemplateName('');
      setShowSaveInput(false);
      loadTemplates();
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      toast.error('Şablon kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  // Şablon sil
  const handleDelete = async () => {
    if (!selectedTemplateId) {
      toast.error('Lütfen silinecek şablonu seçin');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    if (!window.confirm(`"${template.name}" şablonunu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('answer_key_templates')
        .delete()
        .eq('id', selectedTemplateId);

      if (error) throw error;

      toast.success('Şablon silindi');
      setSelectedTemplateId('');
      loadTemplates();
    } catch (err) {
      console.error('Silme hatası:', err);
      toast.error('Şablon silinemedi');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const filledCount = currentAnswerKey.filter(k => k.correct_answer !== null).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Cevap Anahtarı Kütüphanesi</h3>
        </div>
        <span className="text-xs text-gray-500">
          {templates.length} kayıtlı şablon
        </span>
      </div>

      {/* Select + Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Template Select */}
        <div className="flex-1">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={isLoading}
          >
            <option value="">Kayıtlı şablon seçin...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.total_questions} soru)
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Yükle */}
          <button
            onClick={handleLoad}
            disabled={!selectedTemplateId || isLoading}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all',
              selectedTemplateId
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Download className="w-4 h-4" />
            Yükle
          </button>

          {/* Kaydet Toggle */}
          {!showSaveInput ? (
            <button
              onClick={() => setShowSaveInput(true)}
              disabled={filledCount === 0}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all',
                filledCount > 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <Plus className="w-4 h-4" />
              Kaydet
            </button>
          ) : null}

          {/* Sil */}
          <button
            onClick={handleDelete}
            disabled={!selectedTemplateId || isDeleting}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all',
              selectedTemplateId
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Sil
          </button>
        </div>
      </div>

      {/* Save Input Row */}
      {showSaveInput && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <input
            type="text"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Şablon adı (örn: ÖZDEBİR LGS DENEME 1)"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setShowSaveInput(false);
            }}
          />
          <button
            onClick={handleSave}
            disabled={isSaving || !newTemplateName.trim()}
            className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 transition-all"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => {
              setShowSaveInput(false);
              setNewTemplateName('');
            }}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Info */}
      {selectedTemplate && (
        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
          <strong>Seçili:</strong> {selectedTemplate.name} • {selectedTemplate.total_questions} soru • {new Date(selectedTemplate.created_at).toLocaleDateString('tr-TR')}
        </div>
      )}
    </div>
  );
}
