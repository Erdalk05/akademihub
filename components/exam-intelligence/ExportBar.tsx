'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { exportToExcel } from '@/lib/utils/excelExport'
import { downloadPDF } from '@/lib/utils/pdfGenerator'

type ExportBarProps = {
  title: string
  mode?: 'client' | 'server'
  report?: {
    organizationId: string
    entityType: string
    entityId?: string | null
    section?: string
  }
  excel?: {
    filename: string
    sheetName?: string
    rows: any[]
    headers: Record<string, string>
  }
  pdf?: {
    filename: string
    elementId: string
  }
}

export function ExportBar({ title, excel, pdf, report, mode = 'client' }: ExportBarProps) {
  const [busy, setBusy] = useState<'excel' | 'pdf' | null>(null)

  const serverGenerate = async (format: 'pdf' | 'excel') => {
    if (!report?.organizationId) throw new Error('report.organizationId yok')
    if (!excel) throw new Error('Server export için excel.rows + headers gerekli')

    const res = await fetch('/api/exam-intelligence/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report,
        title,
        filename: format === 'pdf' ? (pdf?.filename || excel.filename) : excel.filename,
        format,
        sheetName: excel.sheetName,
        headers: excel.headers,
        rows: excel.rows,
      }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.ok) throw new Error(json?.error || `Server export başarısız (HTTP ${res.status})`)
    const fileUrl = json?.data?.fileUrl as string | null
    const reportId = json?.data?.reportId as string | null

    if (fileUrl) {
      window.open(fileUrl, '_blank')
      return
    }

    // public URL yoksa signed download
    if (reportId) {
      const d = await fetch(`/api/exam-intelligence/reports/${encodeURIComponent(reportId)}/download`, { cache: 'no-store' })
      const dj = await d.json().catch(() => null)
      const signed = dj?.data?.signedUrl as string | null
      if (signed) window.open(signed, '_blank')
    }
  }

  const onExcel = async () => {
    if (!excel) return
    setBusy('excel')
    try {
      if (mode === 'server' && report?.organizationId) {
        await serverGenerate('excel')
        return
      }

      if (report?.organizationId) {
        // generated_reports log (best-effort) — client mode
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetch('/api/exam-intelligence/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            section: report.section || title,
            format: 'excel',
            filename: excel.filename,
            report,
            meta: { rowCount: excel.rows?.length ?? 0 },
          }),
        }).catch(() => {})
      }

      await exportToExcel(excel.rows, excel.headers, {
        filename: excel.filename,
        sheetName: excel.sheetName || title,
        includeTimestamp: true,
      })
    } finally {
      setBusy(null)
    }
  }

  const onPdf = async () => {
    if (!pdf) return
    setBusy('pdf')
    try {
      if (mode === 'server' && report?.organizationId) {
        await serverGenerate('pdf')
        return
      }

      const el = document.getElementById(pdf.elementId)
      if (!el) return

      if (report?.organizationId) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetch('/api/exam-intelligence/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            section: report.section || title,
            format: 'pdf',
            filename: pdf.filename,
            report,
          }),
        }).catch(() => {})
      }

      await downloadPDF(el, { filename: pdf.filename, format: 'a4', orientation: 'portrait', margin: 10, scale: 2 })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="text-sm font-bold text-gray-700">{title}</div>
      <div className="flex items-center gap-2">
        {excel ? (
          <button
            onClick={onExcel}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border hover:bg-gray-50 font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {busy === 'excel' ? 'Hazırlanıyor...' : 'Excel'}
          </button>
        ) : null}
        {pdf ? (
          <button
            onClick={onPdf}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] text-white hover:bg-emerald-600 font-semibold"
          >
            <FileText className="w-4 h-4" />
            {busy === 'pdf' ? 'Hazırlanıyor...' : 'PDF'}
          </button>
        ) : null}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
          <Download className="w-4 h-4" />
          İndir
        </div>
      </div>
    </div>
  )
}
