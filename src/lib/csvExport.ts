// Minimal CSV writer. Handles comma/quote/newline escaping per RFC 4180.

const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export const toCsv = (headers: string[], rows: Array<Record<string, unknown>>): string => {
  const headerLine = headers.map(escapeCell).join(',');
  const bodyLines = rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','));
  return [headerLine, ...bodyLines].join('\r\n');
};

export const downloadCsv = (filename: string, csv: string): void => {
  // Prepend UTF-8 BOM so Excel opens Bangla correctly if we export it later.
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
