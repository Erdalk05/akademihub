'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExamSection, AdvancedFilters } from '@/types/spectra-detail';

interface FilterAccordionProps {
  sections: ExamSection[];
  siniflar: string[];
  filters: AdvancedFilters;
  onFilterChange: (filters: Partial<AdvancedFilters>) => void;
}

export function FilterAccordion({
  sections,
  siniflar,
  filters,
  onFilterChange,
}: FilterAccordionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Net Filtresi */}
      <FilterCard title="📊 Net Filtresi">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div>
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                value={filters.netMin}
                onChange={(e) => onFilterChange({ netMin: Number(e.target.value) })}
                className="w-20"
              />
            </div>
            <div>
              <Label className="text-xs">Max</Label>
              <Input
                type="number"
                value={filters.netMax}
                onChange={(e) => onFilterChange({ netMax: Number(e.target.value) })}
                className="w-20"
              />
            </div>
          </div>
          <Slider
            value={[filters.netMin, filters.netMax]}
            min={0}
            max={120}
            step={1}
            onValueChange={([min, max]) => onFilterChange({ netMin: min, netMax: max })}
          />
          <div className="flex flex-wrap gap-1">
            <QuickBtn label="0-30" onClick={() => onFilterChange({ netMin: 0, netMax: 30 })} />
            <QuickBtn label="30-60" onClick={() => onFilterChange({ netMin: 30, netMax: 60 })} />
            <QuickBtn label="60-90" onClick={() => onFilterChange({ netMin: 60, netMax: 90 })} />
            <QuickBtn label="90+" onClick={() => onFilterChange({ netMin: 90, netMax: 120 })} />
          </div>
        </div>
      </FilterCard>

      {/* Puan Filtresi */}
      <FilterCard title="🎯 Puan Filtresi">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div>
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                value={filters.puanMin}
                onChange={(e) => onFilterChange({ puanMin: Number(e.target.value) })}
                className="w-24"
              />
            </div>
            <div>
              <Label className="text-xs">Max</Label>
              <Input
                type="number"
                value={filters.puanMax}
                onChange={(e) => onFilterChange({ puanMax: Number(e.target.value) })}
                className="w-24"
              />
            </div>
          </div>
          <Slider
            value={[filters.puanMin, filters.puanMax]}
            min={0}
            max={500}
            step={10}
            onValueChange={([min, max]) => onFilterChange({ puanMin: min, puanMax: max })}
          />
          <div className="flex flex-wrap gap-1">
            <QuickBtn label="0-200" onClick={() => onFilterChange({ puanMin: 0, puanMax: 200 })} />
            <QuickBtn label="200-350" onClick={() => onFilterChange({ puanMin: 200, puanMax: 350 })} />
            <QuickBtn label="350-450" onClick={() => onFilterChange({ puanMin: 350, puanMax: 450 })} />
            <QuickBtn label="450+" onClick={() => onFilterChange({ puanMin: 450, puanMax: 500 })} />
          </div>
        </div>
      </FilterCard>

      {/* Sıralama Filtresi */}
      <FilterCard title="🏆 Sıralama Filtresi">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div>
              <Label className="text-xs">Sıra Min</Label>
              <Input
                type="number"
                value={filters.siraMin}
                onChange={(e) => onFilterChange({ siraMin: Number(e.target.value) })}
                className="w-16"
              />
            </div>
            <div>
              <Label className="text-xs">Max</Label>
              <Input
                type="number"
                value={filters.siraMax}
                onChange={(e) => onFilterChange({ siraMax: Number(e.target.value) })}
                className="w-16"
              />
            </div>
          </div>
          <Select
            value={filters.yuzdelikDilim}
            onValueChange={(v: any) => onFilterChange({ yuzdelikDilim: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Yüzdelik Dilim" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="top10">İlk %10</SelectItem>
              <SelectItem value="top25">İlk %25</SelectItem>
              <SelectItem value="top50">İlk %50</SelectItem>
              <SelectItem value="bottom25">Son %25</SelectItem>
              <SelectItem value="bottom10">Son %10</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterCard>

      {/* Ders Filtresi */}
      <FilterCard title="📚 Ders Filtresi">
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {sections.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <Checkbox id={`ders-${s.code}`} defaultChecked />
              <Label htmlFor={`ders-${s.code}`} className="text-sm">
                {s.name}
              </Label>
            </div>
          ))}
        </div>
      </FilterCard>

      {/* Öğrenci Tipi */}
      <FilterCard title="👥 Öğrenci Tipi">
        <RadioGroup
          value={filters.participantType}
          onValueChange={(v: any) => onFilterChange({ participantType: v })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="tip-all" />
            <Label htmlFor="tip-all">Tümü</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="institution" id="tip-asil" />
            <Label htmlFor="tip-asil">Sadece Asil</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="guest" id="tip-misafir" />
            <Label htmlFor="tip-misafir">Sadece Misafir</Label>
          </div>
        </RadioGroup>
        <div className="mt-3 pt-3 border-t">
          <Label className="text-xs text-gray-500 mb-2 block">Kitapçık</Label>
          <div className="flex gap-2">
            {(['A', 'B', 'C', 'D'] as const).map((k) => (
              <Button
                key={k}
                variant={filters.kitapcik.includes(k) ? 'default' : 'outline'}
                size="sm"
                className="w-10"
                onClick={() => {
                  const newKitapcik = filters.kitapcik.includes(k)
                    ? filters.kitapcik.filter((kk) => kk !== k)
                    : [...filters.kitapcik, k];
                  onFilterChange({ kitapcik: newKitapcik });
                }}
              >
                {k}
              </Button>
            ))}
          </div>
        </div>
      </FilterCard>

      {/* Sınıf/Şube */}
      <FilterCard title="🏫 Sınıf / Şube">
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {siniflar.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <Checkbox
                id={`sinif-${s}`}
                checked={filters.siniflar.includes(s)}
                onCheckedChange={(c) => {
                  const newSiniflar = c
                    ? [...filters.siniflar, s]
                    : filters.siniflar.filter((ss) => ss !== s);
                  onFilterChange({ siniflar: newSiniflar });
                }}
              />
              <Label htmlFor={`sinif-${s}`} className="text-sm">
                {s}
              </Label>
            </div>
          ))}
        </div>
      </FilterCard>

      {/* Ek Filtreler */}
      <FilterCard title="📅 Ek Filtreler">
        <div className="space-y-2">
          {[
            { key: 'sadeceBosOlan', label: 'Sadece boşu olan' },
            { key: 'sadeceTamYapan', label: 'Sadece tam yapan' },
            { key: 'ortalamaAlti', label: 'Ortalama altı' },
            { key: 'ortalamaUstu', label: 'Ortalama üstü' },
            { key: 'eksikVeriOlan', label: 'Eksik veri olan' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`ek-${key}`}
                checked={filters.ekFiltreler[key as keyof typeof filters.ekFiltreler]}
                onCheckedChange={(c) =>
                  onFilterChange({
                    ekFiltreler: { ...filters.ekFiltreler, [key]: !!c },
                  })
                }
              />
              <Label htmlFor={`ek-${key}`} className="text-sm">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </FilterCard>
    </div>
  );
}

function FilterCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border p-3">
      <h4 className="font-medium text-sm text-gray-700 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function QuickBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={onClick}>
      {label}
    </Button>
  );
}
