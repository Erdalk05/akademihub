import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ExportFormat = 'PDF' | 'EXCEL' | 'BOTH';

interface GenerateBody {
  type?: string;
  params?: {
    startDate?: string;
    endDate?: string;
    statusFilter?: string;
    categoryFilter?: string;
    studentQuery?: string;
  };
  options?: {
    includeCharts?: boolean;
    includeTables?: boolean;
    includeDetails?: boolean;
    includeTrendAnalysis?: boolean;
    includeStudentBreakdown?: boolean;
    includeInstallmentSummary?: boolean;
    exportFormat?: ExportFormat;
    savePreset?: boolean;
    presetName?: string;
    markFavorite?: boolean;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody;

    if (!body?.type) {
      return NextResponse.json(
        { success: false, error: "Rapor tipi 'type' zorunludur." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const exportFormat: ExportFormat = body.options?.exportFormat || 'BOTH';

    const responsePayload = {
      jobId: `job_${Date.now()}`,
      type: body.type,
      requestedAt: now,
      exportFormat,
      message:
        'Rapor oluşturma isteği başarıyla alındı. Bu demo sürümünde çıktı dosyaları sahte URL olarak dönmektedir.',
      downloads: {
        pdfUrl:
          exportFormat === 'PDF' || exportFormat === 'BOTH'
            ? '/demo/reports/sample.pdf'
            : null,
        excelUrl:
          exportFormat === 'EXCEL' || exportFormat === 'BOTH'
            ? '/demo/reports/sample.xlsx'
            : null,
      },
    };

    return NextResponse.json(
      { success: true, data: responsePayload },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          e?.message ||
          'Rapor oluşturma isteği işlenirken beklenmeyen bir hata oluştu.',
      },
      { status: 500 },
    );
  }
}


