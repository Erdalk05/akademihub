'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Clock, 
  User, 
  MessageSquare,
  DollarSign,
  GraduationCap,
  AlertTriangle,
  Tag,
  RefreshCw,
  Send
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title?: string;
  content: string;
  category: string;
  created_by_name: string;
  created_at: string;
}

interface Props {
  student: any;
  onRefresh?: () => void;
}

// Kategori bilgileri
const CATEGORIES = [
  { value: 'general', label: 'Genel', icon: MessageSquare, color: 'bg-gray-500', bgLight: 'bg-gray-50', border: 'border-gray-200' },
  { value: 'payment', label: 'Ödeme', icon: DollarSign, color: 'bg-emerald-500', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
  { value: 'academic', label: 'Akademik', icon: GraduationCap, color: 'bg-blue-500', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'behavior', label: 'Davranış', icon: AlertTriangle, color: 'bg-amber-500', bgLight: 'bg-amber-50', border: 'border-amber-200' },
  { value: 'other', label: 'Diğer', icon: Tag, color: 'bg-purple-500', bgLight: 'bg-purple-50', border: 'border-purple-200' },
];

export default function StudentNotesTab({ student, onRefresh }: Props) {
  const { currentOrganization } = useOrganizationStore();
  const { user } = useAuthStore();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Yeni not formu
  const [newNote, setNewNote] = useState({
    content: '',
    category: 'general',
    title: ''
  });

  // Notları getir
  const fetchNotes = useCallback(async () => {
    if (!student?.id) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${student.id}/notes`);
      const data = await res.json();
      
      if (data.success) {
        setNotes(data.data || []);
      }
    } catch (error) {
      console.error('Notlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Not ekle
  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      toast.error('Not içeriği yazınız');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/students/${student.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newNote,
          organization_id: currentOrganization?.id,
          created_by_name: user?.name || 'Kullanıcı'
        })
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Not eklendi');
        setNewNote({ content: '', category: 'general', title: '' });
        fetchNotes();
      } else {
        toast.error(data.error || 'Not eklenemedi');
      }
    } catch (error) {
      toast.error('Not eklenemedi');
    } finally {
      setSaving(false);
    }
  };

  // Not sil
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/students/${student.id}/notes?note_id=${noteId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Not silindi');
        fetchNotes();
      } else {
        toast.error('Not silinemedi');
      }
    } catch (error) {
      toast.error('Not silinemedi');
    }
  };

  // Kategori bilgisi getir
  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Yeni Not Ekleme Formu */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Yeni Not Ekle
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Kategori Seçimi */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = newNote.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setNewNote({ ...newNote, category: cat.value })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${isSelected 
                        ? `${cat.color} text-white shadow-md` 
                        : `${cat.bgLight} ${cat.border} border text-gray-700 hover:shadow-sm`
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Başlık (Opsiyonel) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Başlık (Opsiyonel)</label>
            <input
              type="text"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              placeholder="Örn: Veli görüşmesi, Ödeme hatırlatması..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Not İçeriği */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Not İçeriği *</label>
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              placeholder="Notunuzu buraya yazın..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Ekle Butonu */}
          <div className="flex justify-end">
            <button
              onClick={handleAddNote}
              disabled={saving || !newNote.content.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Notu Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* Notlar Listesi */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Öğrenci Notları
            <span className="text-sm font-normal text-gray-500">({notes.length})</span>
          </h3>
          <button 
            onClick={fetchNotes}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Notlar yükleniyor...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Henüz not eklenmemiş</p>
            <p className="text-gray-400 text-sm">Yukarıdaki formu kullanarak not ekleyebilirsiniz</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notes.map((note) => {
              const catInfo = getCategoryInfo(note.category);
              const Icon = catInfo.icon;
              
              return (
                <div key={note.id} className={`p-4 ${catInfo.bgLight} hover:bg-opacity-70 transition`}>
                  <div className="flex items-start gap-3">
                    {/* Kategori Icon */}
                    <div className={`p-2 rounded-lg ${catInfo.color} text-white shadow-sm flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Not İçeriği */}
                    <div className="flex-1 min-w-0">
                      {note.title && (
                        <h4 className="font-semibold text-gray-900 mb-1">{note.title}</h4>
                      )}
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      
                      {/* Meta Bilgiler */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {note.created_by_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(note.created_at)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catInfo.bgLight} ${catInfo.border} border`}>
                          {catInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Sil Butonu */}
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                      title="Notu sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
