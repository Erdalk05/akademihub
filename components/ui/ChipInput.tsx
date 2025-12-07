'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Check, Plus } from 'lucide-react';

interface ChipInputProps {
  label: string;
  placeholder?: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  suggestions?: string[];
  transform?: (value: string) => string;
  validate?: (value: string) => boolean;
  helpText?: string;
}

export default function ChipInput({
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
  suggestions = [],
  transform,
  validate,
  helpText,
}: ChipInputProps) {
  const [input, setInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const confirmTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const commitAdd = () => {
    const raw = input.trim();
    const value = transform ? transform(raw) : raw;
    if (!value) return;
    if (validate && !validate(value)) return;
    if (values.includes(value)) {
      setInput('');
      return;
    }
    onAdd(value);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitAdd();
    } else if (e.key === 'Backspace' && input === '' && values.length > 0) {
      // Backspace ile son chip'i kaldır
      const last = values[values.length - 1];
      askDelete(last);
    }
  };

  const askDelete = (v: string) => {
    setConfirmDelete(v);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => setConfirmDelete(null), 2000);
  };

  const confirmRemove = (v: string) => {
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setConfirmDelete(null);
    onRemove(v);
    // Odak tekrar input'a
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <label className="font-semibold text-gray-800">{label}</label>
        {helpText && <span className="text-xs text-gray-500">{helpText}</span>}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full outline-none text-sm"
          />
          <button
            type="button"
            onClick={commitAdd}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <Plus className="w-3 h-3" /> Ekle
          </button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const v = transform ? transform(s) : s;
                if (!values.includes(v)) onAdd(v);
                inputRef.current?.focus();
              }}
              className="px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 border"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-2 px-2 py-1 rounded-full border bg-gradient-to-r from-gray-50 to-white text-sm"
          >
            <span className="font-medium">{v}</span>
            {confirmDelete === v ? (
              <button
                type="button"
                onClick={() => confirmRemove(v)}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                title="Silmeyi onayla"
              >
                <Check className="w-3 h-3" /> Sil?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => askDelete(v)}
                className="text-gray-500 hover:text-gray-700"
                title="Sil"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}



