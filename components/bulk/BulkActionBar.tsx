'use client';

import React from 'react';
import { 
  X, 
  MessageCircle, 
  Mail, 
  FileSpreadsheet, 
  Archive, 
  Trash2,
  Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onWhatsAppSend?: () => void;
  onEmailSend?: () => void;
  onExcelExport?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  isProcessing?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onClear,
  onWhatsAppSend,
  onEmailSend,
  onExcelExport,
  onArchive,
  onDelete,
  isProcessing = false
}: BulkActionBarProps) {
  
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6 border-2 border-white/20 backdrop-blur-sm">
        {/* Selected Count */}
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg">
            {selectedCount}
          </div>
          <span className="font-semibold">
            {selectedCount} öğrenci seçildi
          </span>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-white/30" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onWhatsAppSend && (
            <button
              onClick={onWhatsAppSend}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="WhatsApp Gönder"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}

          {onEmailSend && (
            <button
              onClick={onEmailSend}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition disabled:opacity-50"
              title="E-posta Gönder"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">E-posta</span>
            </button>
          )}

          {onExcelExport && (
            <button
              onClick={onExcelExport}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition disabled:opacity-50"
              title="Excel İndir"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          )}

          {onArchive && (
            <button
              onClick={onArchive}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition disabled:opacity-50"
              title="Arşivle"
            >
              <Archive className="w-4 h-4" />
              <span className="hidden sm:inline">Arşivle</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition disabled:opacity-50"
              title="Sil"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Sil</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-white/30" />

        {/* Clear Button */}
        <button
          onClick={onClear}
          disabled={isProcessing}
          className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/20 transition disabled:opacity-50"
          title="İptal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}





