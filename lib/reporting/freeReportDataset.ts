// AkademiHub Free Report Builder 7.0
// ------------------------------------------------------------
// SQL sonucundan grafik/pivot/tablo dataset'leri üretmek için yardımcı fonksiyonlar.

export type ChartKind = 'bar' | 'line' | 'pie' | 'kpi' | 'table';

export interface ChartDataset {
  type: ChartKind;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

interface CategoryDatasetOptions {
  labelField: string;
  valueField: string;
  label?: string;
  type?: Exclude<ChartKind, 'table' | 'kpi'>;
}

// Basit kategori → değer grafiği (bar / line / pie)
export function buildCategoryDataset(
  rows: any[],
  options: CategoryDatasetOptions,
): ChartDataset {
  const type = options.type || 'bar';
  const labels: string[] = [];
  const data: number[] = [];

  rows.forEach((row) => {
    labels.push(String(row[options.labelField] ?? ''));
    const raw = row[options.valueField];
    data.push(typeof raw === 'number' ? raw : Number(raw) || 0);
  });

  return {
    type,
    labels,
    datasets: [
      {
        label: options.label || 'DEĞER',
        data,
      },
    ],
  };
}


