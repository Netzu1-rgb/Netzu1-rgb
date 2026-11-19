// CSV export that opens correctly in Excel with Spanish/Portuguese regional settings:
// semicolon separator, comma decimals and a UTF-8 BOM for accents.

export type CsvValue = string | number | null | undefined

export interface CsvColumn<T> {
  header: string
  value: (row: T) => CsvValue
  /** numbers are written with a decimal comma */
  numeric?: boolean
}

function cell(v: CsvValue, numeric?: boolean): string {
  if (v === null || v === undefined) return ''
  let s = typeof v === 'number' || numeric ? String(v).replace('.', ',') : String(v)
  // avoid spreadsheet formula injection from free text
  if (!numeric && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => cell(c.header)).join(';')]
  for (const r of rows) lines.push(columns.map((c) => cell(c.value(r), c.numeric)).join(';'))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
