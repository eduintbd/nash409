import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useExpenses, useExpenseCategories, useDeleteExpense } from '@/hooks/useExpenses';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { Search, Plus, TrendingDown, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/currency';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Expenses = () => {
  const { t, language } = useLanguage();
  const { isAdmin } = useAuth();
  const { data: expenses, isLoading } = useExpenses();
  const { data: categories } = useExpenseCategories();
  const deleteExpense = useDeleteExpense();
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const paymentMethodLabels: Record<string, string> = {
    cash: t.expenses.cash,
    bank: t.expenses.bank,
    bkash: t.expenses.bkash,
    nagad: t.expenses.nagad,
    rocket: t.expenses.rocket,
    cheque: t.expenses.cheque,
  };

  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(search.toLowerCase()) ||
                          expense.vendor?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  const expensesByCategory = expenses?.reduce((acc, exp: any) => {
    const catName = exp.expense_categories?.name || (language === 'bn' ? 'অন্যান্য' : 'Other');
    acc[catName] = (acc[catName] || 0) + Number(exp.amount);
    return acc;
  }, {} as Record<string, number>) || {};

  const handleDelete = async () => {
    if (deleteId) {
      await deleteExpense.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  return (
    <MainLayout>
      <Header 
        title={t.expenses.title} 
        subtitle={t.expenses.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">{t.expenses.totalExpenses}</p>
            </div>
            <p className="text-2xl font-bold mt-2">{formatBDT(totalExpenses)}</p>
          </div>
          {Object.entries(expensesByCategory).slice(0, 3).map(([category, amount]) => (
            <div key={category} className="stat-card">
              <p className="text-sm text-muted-foreground truncate">{category}</p>
              <p className="text-xl font-bold mt-1">{formatBDT(amount)}</p>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.expenses.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t.expenses.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.expenses.allCategories}</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.expenses.addExpense}
            </Button>
          )}
        </div>

        {/* Expenses Table */}
        <div className="stat-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t.expenses.noExpenses}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>{t.common.date}</TableHead>
                  <TableHead>{t.expenses.category}</TableHead>
                  <TableHead>{t.invoices.description}</TableHead>
                  <TableHead>{t.expenses.vendor}</TableHead>
                  <TableHead>{t.expenses.paymentMethod}</TableHead>
                  <TableHead className="text-right">{t.common.amount}</TableHead>
                  {isAdmin && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense: any) => (
                  <TableRow key={expense.id} className="table-row-hover">
                    <TableCell>{new Date(expense.date).toLocaleDateString(locale)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted">
                        {expense.expense_categories?.name || (language === 'bn' ? 'অন্যান্য' : 'Other')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                    <TableCell className="text-muted-foreground">{expense.vendor || '-'}</TableCell>
                    <TableCell>
                      <span className="text-xs uppercase font-medium text-muted-foreground">
                        {paymentMethodLabels[expense.payment_method] || expense.payment_method}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {formatBDT(expense.amount)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <ExpenseForm open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.common.deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Expenses;