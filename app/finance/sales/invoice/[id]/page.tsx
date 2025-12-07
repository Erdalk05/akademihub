'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import autoTable from 'jspdf-autotable';
import { createTurkishPdfDoc, normalizeTrForPdf } from '@/lib/services/exportService';

type SaleItemRow = {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type SaleDetail = {
  id: string;
  sale_no: string;
  customer_type: 'student' | 'external';
  customer_name: string;
  total_amount: number;
  discount: number;
  tax: number;
  net_amount: number;
  payment_method?: string | null;
  status: string;
  sale_date: string;
  sale_items: SaleItemRow[];
};

export default function SaleInvoicePage() {
  const params = useParams();
  const id = params.id as string;

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/finance/sales?id=${id}`, { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (!js?.success || !Array.isArray(js.data) || js.data.length === 0) {
          setError(js?.error || 'Satış kaydı bulunamadı');
          return;
        }
        const row = js.data[0];
        const items: SaleItemRow[] = Array.isArray(row.sale_items) ? row.sale_items : [];
        const customerName =
          row.customer_name || (row.customer_type === 'student' ? 'Öğrenci' : 'Müşteri');

        setSale({
          id: row.id,
          sale_no: row.sale_no,
          customer_type: row.customer_type,
          customer_name: customerName,
          total_amount: Number(row.total_amount || 0),
          discount: Number(row.discount || 0),
          tax: Number(row.tax || 0),
          net_amount: Number(row.net_amount || 0),
          payment_method: row.payment_method,
          status: row.status,
          sale_date: row.sale_date,
          sale_items: items,
        });
      } catch (e: any) {
        setError(e?.message || 'Satış detayı alınamadı');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSale();
  }, [id]);

  const handleDownload = async () => {
    if (!sale) {
      // eslint-disable-next-line no-alert
      alert('Fatura verisi henüz yüklenmedi. Lütfen birkaç saniye sonra tekrar deneyin.');
      return;
    }

    try {
      setDownloading(true);

      const doc = await createTurkishPdfDoc('portrait');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const now = new Date();
      const issueDate = now.toLocaleDateString('tr-TR');
      const issueTime = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Başlık
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(normalizeTrForPdf('SATIŞ FATURASI'), 14, 16);

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(
        normalizeTrForPdf(`Fatura No: ${sale.sale_no}`),
        pageWidth - 14,
        14,
        { align: 'right' },
      );
      doc.text(
        normalizeTrForPdf(`Tarih: ${issueDate} ${issueTime}`),
        pageWidth - 14,
        20,
        { align: 'right' },
      );

      // Müşteri ve satış bilgileri bloğu
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      doc.text(normalizeTrForPdf(`Müşteri Adı: ${sale.customer_name}`), 14, 30);
      doc.text(
        normalizeTrForPdf(
          `Müşteri Türü: ${
            sale.customer_type === 'student' ? 'Öğrenci' : 'Harici Müşteri'
          }`,
        ),
        14,
        36,
      );
      doc.text(
        normalizeTrForPdf(`Ödeme Yöntemi: ${sale.payment_method || 'Belirtilmemiş'}`),
        14,
        42,
      );

      doc.text(
        normalizeTrForPdf(
          `Satış Tarihi: ${
            sale.sale_date ? new Date(sale.sale_date).toLocaleString('tr-TR') : '-'
          }`,
        ),
        pageWidth / 2,
        30,
      );
      doc.text(
        normalizeTrForPdf(`Durum: ${sale.status || 'completed'}`),
        pageWidth / 2,
        36,
      );

      // Ürün tablosu
      const columns = ['Ürün', 'Kategori', 'Adet', 'Birim Fiyat', 'İndirim', 'Tutar'];

      const rows = sale.sale_items.map((it) => [
        normalizeTrForPdf(it.product_name),
        normalizeTrForPdf(it.category),
        it.quantity.toString(),
        `₺${Number(it.unit_price || 0).toLocaleString('tr-TR', {
          minimumFractionDigits: 2,
        })}`,
        `₺${Number((it as any).discount || 0).toLocaleString('tr-TR', {
          minimumFractionDigits: 2,
        })}`,
        `₺${Number(it.total_price || 0).toLocaleString('tr-TR', {
          minimumFractionDigits: 2,
        })}`,
      ]);

      autoTable(doc, {
        startY: 50,
        head: [columns.map((c) => normalizeTrForPdf(c))],
        body: rows,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [160, 160, 160],
          lineWidth: 0.1,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: 0,
          fontStyle: 'bold',
          lineColor: [140, 140, 140],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'left' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
      });

      // Alt toplam / KDV / Net tutar bloğu
      const summaryStartY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const blockX = pageWidth - 80;
      let y = summaryStartY;

      const summaryRows: [string, number][] = [
        ['Ara Toplam', sale.total_amount],
        ['İskonto', sale.discount],
        ['KDV', sale.tax],
        ['Net Tutar', sale.net_amount],
      ];

      summaryRows.forEach(([label, value]) => {
        doc.text(normalizeTrForPdf(label), blockX, y);
        doc.text(
          `₺${Number(value).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
          })}`,
          pageWidth - 14,
          y,
          { align: 'right' },
        );
        y += 6;
      });

      // İmza alanı
      const signatureY = Math.max(y + 12, pageHeight - 40);
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(normalizeTrForPdf('Yetkili İmza'), 14, signatureY);
      doc.line(14, signatureY + 2, 70, signatureY + 2);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const footerText = normalizeTrForPdf(
        'Bu belge, AkademiHub sistemi üzerinden otomatik olarak oluşturulmuştur.',
      );
      doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });

      const safeNo = sale.sale_no.replace(/\s+/g, '-');
      doc.save(`fatura-${safeNo}.pdf`);
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || 'Fatura PDF oluşturulurken bir hata oluştu.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/finance/sales/${id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft size={14} />
            Satış detayına dön
          </Link>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || loading || !!error}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Download size={14} />
            {downloading ? 'Oluşturuluyor...' : 'PDF İndir'}
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-gray-600">Fatura verisi yükleniyor...</p>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : sale ? (
          <>
            <h1 className="mb-2 text-lg font-semibold text-gray-900">
              {sale.customer_name} – Fatura Önizleme
            </h1>
            <p className="text-xs text-gray-600">
              Bu sayfa, satış için oluşturulacak siyah-beyaz PDF faturanın özetini temsil eder.
              Detaylı çıktı için &quot;PDF İndir&quot; butonunu kullanın.
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-600">Kayıt bulunamadı.</p>
        )}
      </div>
    </div>
  );
}

