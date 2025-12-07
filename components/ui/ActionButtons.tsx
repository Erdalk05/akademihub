/**
 * Role-Based Action Buttons
 * Silme ve düzenleme butonlarını rol bazlı gösterir
 * 
 * Kullanım:
 * <ActionButtons
 *   onEdit={() => handleEdit()}
 *   onDelete={() => handleDelete()}
 *   itemName="Öğrenci"
 * />
 */

'use client';

import React, { useState } from 'react';
import { Edit, Trash2, Eye, MoreVertical, AlertTriangle, Lock } from 'lucide-react';
import { usePermission } from '@/lib/hooks/usePermission';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  itemName?: string;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'dropdown';
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  itemName = 'kayıt',
  showView = true,
  showEdit = true,
  showDelete = true,
  size = 'md',
  variant = 'inline',
}) => {
  const { isAdmin, canEditStudent, canDeleteStudent } = usePermission();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  // Inline variant
  if (variant === 'inline') {
    return (
      <>
        <div className="flex items-center gap-1">
          {/* View Button - Herkes görebilir */}
          {showView && onView && (
            <button
              onClick={onView}
              className={`${sizeClasses[size]} rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition`}
              title="Görüntüle"
            >
              <Eye size={iconSizes[size]} />
            </button>
          )}

          {/* Edit Button - Sadece Admin */}
          {showEdit && onEdit && (
            isAdmin ? (
              <button
                onClick={onEdit}
                className={`${sizeClasses[size]} rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition`}
                title="Düzenle"
              >
                <Edit size={iconSizes[size]} />
              </button>
            ) : (
              <button
                disabled
                className={`${sizeClasses[size]} rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed`}
                title="Düzenleme yetkisi yok"
              >
                <Lock size={iconSizes[size]} />
              </button>
            )
          )}

          {/* Delete Button - Sadece Admin */}
          {showDelete && onDelete && (
            isAdmin ? (
              <button
                onClick={handleDelete}
                className={`${sizeClasses[size]} rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition`}
                title="Sil"
              >
                <Trash2 size={iconSizes[size]} />
              </button>
            ) : (
              <button
                disabled
                className={`${sizeClasses[size]} rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed`}
                title="Silme yetkisi yok"
              >
                <Lock size={iconSizes[size]} />
              </button>
            )
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
                Silme Onayı
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Bu {itemName} kaydını silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Vazgeç
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`${sizeClasses[size]} rounded-lg hover:bg-gray-100 transition`}
      >
        <MoreVertical size={iconSizes[size]} className="text-gray-500" />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
            {showView && onView && (
              <button
                onClick={() => { onView(); setShowDropdown(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye size={16} />
                Görüntüle
              </button>
            )}
            
            {showEdit && onEdit && (
              isAdmin ? (
                <button
                  onClick={() => { onEdit(); setShowDropdown(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                >
                  <Edit size={16} />
                  Düzenle
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
                  <Lock size={16} />
                  Düzenle (Yetkisiz)
                </div>
              )
            )}
            
            {showDelete && onDelete && (
              isAdmin ? (
                <button
                  onClick={() => { handleDelete(); setShowDropdown(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Sil
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
                  <Lock size={16} />
                  Sil (Yetkisiz)
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
              Silme Onayı
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Bu {itemName} kaydını silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;




