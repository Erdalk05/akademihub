'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { exportToExcel } from '@/lib/utils/excelExport'
import { downloadPDF } from '@/lib/utils/pdfGenerator'

type ExportBarProps = {
  title: string
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

export function ExportBar({ title, excel, pdf }: ExportBarProps) {
  const [busy, setBusy] = useState<'excel' | 'pdf' | null>(null)

  const onExcel = async () => {
    if (!excel) return
    setBusy('excel')
    try {
      await exportToExcel(excel.rows, excel.headers, { filename: excel.filename, sheetName: excel.sheetName || title, includeTimestamp: true })
    } finally {
      setBusy(null)
    }
  }

  const onPdf = async () => {
    if (!pdf) return
    const el = document.getElementById(pdf.elementId)
    if (!el) return
    setBusy('pdf')
    try {
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
