'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Search, User, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchItem {
  id: string;
  title: string;
  category: string;
  icon?: string;
  url?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: SearchItem[];
  onSelect?: (item: SearchItem) => void;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_no?: string;
  class?: string;
  phone?: string;
}

export default function SearchModal({
  isOpen,
  onClose,
  items,
  onSelect
}: SearchModalProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'students'>('all');

  // Fetch students when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      // Show quick actions when no search
      const quickActions: SearchItem[] = [
        { id: 'add-student', title: 'Yeni Öğrenci Ekle', category: 'İşlem', icon: '➕', url: '/registration' },
        { id: 'students', title: 'Tüm Öğrenciler', category: 'Sayfa', icon: '👥', url: '/students' },
        { id: 'finance', title: 'Finans', category: 'Sayfa', icon: '💰', url: '/finance' },
        { id: 'reports', title: 'Raporlar', category: 'Sayfa', icon: '📊', url: '/finance/reports' },
      ];
      return quickActions;
    }
    
    const term = searchTerm.toLowerCase();
    const results: SearchItem[] = [];

    // Search in students
    students
      .filter(student => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        const studentNo = student.student_no?.toLowerCase() || '';
        const phone = student.phone?.toLowerCase() || '';
        return fullName.includes(term) || studentNo.includes(term) || phone.includes(term);
      })
      .slice(0, 5)
      .forEach(student => {
        results.push({
          id: `student-${student.id}`,
          title: `${student.first_name} ${student.last_name}`,
          category: `${student.class || 'Sınıf yok'} - ${student.student_no || 'No yok'}`,
          icon: '👤',
          url: `/students/${student.id}`
        });
      });

    // Search in provided items
    if (items) {
      items
        .filter(item => 
          item.title.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term)
        )
        .forEach(item => results.push(item));
    }

    return results;
  }, [searchTerm, students, items]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchItem) => {
    if (item.url) {
      router.push(item.url);
    }
    if (onSelect) {
      onSelect(item);
    }
    setSearchTerm('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-96 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Öğrenci adı, numarası veya telefon ara..."
            autoFocus
            className="flex-1 bg-transparent outline-none text-gray-900 text-lg placeholder-gray-400"
          />
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-gray-500">Öğrenciler yükleniyor...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-3 hover:bg-blue-50 transition-colors text-left flex items-center gap-3 group"
                >
                  <span className="text-2xl">{item.icon || '📌'}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-blue-600">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </div>
                  <span className="text-gray-300 group-hover:text-gray-400 text-lg">→</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>&quot;{searchTerm}&quot; için sonuç bulunamadı</p>
              <p className="text-sm mt-2">Başka bir terim deneyin</p>
            </div>
          )}
        </div>

        {/* Footer Hints */}
        {searchTerm === '' && !isLoading && (
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 text-xs text-gray-500 flex justify-between">
            <div>💡 İpucu: Öğrenci adı, numarası veya telefon ile arayabilirsiniz</div>
            <div>ESC - Kapat</div>
          </div>
        )}
      </div>
    </div>
  );
}
