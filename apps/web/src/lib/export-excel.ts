'use client';

// Genera y descarga un .xlsx en el navegador a partir de datos ya cargados
// en la página (server component los pasa como props serializables a un
// componente cliente que llama a esto). No hay endpoint de backend para
// exportar — reusa los mismos datos que ya se muestran en pantalla.

export interface ExcelSheet {
  name: string;
  rows: Record<string, string | number | null | undefined>[];
}

export async function downloadExcel(filename: string, sheets: ExcelSheet[]) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    // Excel limita el nombre de hoja a 31 caracteres y prohíbe algunos símbolos
    const safeName = sheet.name.slice(0, 31).replace(/[\\/*?:[\]]/g, ' ');
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows.length ? sheet.rows : [{}]);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeName || 'Hoja');
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
