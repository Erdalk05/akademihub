'use client'

import Image from 'next/image'

export function ReportHeader(props: {
  organizationName: string
  organizationLogoUrl?: string
  title: string
  subtitle?: string
  rightText?: string
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {props.organizationLogoUrl ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border flex items-center justify-center shrink-0">
            <Image src={props.organizationLogoUrl} alt={props.organizationName} width={48} height={48} className="object-contain" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-[#DCF8C6] text-[#075E54] font-black flex items-center justify-center shrink-0">
            {String(props.organizationName || 'K').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm text-gray-500 font-semibold truncate">{props.organizationName}</div>
          <div className="text-xl font-black text-gray-900 truncate">{props.title}</div>
          {props.subtitle ? <div className="text-xs text-gray-500 font-semibold truncate mt-0.5">{props.subtitle}</div> : null}
        </div>
      </div>
      <div className="text-right text-xs text-gray-500 font-semibold">
        <div>{props.rightText || new Date().toLocaleString('tr-TR')}</div>
        <div className="text-[11px] text-gray-400">AkademiHub • Exam Intelligence</div>
      </div>
    </div>
  )
}


