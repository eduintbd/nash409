import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBuilding } from '@/contexts/BuildingContext';
import {
  useComplianceDocuments,
  useCreateComplianceDocument,
  useDeleteComplianceDocument,
  getExpiryStatus,
  type ComplianceDocumentType,
  type ExpiryStatus,
} from '@/hooks/useComplianceDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShieldCheck, Plus, Trash2, AlertCircle, AlertTriangle, CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const docTypeLabel = (type: ComplianceDocumentType, language: string): string => {
  const en: Record<ComplianceDocumentType, string> = {
    rajuk_approval: 'RAJUK approval',
    occupancy_cert: 'Occupancy certificate',
    fire_noc: 'Fire NOC',
    lift_safety: 'Lift safety',
    extinguisher: 'Fire extinguisher',
    earthquake_drill: 'Earthquake drill',
    boiler: 'Boiler',
    lightning_arrester: 'Lightning arrester',
    electrical_safety: 'Electrical safety',
    other: 'Other',
  };
  const bn: Record<ComplianceDocumentType, string> = {
    rajuk_approval: 'রাজউক অনুমোদন',
    occupancy_cert: 'অকুপেন্সি সনদ',
    fire_noc: 'ফায়ার NOC',
    lift_safety: 'লিফট নিরাপত্তা',
    extinguisher: 'অগ্নিনির্বাপক',
    earthquake_drill: 'ভূমিকম্প মহড়া',
    boiler: 'বয়লার',
    lightning_arrester: 'বজ্র নিরোধক',
    electrical_safety: 'বৈদ্যুতিক নিরাপত্তা',
    other: 'অন্যান্য',
  };
  return (language === 'bn' ? bn : en)[type];
};

const statusClasses: Record<ExpiryStatus, string> = {
  expired: 'bg-destructive/10 text-destructive border-destructive/20',
  expiring_soon: 'bg-warning/10 text-warning border-warning/20',
  valid: 'bg-success/10 text-success border-success/20',
  no_expiry: 'bg-muted text-muted-foreground',
};

const statusIcon = (s: ExpiryStatus) => {
  if (s === 'expired') return <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />;
  if (s === 'expiring_soon') return <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />;
  if (s === 'valid') return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />;
  return <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const docSchema = z.object({
  document_type: z.enum([
    'rajuk_approval', 'occupancy_cert', 'fire_noc', 'lift_safety', 'extinguisher',
    'earthquake_drill', 'boiler', 'lightning_arrester', 'electrical_safety', 'other',
  ]),
  title: z.string().trim().min(1).max(150),
  issuing_authority: z.string().trim().max(150).optional(),
  reference_number: z.string().trim().max(100).optional(),
  issued_on: z.string().optional(),
  expires_on: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const Compliance = () => {
  const { language } = useLanguage();
  const { currentRoles } = useBuilding();
  const canManage = currentRoles.includes('committee') || currentRoles.includes('manager');

  const docs = useComplianceDocuments();
  const createDoc = useCreateComplianceDocument();
  const deleteDoc = useDeleteComplianceDocument();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    document_type: 'rajuk_approval' as ComplianceDocumentType,
    title: '',
    issuing_authority: '',
    reference_number: '',
    issued_on: '',
    expires_on: '',
    notes: '',
  });

  const t = {
    title: language === 'bn' ? 'কমপ্লায়েন্স' : 'Compliance',
    subtitle:
      language === 'bn'
        ? 'সনদ ও অনুমতিপত্রের মেয়াদ ট্র্যাক করুন'
        : 'Track certificates and permits with expiry',
    add: language === 'bn' ? 'যুক্ত করুন' : 'Add document',
    type: language === 'bn' ? 'ধরন' : 'Type',
    docTitle: language === 'bn' ? 'শিরোনাম' : 'Title',
    authority: language === 'bn' ? 'ইস্যুকারী কর্তৃপক্ষ' : 'Issuing authority',
    refNo: language === 'bn' ? 'রেফারেন্স নম্বর' : 'Reference number',
    issued: language === 'bn' ? 'ইস্যু তারিখ' : 'Issued on',
    expires: language === 'bn' ? 'মেয়াদ' : 'Expires on',
    notes: language === 'bn' ? 'নোট' : 'Notes',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    save: language === 'bn' ? 'সংরক্ষণ' : 'Save',
    status: language === 'bn' ? 'স্থিতি' : 'Status',
    expired: language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Expired',
    expiringSoon: language === 'bn' ? 'শীঘ্রই মেয়াদ শেষ' : 'Expiring soon',
    valid: language === 'bn' ? 'সক্রিয়' : 'Valid',
    noExpiry: language === 'bn' ? 'মেয়াদ নেই' : 'No expiry',
    actions: language === 'bn' ? 'কার্যক্রম' : 'Actions',
    none: language === 'bn' ? 'কোনো নথি যুক্ত করা হয়নি' : 'No documents yet',
    error: language === 'bn' ? 'ত্রুটি' : 'Error',
    savedToast: language === 'bn' ? 'নথি যুক্ত হয়েছে' : 'Document added',
    deletedToast: language === 'bn' ? 'নথি মুছে ফেলা হয়েছে' : 'Document deleted',
    summary: {
      expired: language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Expired',
      expiring: language === 'bn' ? 'শীঘ্রই শেষ' : 'Expiring',
      valid: language === 'bn' ? 'সক্রিয়' : 'Valid',
    },
  };

  const statusLabel = (s: ExpiryStatus) => {
    switch (s) {
      case 'expired':
        return t.expired;
      case 'expiring_soon':
        return t.expiringSoon;
      case 'valid':
        return t.valid;
      default:
        return t.noExpiry;
    }
  };

  const summary = useMemo(() => {
    const list = docs.data ?? [];
    return list.reduce(
      (acc, d) => {
        const s = getExpiryStatus(d.expires_on);
        if (s === 'expired') acc.expired += 1;
        else if (s === 'expiring_soon') acc.expiring += 1;
        else if (s === 'valid') acc.valid += 1;
        return acc;
      },
      { expired: 0, expiring: 0, valid: 0 },
    );
  }, [docs.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = docSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: t.error,
        description: parsed.error.issues[0]?.message ?? 'Invalid input',
        variant: 'destructive',
      });
      return;
    }
    try {
      await createDoc.mutateAsync(parsed.data);
      toast({ title: t.savedToast });
      setFormOpen(false);
      setForm({
        document_type: 'rajuk_approval',
        title: '',
        issuing_authority: '',
        reference_number: '',
        issued_on: '',
        expires_on: '',
        notes: '',
      });
    } catch (err) {
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout>
      <Header title={t.title} subtitle={t.subtitle} />
      <div className="p-4 lg:p-6 space-y-4">
        {canManage && (
          <div className="flex justify-end">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t.add}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.summary.expired}</p>
              <p className="text-lg font-semibold text-destructive">{summary.expired}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.summary.expiring}</p>
              <p className="text-lg font-semibold text-warning">{summary.expiring}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.summary.valid}</p>
              <p className="text-lg font-semibold text-success">{summary.valid}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {docs.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !docs.data || docs.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t.none}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.type}</TableHead>
                      <TableHead>{t.docTitle}</TableHead>
                      <TableHead>{t.authority}</TableHead>
                      <TableHead>{t.issued}</TableHead>
                      <TableHead>{t.expires}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      {canManage && <TableHead className="text-right">{t.actions}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.data.map((d) => {
                      const s = getExpiryStatus(d.expires_on);
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="text-sm">
                            {docTypeLabel(d.document_type, language)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{d.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {d.issuing_authority ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(d.issued_on)}</TableCell>
                          <TableCell className="text-sm">{formatDate(d.expires_on)}</TableCell>
                          <TableCell>
                            <Badge className={statusClasses[s]}>
                              <span className="flex items-center gap-1">
                                {statusIcon(s)}
                                {statusLabel(s)}
                              </span>
                            </Badge>
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await deleteDoc.mutateAsync(d.id);
                                    toast({ title: t.deletedToast });
                                  } catch (err) {
                                    toast({
                                      title: t.error,
                                      description: err instanceof Error ? err.message : String(err),
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.add}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="document_type">{t.type}</Label>
              <Select
                value={form.document_type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, document_type: v as ComplianceDocumentType }))
                }
              >
                <SelectTrigger id="document_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rajuk_approval">{docTypeLabel('rajuk_approval', language)}</SelectItem>
                  <SelectItem value="occupancy_cert">{docTypeLabel('occupancy_cert', language)}</SelectItem>
                  <SelectItem value="fire_noc">{docTypeLabel('fire_noc', language)}</SelectItem>
                  <SelectItem value="lift_safety">{docTypeLabel('lift_safety', language)}</SelectItem>
                  <SelectItem value="extinguisher">{docTypeLabel('extinguisher', language)}</SelectItem>
                  <SelectItem value="earthquake_drill">{docTypeLabel('earthquake_drill', language)}</SelectItem>
                  <SelectItem value="boiler">{docTypeLabel('boiler', language)}</SelectItem>
                  <SelectItem value="lightning_arrester">{docTypeLabel('lightning_arrester', language)}</SelectItem>
                  <SelectItem value="electrical_safety">{docTypeLabel('electrical_safety', language)}</SelectItem>
                  <SelectItem value="other">{docTypeLabel('other', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">{t.docTitle}</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="authority">{t.authority}</Label>
              <Input
                id="authority"
                value={form.issuing_authority}
                onChange={(e) => setForm((f) => ({ ...f, issuing_authority: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="reference_number">{t.refNo}</Label>
              <Input
                id="reference_number"
                value={form.reference_number}
                onChange={(e) => setForm((f) => ({ ...f, reference_number: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="issued_on">{t.issued}</Label>
                <Input
                  id="issued_on"
                  type="date"
                  value={form.issued_on}
                  onChange={(e) => setForm((f) => ({ ...f, issued_on: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="expires_on">{t.expires}</Label>
                <Input
                  id="expires_on"
                  type="date"
                  value={form.expires_on}
                  onChange={(e) => setForm((f) => ({ ...f, expires_on: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">{t.notes}</Label>
              <Textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={createDoc.isPending}>
                {createDoc.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Compliance;
