'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadExcel, type ExcelSheet } from '@/lib/export-excel';

export function ExportExcelButton({
  filename,
  sheets,
  label = 'Descargar Excel',
  className,
}: {
  filename: string;
  sheets: ExcelSheet[];
  label?: string;
  className?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleClick() {
    setDownloading(true);
    try {
      await downloadExcel(filename, sheets);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={downloading}
      className={
        className ??
        'flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50'
      }
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {downloading ? 'Generando...' : label}
    </button>
  );
}
