import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBuilding } from '@/contexts/BuildingContext';
import {
  usePaymentIntents,
  useApprovePaymentIntent,
  useRejectPaymentIntent,
  type PaymentIntent,
} from '@/hooks/usePaymentIntents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, CheckCircle2, X, Wallet, Clock, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatBDT } from '@/lib/currency';

const methodLabel = (method: string): string => {
  const map: Record<string, string> = {
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
    bank: 'Bank',
    cash: 'Cash',
    cheque: 'Cheque',
    other: 'Other',
  };
  return map[method] ?? method;
};

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PaymentApprovals = () => {
  const { language } = useLanguage();
  const { currentRoles } = useBuilding();
  const canManage = currentRoles.includes('committee') || currentRoles.includes('manager');

  const pending = usePaymentIntents('pending');
  const approved = usePaymentIntents('approved');
  const rejected = usePaymentIntents('rejected');
  const approve = useApprovePaymentIntent();
  const reject = useRejectPaymentIntent();

  const [rejectTarget, setRejectTarget] = useState<PaymentIntent | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const t = {
    title: language === 'bn' ? 'পেমেন্ট অনুমোদন' : 'Payment approvals',
    subtitle:
      language === 'bn'
        ? 'ভাড়াটিয়া/মালিকদের জমা দেওয়া পেমেন্ট যাচাই করুন'
        : 'Review tenant/owner-submitted payments',
    pending: language === 'bn' ? 'অপেক্ষমান' : 'Pending',
    approved: language === 'bn' ? 'অনুমোদিত' : 'Approved',
    rejected: language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected',
    when: language === 'bn' ? 'সময়' : 'When',
    flat: language === 'bn' ? 'ফ্ল্যাট' : 'Flat',
    period: language === 'bn' ? 'সময়কাল' : 'Period',
    amount: language === 'bn' ? 'পরিমাণ' : 'Amount',
    method: language === 'bn' ? 'পদ্ধতি' : 'Method',
    reference: language === 'bn' ? 'রেফারেন্স' : 'Reference',
    actions: language === 'bn' ? 'কার্যক্রম' : 'Actions',
    approve: language === 'bn' ? 'অনুমোদন' : 'Approve',
    reject: language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject',
    noPending: language === 'bn' ? 'কোনো অপেক্ষমান পেমেন্ট নেই' : 'No pending payments',
    rejectTitle: language === 'bn' ? 'পেমেন্ট প্রত্যাখ্যান' : 'Reject payment',
    rejectReasonLabel: language === 'bn' ? 'কারণ' : 'Reason',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    confirm: language === 'bn' ? 'নিশ্চিত' : 'Confirm',
    error: language === 'bn' ? 'ত্রুটি' : 'Error',
    approvedToast: language === 'bn' ? 'পেমেন্ট অনুমোদিত' : 'Payment approved',
    rejectedToast: language === 'bn' ? 'পেমেন্ট প্রত্যাখ্যাত' : 'Payment rejected',
  };

  if (!canManage) return <Navigate to="/dashboard" replace />;

  const renderRows = (rows: PaymentIntent[], showActions: boolean) => {
    if (rows.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-8">{t.noPending}</p>
      );
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.when}</TableHead>
              <TableHead>{t.flat}</TableHead>
              <TableHead>{t.period}</TableHead>
              <TableHead className="text-right">{t.amount}</TableHead>
              <TableHead>{t.method}</TableHead>
              <TableHead>{t.reference}</TableHead>
              {showActions && <TableHead className="text-right">{t.actions}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">{formatDateTime(r.created_at)}</TableCell>
                <TableCell>{r.invoices?.flats?.flat_number ?? '—'}</TableCell>
                <TableCell className="text-sm">
                  {r.invoices?.month} {r.invoices?.year}
                </TableCell>
                <TableCell className="text-right font-medium">{formatBDT(r.amount)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{methodLabel(r.method)}</Badge>
                </TableCell>
                <TableCell className="text-xs font-mono">{r.reference ?? '—'}</TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await approve.mutateAsync(r.id);
                            toast({ title: t.approvedToast });
                          } catch (err) {
                            toast({
                              title: t.error,
                              description: err instanceof Error ? err.message : String(err),
                              variant: 'destructive',
                            });
                          }
                        }}
                        disabled={approve.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          setRejectTarget(r);
                          setRejectReason('');
                        }}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <MainLayout>
      <Header title={t.title} subtitle={t.subtitle} />
      <div className="p-4 lg:p-6 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending" className="gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.pending}
                  {pending.data && pending.data.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {pending.data.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.approved}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-1">
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.rejected}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">
                {pending.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  renderRows(pending.data ?? [], true)
                )}
              </TabsContent>
              <TabsContent value="approved" className="mt-4">
                {approved.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  renderRows(approved.data ?? [], false)
                )}
              </TabsContent>
              <TabsContent value="rejected" className="mt-4">
                {rejected.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  renderRows(rejected.data ?? [], false)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(v) => {
          if (!v) setRejectTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rejectTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm">{t.rejectReasonLabel}</label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || reject.isPending}
              onClick={async () => {
                if (!rejectTarget) return;
                try {
                  await reject.mutateAsync({ intentId: rejectTarget.id, reason: rejectReason.trim() });
                  toast({ title: t.rejectedToast });
                  setRejectTarget(null);
                } catch (err) {
                  toast({
                    title: t.error,
                    description: err instanceof Error ? err.message : String(err),
                    variant: 'destructive',
                  });
                }
              }}
            >
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default PaymentApprovals;
