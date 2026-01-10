'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Share2,
  Tag,
  Edit,
  CheckSquare,
  X,
  Loader2,
} from 'lucide-react';
import type { BulkActionType } from '@/types/spectra-detail';

interface BulkActionsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onAction: (action: BulkActionType) => void;
  isProcessing: boolean;
}

export function BulkActions({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onAction,
  isProcessing,
}: BulkActionsProps) {
  const isDisabled = selectedCount === 0 || isProcessing;

  return (
    <div className="space-y-4">
      {/* Seçim Bilgisi */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm">
          Seçili:{' '}
          <span className="font-bold text-emerald-600">{selectedCount}</span> öğrenci
        </span>
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          <CheckSquare className="h-4 w-4 mr-1" />
          Tümünü Seç
        </Button>
        {selectedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="h-4 w-4 mr-1" />
            Seçimi Temizle
          </Button>
        )}
      </div>

      {/* Toplu İşlem Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Karne Oluştur */}
        <ActionCard
          title="📄 Karne Oluştur"
          description="Seçili öğrencilerin karnelerini toplu oluştur"
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          buttonLabel="PDF Oluştur"
          disabled={isDisabled}
          loading={isProcessing}
          onClick={() => onAction('karne')}
        />

        {/* Bildirim Gönder */}
        <ActionCard
          title="📱 Bildirim Gönder"
          description="Seçili öğrencilerin velilerine bildirim gönder"
          icon={<Share2 className="h-6 w-6 text-green-600" />}
          buttonLabel="Gönder"
          disabled={isDisabled}
          loading={isProcessing}
          onClick={() => onAction('bildirim')}
        />

        {/* Etiketle */}
        <ActionCard
          title="🏷️ Etiketle"
          description="Seçili öğrencilere etiket ekle"
          icon={<Tag className="h-6 w-6 text-purple-600" />}
          buttonLabel="Etiketle"
          disabled={isDisabled}
          loading={isProcessing}
          onClick={() => onAction('etiket')}
          tags={['Başarılı', 'Dikkat', 'Takip']}
        />

        {/* Düzenle */}
        <ActionCard
          title="✏️ Düzenle"
          description="Seçili öğrencilerin bilgilerini düzenle"
          icon={<Edit className="h-6 w-6 text-orange-600" />}
          buttonLabel="Düzenle"
          disabled={isDisabled}
          loading={isProcessing}
          onClick={() => onAction('duzenle')}
        />
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  buttonLabel,
  disabled,
  loading,
  onClick,
  tags,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonLabel: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  tags?: string[];
}) {
  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-opacity ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-sm text-gray-500 mb-3">{description}</p>

      {tags && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Button className="w-full" disabled={disabled} onClick={onClick}>
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : null}
        {buttonLabel}
      </Button>
    </div>
  );
}
