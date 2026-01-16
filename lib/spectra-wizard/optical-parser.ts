// ============================================================================
// OPTICAL PARSER - TXT/DAT Optik Okuma Parser
// ============================================================================

export interface OptikFormSablonu {
  id: string;
  name: string;
  questionCount: number;
  fields: any;
}

export const OPTIK_SABLONLARI: OptikFormSablonu[] = [
  {
    id: 'default',
    name: 'Varsayılan Şablon',
    questionCount: 100,
    fields: {},
  },
];

export function parseOptikData(
  fileContent: string,
  template: OptikFormSablonu
): any {
  // Dummy implementation for build
  return {
    satirlar: [],
    hatalar: [],
  };
}

export function autoDetectSablon(fileContent: string): OptikFormSablonu | null {
  // Dummy implementation for build
  return OPTIK_SABLONLARI[0];
}
