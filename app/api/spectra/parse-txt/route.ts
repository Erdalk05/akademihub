import { NextRequest, NextResponse } from 'next/server';
import { parseOptikData } from '@/lib/spectra-wizard/optical-parser';
import type { OptikFormSablonu } from '@/types/spectra-wizard';

export const dynamic = 'force-dynamic';

// ============================================================================
// TXT/DAT UPLOAD & PARSE API
// Contract-safe endpoint: parseOptikData kullanır, primitive response döner
// ============================================================================

interface ParseRequest {
  rawText: string;
  optikSablon: OptikFormSablonu;
}

export async function POST(request: NextRequest) {
  try {
    const body: ParseRequest = await request.json();
    const { rawText, optikSablon } = body;

    // Validation
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { success: false, message: 'rawText gerekli (string)' },
        { status: 400 }
      );
    }

    if (!optikSablon || typeof optikSablon !== 'object') {
      return NextResponse.json(
        { success: false, message: 'optikSablon gerekli (object)' },
        { status: 400 }
      );
    }

    // ✅ Parser contract'ını kullan
    const parseResult = parseOptikData(rawText, optikSablon);

    // ✅ Response sadece primitive + array içersin
    // Supabase raw response veya complex object dönme
    const safeResponse = {
      success: true,
      data: {
        basarili: parseResult.basarili,
        dosyaAdi: parseResult.dosyaAdi || null,
        sablonAdi: parseResult.sablonAdi || '',
        toplamSatir: parseResult.toplamSatir,
        basariliSatir: parseResult.basariliSatir,
        hataliSatir: parseResult.hataliSatir,
        uyariSatir: parseResult.uyariSatir || 0,
        
        // ✅ Stats: primitive values
        stats: parseResult.stats ? {
          toplam: parseResult.stats.toplam,
          basarili: parseResult.stats.basarili,
          eksikVeri: parseResult.stats.eksikVeri,
          gecersizSatir: parseResult.stats.gecersizSatir,
        } : null,
        
        // ✅ Satirlar: Her alan string veya array
        satirlar: parseResult.satirlar.map(satir => ({
          satirNo: satir.satirNo,
          rawData: String(satir.rawData || ''),
          kurumKodu: String(satir.kurumKodu || ''),
          ogrenciNo: String(satir.ogrenciNo || ''),
          ogrenciAdi: String(satir.ogrenciAdi || ''),
          tcKimlik: String(satir.tcKimlik || ''),
          sinif: String(satir.sinif || ''),
          kitapcik: String(satir.kitapcik || 'A'),
          cinsiyet: satir.cinsiyet ? String(satir.cinsiyet) : null,
          
          // ✅ Cevaplar: Array<string | null>
          cevaplar: satir.cevaplar.map(c => (c ? String(c) : null)),
          
          // ✅ Hatalar: Sadece string mesajlar
          hatalar: satir.hatalar.map(h => 
            typeof h === 'string' ? h : (h.mesaj || 'Bilinmeyen hata')
          ),
          
          // ✅ Durum alanları
          eslesmeDurumu: String(satir.eslesmeDurumu || 'pending'),
          eslesmiStudentId: satir.eslesmiStudentId ? String(satir.eslesmiStudentId) : null,
          eslesmiStudentAdi: satir.eslesmiStudentAdi ? String(satir.eslesmiStudentAdi) : null,
          status: satir.status ? String(satir.status) : 'ok',
          durumEtiketi: satir.durumEtiketi ? String(satir.durumEtiketi) : null,
        })),
        
        // ✅ Hatalar ve uyarılar: Array<string>
        hatalar: parseResult.hatalar.map(h => 
          typeof h === 'string' ? h : (h.mesaj || 'Bilinmeyen hata')
        ),
        uyarilar: parseResult.uyarilar.map(u => 
          typeof u === 'string' ? u : (u.mesaj || 'Bilinmeyen uyarı')
        ),
        
        // ✅ Timestamp'ler: string (ISO)
        parseBaslangic: parseResult.parseBaslangic || new Date().toISOString(),
        parseBitis: parseResult.parseBitis || new Date().toISOString(),
        sureMilisaniye: parseResult.sureMilisaniye || 0,
      },
    };

    return NextResponse.json(safeResponse);

  } catch (error: any) {
    console.error('❌ TXT parse hatası:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Parse işlemi başarısız',
      },
      { status: 500 }
    );
  }
}
