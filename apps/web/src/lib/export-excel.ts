'use client';

// Genera y descarga un .xlsx con estilo profesional en el navegador, a partir
// de datos ya cargados en la página (server component los pasa como props
// serializables a un componente cliente que llama a esto). No hay endpoint
// de backend para exportar — reusa los mismos datos que ya se muestran en
// pantalla.

export type ExcelColumnFormat = 'currency' | 'integer' | 'percent' | 'text';

export interface ExcelColumn {
  header: string;
  key: string;
  format?: ExcelColumnFormat;
  width?: number;
}

export interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  rows: Record<string, string | number | null | undefined>[];
}

const HEADER_FILL = 'FF15171C'; // ink — mismo tono que el scoreboard del dashboard
const ACCENT_FILL = 'FFFF5A1F'; // acento naranja de marca
const BAND_FILL = 'FFF7F5F2';
const BORDER_COLOR = 'FFE2E0DC';
const FONT_NAME = 'Calibri';

const NUMBER_FORMATS: Record<ExcelColumnFormat, string> = {
  currency: '$#,##0.00;[Red]-$#,##0.00',
  integer: '#,##0',
  percent: '0.0%',
  text: '@',
};

function autoWidth(col: ExcelColumn, rows: ExcelSheet['rows']): number {
  if (col.width) return col.width;
  const longest = rows.reduce((max, r) => {
    const v = r[col.key];
    const len = v === null || v === undefined ? 0 : String(v).length;
    return Math.max(max, len);
  }, col.header.length);
  return Math.min(Math.max(longest + 3, 12), 48);
}

export async function downloadExcel(filename: string, sheets: ExcelSheet[]) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GymApp';
  workbook.created = new Date();

  for (const sheet of sheets) {
    const safeName = sheet.name.slice(0, 31).replace(/[\\/*?:[\]]/g, ' ') || 'Hoja';
    const worksheet = workbook.addWorksheet(safeName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = sheet.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: autoWidth(col, sheet.rows),
    }));

    // Encabezado
    const headerRow = worksheet.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = { bottom: { style: 'medium', color: { argb: ACCENT_FILL } } };
    });

    // Filas de datos
    sheet.rows.forEach((row, i) => {
      const excelRow = worksheet.addRow(row);
      excelRow.height = 18;
      excelRow.eachCell((cell, colNumber) => {
        const col = sheet.columns[colNumber - 1];
        cell.font = { name: FONT_NAME, size: 10.5 };
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        };
        if (col?.format) cell.numFmt = NUMBER_FORMATS[col.format];
        if (i % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BAND_FILL } };
        }
      });
    });

    if (sheet.rows.length === 0) {
      const emptyRow = worksheet.addRow({});
      worksheet.mergeCells(2, 1, 2, sheet.columns.length || 1);
      emptyRow.getCell(1).value = 'Sin datos para este período';
      emptyRow.getCell(1).font = {
        name: FONT_NAME,
        size: 10,
        italic: true,
        color: { argb: 'FF9CA3AF' },
      };
      emptyRow.getCell(1).alignment = { horizontal: 'center' };
    }

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length || 1 },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
