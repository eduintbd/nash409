import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useFlatLedger, type LedgerLine } from '@/hooks/useFlatLedger';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatBDT } from '@/lib/currency';
import { downloadLedgerPdf } from '@/lib/pdfLedger';
import { downloadCsv, toCsv } from '@/lib/csvExport';
import { ChevronLeft, Download, FileText, AlertTriangle } from 'lucide-react';

const formatDate = (iso: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const lineTypeBadge = (line: LedgerLine, language: string) => {
  if (line.kind === 'payment') {
    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
        {language === 'bn' ? 'পেমেন্ট' : 'Payment'}
      </Badge>
    );
  }
  const label =
    line.invoiceType === 'rent'
      ? language === 'bn'
        ? 'ভাড়া'
        : 'Rent'
      : line.invoiceType === 'service_charge'
        ? language === 'bn'
          ? 'সার্ভিস চার্জ'
          : 'Service'
        : language === 'bn'
          ? 'ইনভয়েস'
          : 'Invoice';
  return (
    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
      {label}
    </Badge>
  );
};

const FlatLedger = () => {
  const { flatId } = useParams<{ flatId: string }>();
  const { language } = useLanguage();
  const { data: ledger, isLoading, error } = useFlatLedger(flatId);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const t = {
    title: language === 'bn' ? 'লেজার' : 'Ledger',
    backToFlats: language === 'bn' ? 'ফ্ল্যাট তালিকায় ফিরুন' : 'Back to flats',
    totalInvoiced: language === 'bn' ? 'মোট বিল' : 'Total invoiced',
    totalPaid: language === 'bn' ? 'মোট পরিশোধ' : 'Total paid',
    outstanding: language === 'bn' ? 'বাকি' : 'Outstanding',
    nextDue: language === 'bn' ? 'পরবর্তী মেয়াদ' : 'Next due',
    none: language === 'bn' ? 'কিছু নেই' : 'None',
    year: language === 'bn' ? 'বছর' : 'Year',
    type: language === 'bn' ? 'ধরন' : 'Type',
    all: language === 'bn' ? 'সব' : 'All',
    invoice: language === 'bn' ? 'ইনভয়েস' : 'Invoice',
    payment: language === 'bn' ? 'পেমেন্ট' : 'Payment',
    date: language === 'bn' ? 'তারিখ' : 'Date',
    description: language === 'bn' ? 'বিবরণ' : 'Description',
    debit: language === 'bn' ? 'ডেবিট' : 'Debit',
    credit: language === 'bn' ? 'ক্রেডিট' : 'Credit',
    balance: language === 'bn' ? 'ব্যালেন্স' : 'Balance',
    csv: 'CSV',
    pdf: 'PDF',
    noLines: language === 'bn' ? 'এই ফ্ল্যাটের জন্য এখনো কোনো এন্ট্রি নেই' : 'No entries for this flat yet',
    errorLoading: language === 'bn' ? 'লেজার লোড করা যায়নি' : 'Could not load ledger',
    overdueAlert: language === 'bn' ? 'মেয়াদোত্তীর্ণ বিল' : 'overdue invoice(s)',
  };

  const years = useMemo(() => {
    if (!ledger) return [];
    const set = new Set<string>();
    for (const l of ledger.lines) {
      if (l.date) set.add(l.date.slice(0, 4));
    }
    return Array.from(set).sort().reverse();
  }, [ledger]);

  const filteredLines = useMemo(() => {
    if (!ledger) return [];
    return ledger.lines.filter((l) => {
      if (yearFilter !== 'all' && l.date?.slice(0, 4) !== yearFilter) return false;
      if (typeFilter === 'invoice' && l.kind !== 'invoice') return false;
      if (typeFilter === 'payment' && l.kind !== 'payment') return false;
      return true;
    });
  }, [ledger, yearFilter, typeFilter]);

  const handleCsv = () => {
    if (!ledger) return;
    const headers = ['date', 'kind', 'description', 'debit', 'credit', 'balance', 'status', 'method', 'reference'];
    const rows = filteredLines.map((l) => ({
      date: l.date,
      kind: l.kind,
      description: l.description,
      debit: l.debit || '',
      credit: l.credit || '',
      balance: l.balance,
      status: l.status ?? '',
      method: l.method ?? '',
      reference: l.reference ?? '',
    }));
    const csv = toCsv(headers, rows);
    const safeFlat = (ledger.flatNumber ?? ledger.flatId).replace(/[^a-zA-Z0-9_-]/g, '');
    downloadCsv(`ledger-${safeFlat}.csv`, csv);
  };

  const handlePdf = () => {
    if (!ledger) return;
    downloadLedgerPdf({ ...ledger, lines: filteredLines });
  };

  return (
    <MainLayout>
      <Header
        title={
          ledger
            ? `${t.title} — ${ledger.flatNumber ?? '...'}`
            : t.title
        }
        subtitle={ledger?.buildingName ?? undefined}
      />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/flats" className="gap-1">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {t.backToFlats}
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCsv}
              disabled={!ledger || ledger.lines.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              {t.csv}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePdf}
              disabled={!ledger || ledger.lines.length === 0}
            >
              <FileText className="h-4 w-4 mr-1" />
              {t.pdf}
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex gap-3 items-center">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              <p className="text-sm">{t.errorLoading}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.totalInvoiced}</p>
              {isLoading ? (
                <Skeleton className="h-6 w-24 mt-1" />
              ) : (
                <p className="text-lg font-semibold">{formatBDT(ledger?.summary.totalInvoiced ?? 0)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.totalPaid}</p>
              {isLoading ? (
                <Skeleton className="h-6 w-24 mt-1" />
              ) : (
                <p className="text-lg font-semibold text-success">
                  {formatBDT(ledger?.summary.totalPaid ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.outstanding}</p>
              {isLoading ? (
                <Skeleton className="h-6 w-24 mt-1" />
              ) : (
                <p
                  className={`text-lg font-semibold ${
                    (ledger?.summary.outstanding ?? 0) > 0 ? 'text-destructive' : ''
                  }`}
                >
                  {formatBDT(ledger?.summary.outstanding ?? 0)}
                </p>
              )}
              {ledger && ledger.summary.overdueCount > 0 && (
                <p className="text-xs text-destructive mt-1">
                  {ledger.summary.overdueCount} {t.overdueAlert}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.nextDue}</p>
              {isLoading ? (
                <Skeleton className="h-6 w-24 mt-1" />
              ) : ledger?.summary.nextDueDate ? (
                <>
                  <p className="text-lg font-semibold">{formatDate(ledger.summary.nextDueDate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBDT(ledger.summary.nextDueAmount)}
                  </p>
                </>
              ) : (
                <p className="text-lg text-muted-foreground">{t.none}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters + table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">{t.title}</CardTitle>
              <div className="flex gap-2">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue placeholder={t.year} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue placeholder={t.type} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="invoice">{t.invoice}</SelectItem>
                    <SelectItem value="payment">{t.payment}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filteredLines.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t.noLines}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">{t.date}</TableHead>
                      <TableHead className="w-24">{t.type}</TableHead>
                      <TableHead>{t.description}</TableHead>
                      <TableHead className="text-right w-28">{t.debit}</TableHead>
                      <TableHead className="text-right w-28">{t.credit}</TableHead>
                      <TableHead className="text-right w-28">{t.balance}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLines.map((l, idx) => (
                      <TableRow key={`${l.kind}-${l.invoiceId ?? ''}-${l.paymentId ?? ''}-${idx}`}>
                        <TableCell className="text-sm">{formatDate(l.date)}</TableCell>
                        <TableCell>{lineTypeBadge(l, language)}</TableCell>
                        <TableCell className="text-sm">
                          {l.description}
                          {l.method && (
                            <span className="text-xs text-muted-foreground ml-2">({l.method})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {l.debit ? formatBDT(l.debit) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right text-sm text-success">
                          {l.credit ? formatBDT(l.credit) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {formatBDT(l.balance)}
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
    </MainLayout>
  );
};

export default FlatLedger;
