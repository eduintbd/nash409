import jsPDF from 'jspdf';
import { formatBDT } from '@/lib/currency';
import type { FlatLedger, LedgerLine } from '@/hooks/useFlatLedger';

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 16;
const HEADER_ROW_HEIGHT = 20;

const formatDate = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const buildLedgerPdf = (ledger: FlatLedger): jsPDF => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  // Column layout
  const columns = [
    { key: 'date', label: 'Date', width: 70 },
    { key: 'description', label: 'Description', width: 220 },
    { key: 'debit', label: 'Debit', width: 70, align: 'right' as const },
    { key: 'credit', label: 'Credit', width: 70, align: 'right' as const },
    { key: 'balance', label: 'Balance', width: contentWidth - 430, align: 'right' as const },
  ];

  let y = PAGE_MARGIN;

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Flat ${ledger.flatNumber ?? ledger.flatId} — Ledger`, PAGE_MARGIN, y);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90);
    const meta: string[] = [];
    if (ledger.buildingName) meta.push(ledger.buildingName);
    if (ledger.tenantName) meta.push(`Tenant: ${ledger.tenantName}`);
    else if (ledger.ownerName) meta.push(`Owner: ${ledger.ownerName}`);
    if (meta.length) {
      doc.text(meta.join('  •  '), PAGE_MARGIN, y);
      y += 14;
    }
    doc.setTextColor(0);
    y += 10;

    // Summary line
    const s = ledger.summary;
    const summary = `Invoiced ${formatBDT(s.totalInvoiced)}   Paid ${formatBDT(s.totalPaid)}   Outstanding ${formatBDT(s.outstanding)}`;
    doc.setFontSize(10);
    doc.text(summary, PAGE_MARGIN, y);
    y += 20;
  };

  const drawColumnHeaders = () => {
    doc.setFillColor(240, 240, 240);
    doc.rect(PAGE_MARGIN, y - 12, contentWidth, HEADER_ROW_HEIGHT, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    let x = PAGE_MARGIN + 4;
    for (const col of columns) {
      const anchor = col.align === 'right' ? x + col.width - 4 : x;
      doc.text(col.label, anchor, y, col.align === 'right' ? { align: 'right' } : undefined);
      x += col.width;
    }
    y += HEADER_ROW_HEIGHT - 6;
    doc.setDrawColor(210);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + contentWidth, y);
    y += 8;
  };

  const drawRow = (line: LedgerLine) => {
    if (y + ROW_HEIGHT > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
      drawColumnHeaders();
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let x = PAGE_MARGIN + 4;

    // Date
    doc.text(formatDate(line.date), x, y);
    x += columns[0].width;

    // Description (wrap to 2 lines max)
    const desc = doc.splitTextToSize(line.description, columns[1].width - 8).slice(0, 2);
    doc.text(desc, x, y);
    x += columns[1].width;

    // Debit
    doc.text(line.debit ? formatBDT(line.debit) : '—', x + columns[2].width - 4, y, { align: 'right' });
    x += columns[2].width;

    // Credit
    doc.setTextColor(line.credit ? 0 : 160);
    doc.text(line.credit ? formatBDT(line.credit) : '—', x + columns[3].width - 4, y, { align: 'right' });
    doc.setTextColor(0);
    x += columns[3].width;

    // Balance
    doc.setFont('helvetica', line.balance === 0 ? 'normal' : 'bold');
    doc.text(formatBDT(line.balance), x + columns[4].width - 4, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += ROW_HEIGHT + Math.max(0, (desc.length - 1) * 12);
  };

  drawHeader();
  drawColumnHeaders();
  for (const line of ledger.lines) drawRow(line);

  // Footer on last page
  const footerY = pageHeight - 36;
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(
    `Generated ${new Date().toLocaleString('en-GB')} via NASH-MS.  A digital record is retained in the system.`,
    PAGE_MARGIN,
    footerY,
  );
  doc.setTextColor(0);

  return doc;
};

export const downloadLedgerPdf = (ledger: FlatLedger): void => {
  const doc = buildLedgerPdf(ledger);
  const safeFlat = (ledger.flatNumber ?? ledger.flatId).replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`ledger-${safeFlat}.pdf`);
};
