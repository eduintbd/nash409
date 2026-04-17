import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBuilding } from '@/contexts/BuildingContext';

export interface LedgerLine {
  date: string; // ISO date
  kind: 'invoice' | 'payment';
  invoiceId: string | null;
  paymentId: string | null;
  description: string;
  invoiceType: string | null;
  status: 'paid' | 'unpaid' | 'overdue' | null;
  method: string | null;
  reference: string | null;
  debit: number; // amount owed — invoice
  credit: number; // amount paid
  balance: number; // running
}

export interface FlatLedgerSummary {
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  nextDueDate: string | null;
  nextDueAmount: number;
  overdueCount: number;
}

export interface FlatLedger {
  flatId: string;
  flatNumber: string | null;
  buildingName: string | null;
  tenantName: string | null;
  ownerName: string | null;
  lines: LedgerLine[];
  summary: FlatLedgerSummary;
}

const toISODate = (d: string | null): string => {
  if (!d) return '';
  // Invoices store due_date / paid_date as date (YYYY-MM-DD).
  // Payments store date as date too. Return ISO midnight for consistent sort.
  return new Date(`${d}T00:00:00Z`).toISOString();
};

export const useFlatLedger = (flatId?: string) => {
  const { currentBuildingId } = useBuilding();

  return useQuery({
    queryKey: ['flat-ledger', currentBuildingId, flatId],
    enabled: !!flatId && !!currentBuildingId,
    queryFn: async (): Promise<FlatLedger> => {
      if (!flatId) throw new Error('flatId is required');

      const [flatRes, invoicesRes, paymentsRes, tenantRes, ownerRes] = await Promise.all([
        supabase
          .from('flats')
          .select('id, flat_number, building_name')
          .eq('id', flatId)
          .single(),
        supabase
          .from('invoices')
          .select('id, month, year, amount, due_date, paid_date, status, description, invoice_type')
          .eq('flat_id', flatId)
          .order('due_date', { ascending: true }),
        supabase
          .from('payments')
          .select('id, amount, date, method, reference, invoice_id')
          .eq('flat_id', flatId)
          .order('date', { ascending: true }),
        supabase
          .from('tenants')
          .select('name')
          .eq('flat_id', flatId)
          .order('start_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('owners')
          .select('name')
          .eq('flat_id', flatId)
          .limit(1)
          .maybeSingle(),
      ]);

      if (flatRes.error) throw flatRes.error;
      if (invoicesRes.error) throw invoicesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const invoices = invoicesRes.data ?? [];
      const payments = paymentsRes.data ?? [];

      type Event = { at: string } & (
        | { kind: 'invoice'; inv: typeof invoices[number] }
        | { kind: 'payment'; pay: typeof payments[number] }
      );

      const events: Event[] = [
        ...invoices.map((inv) => ({ at: toISODate(inv.due_date), kind: 'invoice' as const, inv })),
        ...payments.map((pay) => ({ at: toISODate(pay.date), kind: 'payment' as const, pay })),
      ].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));

      let balance = 0;
      const lines: LedgerLine[] = events.map((e) => {
        if (e.kind === 'invoice') {
          const amount = Number(e.inv.amount);
          balance += amount;
          return {
            date: e.inv.due_date,
            kind: 'invoice',
            invoiceId: e.inv.id,
            paymentId: null,
            description:
              e.inv.description ??
              `${e.inv.invoice_type.replace(/_/g, ' ')} — ${e.inv.month} ${e.inv.year}`,
            invoiceType: e.inv.invoice_type,
            status: e.inv.status,
            method: null,
            reference: null,
            debit: amount,
            credit: 0,
            balance,
          };
        }
        const amount = Number(e.pay.amount);
        balance -= amount;
        return {
          date: e.pay.date,
          kind: 'payment',
          invoiceId: e.pay.invoice_id,
          paymentId: e.pay.id,
          description: e.pay.reference
            ? `Payment — ${e.pay.reference}`
            : 'Payment received',
          invoiceType: null,
          status: null,
          method: e.pay.method,
          reference: e.pay.reference,
          debit: 0,
          credit: amount,
          balance,
        };
      });

      const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
      const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
      const outstandingInvoices = invoices.filter((i) => i.status !== 'paid');
      const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
      const nextDue = outstandingInvoices
        .slice()
        .sort((a, b) => (a.due_date < b.due_date ? -1 : 1))[0];

      return {
        flatId,
        flatNumber: flatRes.data?.flat_number ?? null,
        buildingName: flatRes.data?.building_name ?? null,
        tenantName: tenantRes.data?.name ?? null,
        ownerName: ownerRes.data?.name ?? null,
        lines,
        summary: {
          totalInvoiced,
          totalPaid,
          outstanding: totalInvoiced - totalPaid,
          nextDueDate: nextDue?.due_date ?? null,
          nextDueAmount: nextDue ? Number(nextDue.amount) : 0,
          overdueCount,
        },
      };
    },
  });
};
