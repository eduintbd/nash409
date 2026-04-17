import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useGeneratorRuns,
  useCreateGeneratorRun,
  useAllocateGeneratorRun,
  useDeleteGeneratorRun,
  useGeneratorRunAllocations,
  type GeneratorRun,
  type GeneratorRunReason,
} from '@/hooks/useGeneratorRuns';
import { useBuilding } from '@/contexts/BuildingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Fuel, Loader2, Plus, Split, Trash2 } from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const runSchema = z
  .object({
    started_at: z.string().min(1),
    ended_at: z.string().min(1),
    fuel_liters: z.coerce.number().positive(),
    fuel_price_per_liter: z.coerce.number().positive(),
    reason: z.enum(['load_shedding', 'scheduled_test', 'maintenance', 'outage', 'other']),
    notes: z.string().max(500).optional(),
  })
  .refine((v) => new Date(v.ended_at) > new Date(v.started_at), {
    message: 'End time must be after start time',
    path: ['ended_at'],
  });

const hoursBetween = (startISO: string, endISO: string): number => {
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return ms / 3_600_000;
};

const formatDuration = (startISO: string, endISO: string): string => {
  const h = hoursBetween(startISO, endISO);
  if (h === 0) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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

const reasonLabel = (r: GeneratorRunReason, language: string): string => {
  const en: Record<GeneratorRunReason, string> = {
    load_shedding: 'Load shedding',
    scheduled_test: 'Scheduled test',
    maintenance: 'Maintenance',
    outage: 'Outage',
    other: 'Other',
  };
  const bn: Record<GeneratorRunReason, string> = {
    load_shedding: 'লোডশেডিং',
    scheduled_test: 'নিয়মিত পরীক্ষা',
    maintenance: 'রক্ষণাবেক্ষণ',
    outage: 'বিদ্যুৎ বিভ্রাট',
    other: 'অন্যান্য',
  };
  return (language === 'bn' ? bn : en)[r];
};

const AllocateDialog = ({
  run,
  open,
  onOpenChange,
}: {
  run: GeneratorRun | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const { language } = useLanguage();
  const allocate = useAllocateGeneratorRun();
  const allocations = useGeneratorRunAllocations(run?.id);
  const [method, setMethod] = useState<'equal' | 'size_weighted'>('equal');
  const [dueDate, setDueDate] = useState<string>('');

  const totalCost = run ? run.fuel_liters * run.fuel_price_per_liter : 0;

  const t = {
    title: language === 'bn' ? 'খরচ বণ্টন করুন' : 'Allocate cost',
    description:
      language === 'bn'
        ? 'এই রানটির জ্বালানী খরচ কীভাবে ফ্ল্যাটগুলোর মধ্যে ভাগ করা হবে বেছে নিন।'
        : 'Choose how this run\u2019s fuel cost is split across the flats.',
    totalCost: language === 'bn' ? 'মোট খরচ' : 'Total cost',
    method: language === 'bn' ? 'পদ্ধতি' : 'Method',
    equal: language === 'bn' ? 'সমান ভাগ' : 'Equal split',
    sizeWeighted: language === 'bn' ? 'আয়তন অনুযায়ী' : 'Size-weighted',
    dueDate: language === 'bn' ? 'পরিশোধের শেষ তারিখ' : 'Invoice due date',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    allocate: language === 'bn' ? 'বণ্টন করুন' : 'Allocate',
    allocatedNote:
      language === 'bn'
        ? 'এই রানটি ইতোমধ্যে বণ্টিত হয়েছে।'
        : 'This run has already been allocated.',
    flat: language === 'bn' ? 'ফ্ল্যাট' : 'Flat',
    share: language === 'bn' ? 'ভাগের পরিমাণ' : 'Share',
    invoice: language === 'bn' ? 'ইনভয়েস' : 'Invoice',
    created: language === 'bn' ? 'তৈরি হয়েছে' : 'created',
    error: language === 'bn' ? 'ত্রুটি' : 'Error',
  };

  const handleSubmit = async () => {
    if (!run) return;
    try {
      await allocate.mutateAsync({
        runId: run.id,
        method,
        dueDate: dueDate || undefined,
      });
      toast({ title: t.allocate });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        {run && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.totalCost}</span>
                <span className="font-semibold">{formatBDT(totalCost)}</span>
              </div>
            </div>

            {run.is_allocated ? (
              <>
                <p className="text-sm text-muted-foreground">{t.allocatedNote}</p>
                {allocations.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.flat}</TableHead>
                          <TableHead className="text-right">{t.share}</TableHead>
                          <TableHead>{t.invoice}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(allocations.data ?? []).map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>{a.flats?.flat_number ?? '—'}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatBDT(a.share_amount)}
                            </TableCell>
                            <TableCell>
                              {a.invoice_id ? (
                                <Badge variant="outline" className="text-xs">
                                  {t.created}
                                </Badge>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <Label>{t.method}</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as 'equal' | 'size_weighted')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">{t.equal}</SelectItem>
                      <SelectItem value="size_weighted">{t.sizeWeighted}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_date">{t.dueDate}</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          {run && !run.is_allocated && (
            <Button onClick={handleSubmit} disabled={allocate.isPending}>
              {allocate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.allocate}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GeneratorRunsPage = () => {
  const { language } = useLanguage();
  const { currentRoles } = useBuilding();
  const canManage = currentRoles.includes('committee') || currentRoles.includes('manager');

  const { data: runs, isLoading } = useGeneratorRuns();
  const createRun = useCreateGeneratorRun();
  const deleteRun = useDeleteGeneratorRun();

  const [formOpen, setFormOpen] = useState(false);
  const [allocateRun, setAllocateRun] = useState<GeneratorRun | null>(null);

  const now = new Date();
  const nowLocalIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [form, setForm] = useState({
    started_at: nowLocalIso,
    ended_at: nowLocalIso,
    fuel_liters: '',
    fuel_price_per_liter: '',
    reason: 'load_shedding' as GeneratorRunReason,
    notes: '',
  });

  const t = {
    title: language === 'bn' ? 'জেনারেটর রান' : 'Generator runs',
    subtitle:
      language === 'bn'
        ? 'জ্বালানী খরচ ট্র্যাক করুন এবং ফ্ল্যাটগুলোর মধ্যে ভাগ করুন'
        : 'Track fuel costs and split them across flats',
    logRun: language === 'bn' ? 'রান লগ করুন' : 'Log run',
    noRuns: language === 'bn' ? 'এখনো কোনো রান লগ হয়নি' : 'No runs logged yet',
    reason: language === 'bn' ? 'কারণ' : 'Reason',
    period: language === 'bn' ? 'সময়কাল' : 'Period',
    duration: language === 'bn' ? 'সময়কাল' : 'Duration',
    fuel: language === 'bn' ? 'জ্বালানী (লিটার)' : 'Fuel (L)',
    cost: language === 'bn' ? 'খরচ' : 'Cost',
    status: language === 'bn' ? 'স্থিতি' : 'Status',
    allocated: language === 'bn' ? 'বণ্টিত' : 'Allocated',
    pending: language === 'bn' ? 'অপেক্ষমান' : 'Pending',
    actions: language === 'bn' ? 'কার্যক্রম' : 'Actions',
    allocate: language === 'bn' ? 'বণ্টন' : 'Allocate',
    view: language === 'bn' ? 'দেখুন' : 'View',
    delete: language === 'bn' ? 'মুছুন' : 'Delete',
    formTitle: language === 'bn' ? 'নতুন রান লগ করুন' : 'Log a new run',
    start: language === 'bn' ? 'শুরু' : 'Start',
    end: language === 'bn' ? 'শেষ' : 'End',
    fuelLiters: language === 'bn' ? 'জ্বালানী (লিটার)' : 'Fuel (litres)',
    fuelPrice: language === 'bn' ? 'দর (৳/লিটার)' : 'Price (BDT/litre)',
    notes: language === 'bn' ? 'নোট' : 'Notes',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    save: language === 'bn' ? 'সংরক্ষণ' : 'Save',
    error: language === 'bn' ? 'ত্রুটি' : 'Error',
    deletedToast: language === 'bn' ? 'রান মুছে ফেলা হয়েছে' : 'Run deleted',
    createdToast: language === 'bn' ? 'রান লগ হয়েছে' : 'Run logged',
    totalCost: language === 'bn' ? 'মোট খরচ' : 'Total cost',
    totalRuns: language === 'bn' ? 'মোট রান' : 'Runs',
    totalHours: language === 'bn' ? 'মোট ঘণ্টা' : 'Total hours',
  };

  const summary = useMemo(() => {
    const list = runs ?? [];
    const totalCost = list.reduce((s, r) => s + r.fuel_liters * r.fuel_price_per_liter, 0);
    const totalHours = list.reduce((s, r) => s + hoursBetween(r.started_at, r.ended_at), 0);
    return { totalCost, totalHours, count: list.length };
  }, [runs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = runSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: t.error,
        description: parsed.error.issues[0]?.message ?? 'Invalid input',
        variant: 'destructive',
      });
      return;
    }
    try {
      await createRun.mutateAsync({
        started_at: new Date(parsed.data.started_at).toISOString(),
        ended_at: new Date(parsed.data.ended_at).toISOString(),
        fuel_liters: parsed.data.fuel_liters,
        fuel_price_per_liter: parsed.data.fuel_price_per_liter,
        reason: parsed.data.reason,
        notes: parsed.data.notes?.trim() || null,
      });
      toast({ title: t.createdToast });
      setFormOpen(false);
      setForm((f) => ({ ...f, fuel_liters: '', fuel_price_per_liter: '', notes: '' }));
    } catch (err) {
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRun.mutateAsync(id);
      toast({ title: t.deletedToast });
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
      <div className="p-4 lg:p-6 space-y-6">
        {canManage && (
          <div className="flex justify-end">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t.logRun}
            </Button>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.totalRuns}</p>
              <p className="text-lg font-semibold">{summary.count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.totalHours}</p>
              <p className="text-lg font-semibold">{summary.totalHours.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.totalCost}</p>
              <p className="text-lg font-semibold">{formatBDT(summary.totalCost)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Fuel className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !runs || runs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t.noRuns}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.period}</TableHead>
                      <TableHead>{t.reason}</TableHead>
                      <TableHead className="text-right">{t.duration}</TableHead>
                      <TableHead className="text-right">{t.fuel}</TableHead>
                      <TableHead className="text-right">{t.cost}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead className="text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">
                          <div>{formatDateTime(r.started_at)}</div>
                          <div className="text-xs text-muted-foreground">
                            → {formatDateTime(r.ended_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{reasonLabel(r.reason, language)}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatDuration(r.started_at, r.ended_at)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {r.fuel_liters.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {formatBDT(r.fuel_liters * r.fuel_price_per_liter)}
                        </TableCell>
                        <TableCell>
                          {r.is_allocated ? (
                            <Badge className="bg-success/10 text-success border-success/20">
                              {t.allocated}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              {t.pending}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAllocateRun(r)}
                              title={r.is_allocated ? t.view : t.allocate}
                            >
                              <Split className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            {canManage && !r.is_allocated && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(r.id)}
                                className="text-destructive hover:text-destructive"
                                title={t.delete}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log run form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.formTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="started_at">{t.start}</Label>
                <Input
                  id="started_at"
                  type="datetime-local"
                  required
                  value={form.started_at}
                  onChange={(e) => setForm((f) => ({ ...f, started_at: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ended_at">{t.end}</Label>
                <Input
                  id="ended_at"
                  type="datetime-local"
                  required
                  value={form.ended_at}
                  onChange={(e) => setForm((f) => ({ ...f, ended_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fuel_liters">{t.fuelLiters}</Label>
                <Input
                  id="fuel_liters"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.fuel_liters}
                  onChange={(e) => setForm((f) => ({ ...f, fuel_liters: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="fuel_price">{t.fuelPrice}</Label>
                <Input
                  id="fuel_price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.fuel_price_per_liter}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fuel_price_per_liter: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">{t.reason}</Label>
              <Select
                value={form.reason}
                onValueChange={(v) => setForm((f) => ({ ...f, reason: v as GeneratorRunReason }))}
              >
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="load_shedding">{reasonLabel('load_shedding', language)}</SelectItem>
                  <SelectItem value="scheduled_test">{reasonLabel('scheduled_test', language)}</SelectItem>
                  <SelectItem value="maintenance">{reasonLabel('maintenance', language)}</SelectItem>
                  <SelectItem value="outage">{reasonLabel('outage', language)}</SelectItem>
                  <SelectItem value="other">{reasonLabel('other', language)}</SelectItem>
                </SelectContent>
              </Select>
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
              <Button type="submit" disabled={createRun.isPending}>
                {createRun.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AllocateDialog
        run={allocateRun}
        open={!!allocateRun}
        onOpenChange={(v) => !v && setAllocateRun(null)}
      />
    </MainLayout>
  );
};

export default GeneratorRunsPage;
