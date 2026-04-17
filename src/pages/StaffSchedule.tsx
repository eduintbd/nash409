import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBuilding } from '@/contexts/BuildingContext';
import { useEmployees } from '@/hooks/useEmployees';
import {
  useShifts,
  useCreateShift,
  useDeleteShift,
  useRecentAttendance,
  useRecordCheckIn,
  useRecordCheckOut,
  usePayrollPeriods,
  usePayrollEntries,
  useGeneratePayrollPeriod,
  useUpdatePayrollEntry,
  useFinalizePayrollPeriod,
  type PayrollEntry,
} from '@/hooks/useStaffRoster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CalendarClock,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Banknote,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatBDT } from '@/lib/currency';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

const StaffSchedule = () => {
  const { language } = useLanguage();
  const { currentRoles } = useBuilding();
  const canManage = currentRoles.includes('committee') || currentRoles.includes('manager');

  const employees = useEmployees();
  const shifts = useShifts();
  const attendance = useRecentAttendance(50);
  const periods = usePayrollPeriods();
  const createShift = useCreateShift();
  const deleteShift = useDeleteShift();
  const checkIn = useRecordCheckIn();
  const checkOut = useRecordCheckOut();
  const generatePeriod = useGeneratePayrollPeriod();
  const updateEntry = useUpdatePayrollEntry();
  const finalizePeriod = useFinalizePayrollPeriod();

  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [attendanceFormOpen, setAttendanceFormOpen] = useState(false);
  const [checkInEmployee, setCheckInEmployee] = useState<string>('');
  const [shiftForm, setShiftForm] = useState({
    employee_id: '',
    shift_date: new Date().toISOString().slice(0, 10),
    start_time: '21:00',
    end_time: '07:00',
    notes: '',
  });

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
  const entries = usePayrollEntries(activePeriodId ?? undefined);

  const t = {
    title: language === 'bn' ? 'কর্মী' : 'Staff',
    subtitle: language === 'bn' ? 'শিফট, উপস্থিতি, বেতন' : 'Shifts, attendance, payroll',
    shifts: language === 'bn' ? 'শিফট' : 'Shifts',
    attendance: language === 'bn' ? 'উপস্থিতি' : 'Attendance',
    payroll: language === 'bn' ? 'বেতন' : 'Payroll',
    addShift: language === 'bn' ? 'শিফট যোগ করুন' : 'Add shift',
    checkInBtn: language === 'bn' ? 'চেক-ইন' : 'Check in',
    noShifts: language === 'bn' ? 'কোনো শিফট নেই' : 'No shifts scheduled',
    noAttendance: language === 'bn' ? 'কোনো উপস্থিতি লগ নেই' : 'No attendance logs',
    noPeriods: language === 'bn' ? 'কোনো পেরিয়ড তৈরি হয়নি' : 'No payroll periods yet',
    employee: language === 'bn' ? 'কর্মচারী' : 'Employee',
    role: language === 'bn' ? 'ভূমিকা' : 'Role',
    date: language === 'bn' ? 'তারিখ' : 'Date',
    start: language === 'bn' ? 'শুরু' : 'Start',
    end: language === 'bn' ? 'শেষ' : 'End',
    notes: language === 'bn' ? 'নোট' : 'Notes',
    checkInAt: language === 'bn' ? 'চেক-ইন' : 'Check-in',
    checkOutAt: language === 'bn' ? 'চেক-আউট' : 'Check-out',
    actions: language === 'bn' ? 'কার্যক্রম' : 'Actions',
    checkOutBtn: language === 'bn' ? 'চেক-আউট' : 'Check out',
    method: language === 'bn' ? 'পদ্ধতি' : 'Method',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    save: language === 'bn' ? 'সংরক্ষণ' : 'Save',
    month: language === 'bn' ? 'মাস' : 'Month',
    year: language === 'bn' ? 'বছর' : 'Year',
    generate: language === 'bn' ? 'পে-রোল তৈরি' : 'Generate payroll',
    periodStatus: language === 'bn' ? 'স্থিতি' : 'Status',
    draft: language === 'bn' ? 'খসড়া' : 'Draft',
    finalized: language === 'bn' ? 'চূড়ান্ত' : 'Finalized',
    paid: language === 'bn' ? 'পরিশোধিত' : 'Paid',
    finalize: language === 'bn' ? 'চূড়ান্ত করুন' : 'Finalize',
    base: language === 'bn' ? 'মূল বেতন' : 'Base',
    bonuses: language === 'bn' ? 'বোনাস' : 'Bonuses',
    deductions: language === 'bn' ? 'কর্তন' : 'Deductions',
    advance: language === 'bn' ? 'অগ্রিম' : 'Advance',
    net: language === 'bn' ? 'নেট' : 'Net',
    total: language === 'bn' ? 'মোট' : 'Total',
    error: language === 'bn' ? 'ত্রুটি' : 'Error',
    createdToast: language === 'bn' ? 'শিফট যুক্ত হয়েছে' : 'Shift added',
    checkedInToast: language === 'bn' ? 'চেক-ইন লগ হয়েছে' : 'Check-in recorded',
    finalizedToast: language === 'bn' ? 'পেরিয়ড চূড়ান্ত' : 'Period finalized',
    periodSummary: language === 'bn' ? 'পেরিয়ডের সারসংক্ষেপ' : 'Period summary',
    open: language === 'bn' ? 'খুলুন' : 'Open',
  };

  if (!canManage) return <Navigate to="/dashboard" replace />;

  const years = useMemo(() => {
    const curr = new Date().getFullYear();
    return [curr - 1, curr, curr + 1];
  }, []);

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShift.mutateAsync({
        employee_id: shiftForm.employee_id,
        shift_date: shiftForm.shift_date,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        notes: shiftForm.notes || null,
      });
      toast({ title: t.createdToast });
      setShiftFormOpen(false);
      setShiftForm((f) => ({ ...f, employee_id: '', notes: '' }));
    } catch (err) {
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  const handleCheckIn = async () => {
    if (!checkInEmployee) return;
    try {
      await checkIn.mutateAsync({ employee_id: checkInEmployee, method: 'manual' });
      toast({ title: t.checkedInToast });
      setAttendanceFormOpen(false);
      setCheckInEmployee('');
    } catch (err) {
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async () => {
    try {
      const id = await generatePeriod.mutateAsync({ month: selectedMonth, year: selectedYear });
      setActivePeriodId(id);
    } catch (err) {
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  const handleFinalize = async () => {
    if (!activePeriodId) return;
    try {
      await finalizePeriod.mutateAsync(activePeriodId);
      toast({ title: t.finalizedToast });
    } catch (err) {
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  const periodTotal = useMemo(() => {
    return (entries.data ?? []).reduce((sum, e) => sum + e.net_amount, 0);
  }, [entries.data]);

  const openPeriod = (id: string) => setActivePeriodId(id);

  return (
    <MainLayout>
      <Header title={t.title} subtitle={t.subtitle} />
      <div className="p-4 lg:p-6 space-y-4">
        <Tabs defaultValue="shifts">
          <TabsList>
            <TabsTrigger value="shifts" className="gap-1">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              {t.shifts}
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-1">
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              {t.attendance}
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-1">
              <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
              {t.payroll}
            </TabsTrigger>
          </TabsList>

          {/* Shifts */}
          <TabsContent value="shifts" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShiftFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {t.addShift}
              </Button>
            </div>
            <Card>
              <CardContent className="p-4">
                {shifts.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : !shifts.data || shifts.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t.noShifts}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.date}</TableHead>
                          <TableHead>{t.employee}</TableHead>
                          <TableHead>{t.role}</TableHead>
                          <TableHead>{t.start}</TableHead>
                          <TableHead>{t.end}</TableHead>
                          <TableHead>{t.notes}</TableHead>
                          <TableHead className="text-right">&nbsp;</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shifts.data.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>{formatDate(s.shift_date)}</TableCell>
                            <TableCell>{s.employees?.name ?? '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{s.employees?.role ?? '—'}</Badge>
                            </TableCell>
                            <TableCell>{s.start_time.slice(0, 5)}</TableCell>
                            <TableCell>{s.end_time.slice(0, 5)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {s.notes ?? '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteShift.mutate(s.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance */}
          <TabsContent value="attendance" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAttendanceFormOpen(true)}>
                <LogIn className="h-4 w-4 mr-1" />
                {t.checkInBtn}
              </Button>
            </div>
            <Card>
              <CardContent className="p-4">
                {attendance.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : !attendance.data || attendance.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t.noAttendance}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.employee}</TableHead>
                          <TableHead>{t.checkInAt}</TableHead>
                          <TableHead>{t.checkOutAt}</TableHead>
                          <TableHead>{t.method}</TableHead>
                          <TableHead className="text-right">&nbsp;</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.data.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>{a.employees?.name ?? '—'}</TableCell>
                            <TableCell>{formatDateTime(a.check_in_at)}</TableCell>
                            <TableCell>
                              {a.check_out_at ? (
                                formatDateTime(a.check_out_at)
                              ) : (
                                <Badge variant="outline">—</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{a.method}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {!a.check_out_at && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => checkOut.mutate(a.id)}
                                  disabled={checkOut.isPending}
                                >
                                  <LogOut className="h-4 w-4 mr-1" />
                                  {t.checkOutBtn}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payroll */}
          <TabsContent value="payroll" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.payroll}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <Label>{t.month}</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.year}</Label>
                    <Select
                      value={String(selectedYear)}
                      onValueChange={(v) => setSelectedYear(Number(v))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGenerate} disabled={generatePeriod.isPending}>
                    {generatePeriod.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t.generate}
                  </Button>
                </div>

                {/* Period list */}
                {periods.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : !periods.data || periods.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t.noPeriods}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.month}</TableHead>
                        <TableHead>{t.year}</TableHead>
                        <TableHead>{t.periodStatus}</TableHead>
                        <TableHead className="text-right">{t.total}</TableHead>
                        <TableHead className="text-right">&nbsp;</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periods.data.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.month}</TableCell>
                          <TableCell>{p.year}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {p.status === 'draft' ? t.draft : p.status === 'finalized' ? t.finalized : t.paid}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatBDT(p.total_amount)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openPeriod(p.id)}>
                              {t.open}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Active period editor */}
                {activePeriodId && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t.periodSummary}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground mr-2">{t.total}</span>
                          <span className="font-semibold">{formatBDT(periodTotal)}</span>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleFinalize}
                          disabled={finalizePeriod.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {t.finalize}
                        </Button>
                      </div>
                    </div>
                    <PayrollEntriesTable
                      entries={entries.data ?? []}
                      onChange={(entryId, field, value) => {
                        updateEntry.mutate({ id: entryId, [field]: value });
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add shift dialog */}
      <Dialog open={shiftFormOpen} onOpenChange={setShiftFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.addShift}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddShift} className="space-y-3">
            <div>
              <Label>{t.employee}</Label>
              <Select
                value={shiftForm.employee_id}
                onValueChange={(v) => setShiftForm((f) => ({ ...f, employee_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(employees.data ?? []).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.date}</Label>
              <Input
                type="date"
                required
                value={shiftForm.shift_date}
                onChange={(e) => setShiftForm((f) => ({ ...f, shift_date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t.start}</Label>
                <Input
                  type="time"
                  required
                  value={shiftForm.start_time}
                  onChange={(e) => setShiftForm((f) => ({ ...f, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t.end}</Label>
                <Input
                  type="time"
                  required
                  value={shiftForm.end_time}
                  onChange={(e) => setShiftForm((f) => ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>{t.notes}</Label>
              <Input
                value={shiftForm.notes}
                onChange={(e) => setShiftForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShiftFormOpen(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={createShift.isPending || !shiftForm.employee_id}>
                {createShift.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Check-in dialog */}
      <Dialog open={attendanceFormOpen} onOpenChange={setAttendanceFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.checkInBtn}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t.employee}</Label>
            <Select value={checkInEmployee} onValueChange={setCheckInEmployee}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(employees.data ?? []).map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceFormOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleCheckIn} disabled={!checkInEmployee || checkIn.isPending}>
              {checkIn.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.checkInBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

interface PayrollEntriesTableProps {
  entries: PayrollEntry[];
  onChange: (entryId: string, field: 'bonuses' | 'deductions' | 'advance_adjustment', value: number) => void;
}

const PayrollEntriesTable = ({ entries, onChange }: PayrollEntriesTableProps) => {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">—</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead className="text-right">Base</TableHead>
            <TableHead className="text-right">Bonuses</TableHead>
            <TableHead className="text-right">Deductions</TableHead>
            <TableHead className="text-right">Advance</TableHead>
            <TableHead className="text-right">Net</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{e.employees?.name ?? '—'}</TableCell>
              <TableCell className="text-right text-sm">{formatBDT(e.base_salary)}</TableCell>
              <TableCell className="text-right w-24">
                <Input
                  type="number"
                  className="h-8 text-right"
                  defaultValue={e.bonuses}
                  onBlur={(ev) => {
                    const v = parseFloat(ev.target.value) || 0;
                    if (v !== e.bonuses) onChange(e.id, 'bonuses', v);
                  }}
                />
              </TableCell>
              <TableCell className="text-right w-24">
                <Input
                  type="number"
                  className="h-8 text-right"
                  defaultValue={e.deductions}
                  onBlur={(ev) => {
                    const v = parseFloat(ev.target.value) || 0;
                    if (v !== e.deductions) onChange(e.id, 'deductions', v);
                  }}
                />
              </TableCell>
              <TableCell className="text-right w-24">
                <Input
                  type="number"
                  className="h-8 text-right"
                  defaultValue={e.advance_adjustment}
                  onBlur={(ev) => {
                    const v = parseFloat(ev.target.value) || 0;
                    if (v !== e.advance_adjustment) onChange(e.id, 'advance_adjustment', v);
                  }}
                />
              </TableCell>
              <TableCell className="text-right font-medium">{formatBDT(e.net_amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StaffSchedule;
