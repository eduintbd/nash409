import jsPDF from 'jspdf';
import { formatBDT } from '@/lib/currency';

export interface RentReceiptData {
  receiptNumber: string;
  issuedOn: string;
  building: {
    name: string;
    address: string | null;
    ward: string | null;
    thana: string | null;
    district: string | null;
    rajukApprovalNumber: string | null;
    occupancyCertNumber: string | null;
  };
  flatNumber: string;
  tenantName: string;
  month: string;
  year: number;
  invoiceType: string;
  amount: number;
  dueDate: string;
  paidDate: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  description: string | null;
  committeeLabel: string;
}

const PAGE_MARGIN = 48;

const formatLocaleDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const addressLine = (b: RentReceiptData['building']): string => {
  const parts = [b.address, b.ward, b.thana, b.district].filter((v): v is string => !!v && v.trim().length > 0);
  return parts.join(', ');
};

export const buildRentReceiptPdf = (data: RentReceiptData): jsPDF => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  // Building header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(data.building.name, PAGE_MARGIN, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const addr = addressLine(data.building);
  if (addr) {
    doc.text(addr, PAGE_MARGIN, y);
    y += 14;
  }
  const certs = [
    data.building.rajukApprovalNumber ? `RAJUK: ${data.building.rajukApprovalNumber}` : null,
    data.building.occupancyCertNumber ? `Occupancy Cert: ${data.building.occupancyCertNumber}` : null,
  ].filter((v): v is string => !!v);
  if (certs.length) {
    doc.setTextColor(90);
    doc.text(certs.join('  |  '), PAGE_MARGIN, y);
    doc.setTextColor(0);
    y += 14;
  }

  // Horizontal rule
  y += 6;
  doc.setDrawColor(200);
  doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
  y += 24;

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Rent Payment Receipt', pageWidth / 2, y, { align: 'center' });
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Receipt No. ${data.receiptNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 14;
  doc.text(`Issued on ${formatLocaleDate(data.issuedOn)}`, pageWidth / 2, y, { align: 'center' });
  y += 28;

  // Details table
  const rows: Array<[string, string]> = [
    ['Tenant', data.tenantName],
    ['Flat', data.flatNumber],
    ['Period', `${data.month} ${data.year}`],
    ['Type', data.invoiceType.replace(/_/g, ' ')],
    ['Amount', formatBDT(data.amount)],
    ['Due date', formatLocaleDate(data.dueDate)],
    ['Paid on', formatLocaleDate(data.paidDate)],
  ];
  if (data.paymentMethod) rows.push(['Payment method', data.paymentMethod]);
  if (data.paymentReference) rows.push(['Reference', data.paymentReference]);

  doc.setFontSize(11);
  const labelX = PAGE_MARGIN;
  const valueX = PAGE_MARGIN + 130;
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, labelX, y);
    doc.setFont('helvetica', 'normal');
    // Wrap long values (e.g. tenant names)
    const wrapped = doc.splitTextToSize(value, contentWidth - 130);
    doc.text(wrapped, valueX, y);
    y += 18 + Math.max(0, (wrapped.length - 1) * 14);
  }

  // Description
  if (data.description && data.description.trim().length > 0) {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', PAGE_MARGIN, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    const desc = doc.splitTextToSize(data.description, contentWidth);
    doc.text(desc, PAGE_MARGIN, y);
    y += desc.length * 14;
  }

  // Signature block
  y = Math.max(y + 40, doc.internal.pageSize.getHeight() - 160);
  doc.setDrawColor(120);
  doc.line(PAGE_MARGIN, y, PAGE_MARGIN + 180, y);
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(data.committeeLabel, PAGE_MARGIN, y + 14);
  doc.setTextColor(0);

  // Footer disclaimer
  const footerY = doc.internal.pageSize.getHeight() - 56;
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(
    'This is a computer-generated receipt. A digital record is retained in the system.',
    PAGE_MARGIN,
    footerY,
  );
  doc.text(
    `Issued under the Premises Rent Control Act, 1991 via NASH-MS.`,
    PAGE_MARGIN,
    footerY + 12,
  );
  doc.setTextColor(0);

  return doc;
};

export const downloadRentReceipt = (data: RentReceiptData): void => {
  const doc = buildRentReceiptPdf(data);
  const safeFlat = data.flatNumber.replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `receipt-${data.receiptNumber}-${safeFlat}.pdf`;
  doc.save(filename);
};
