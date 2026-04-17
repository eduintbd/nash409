import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { downloadRentReceipt, type RentReceiptData } from '@/lib/pdfReceipt';

interface FetchReceiptInput {
  invoiceId: string;
  committeeLabel?: string;
}

const buildReceiptNumber = (invoiceId: string, paidDate: string | null): string => {
  const shortId = invoiceId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const year = paidDate ? new Date(paidDate).getFullYear() : new Date().getFullYear();
  return `R-${year}-${shortId}`;
};

export const useDownloadRentReceipt = () => {
  return useMutation({
    mutationFn: async ({ invoiceId, committeeLabel }: FetchReceiptInput) => {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(
          `
          id, month, year, amount, due_date, paid_date, description, invoice_type, status, building_id, flat_id,
          flats:flat_id ( flat_number )
        `,
        )
        .eq('id', invoiceId)
        .single();
      if (invoiceError) throw invoiceError;
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status !== 'paid') {
        throw new Error('Receipt available only for paid invoices');
      }

      const [{ data: building, error: buildingError }, { data: tenant }, { data: payment }] =
        await Promise.all([
          supabase
            .from('buildings')
            .select('name, address, ward, thana, district, rajuk_approval_number, occupancy_cert_number')
            .eq('id', invoice.building_id ?? '')
            .single(),
          supabase
            .from('tenants')
            .select('name')
            .eq('flat_id', invoice.flat_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('payments')
            .select('method, reference')
            .eq('invoice_id', invoice.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (buildingError) throw buildingError;
      if (!building) throw new Error('Building record missing');

      const flatNumber =
        (invoice.flats as { flat_number?: string } | null)?.flat_number ?? 'N/A';
      const paidDate = invoice.paid_date ?? new Date().toISOString().slice(0, 10);

      const data: RentReceiptData = {
        receiptNumber: buildReceiptNumber(invoice.id, paidDate),
        issuedOn: new Date().toISOString(),
        building: {
          name: building.name,
          address: building.address,
          ward: building.ward,
          thana: building.thana,
          district: building.district,
          rajukApprovalNumber: building.rajuk_approval_number,
          occupancyCertNumber: building.occupancy_cert_number,
        },
        flatNumber,
        tenantName: tenant?.name ?? 'Tenant',
        month: invoice.month,
        year: invoice.year,
        invoiceType: invoice.invoice_type,
        amount: Number(invoice.amount),
        dueDate: invoice.due_date,
        paidDate,
        paymentMethod: payment?.method ?? null,
        paymentReference: payment?.reference ?? null,
        description: invoice.description,
        committeeLabel: committeeLabel ?? 'Committee representative',
      };

      downloadRentReceipt(data);
      return data;
    },
  });
};
