import { useMemo } from 'react';
import { mockInvoices, mockExpenses } from '@/data/mockData';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export function FinancialSummary() {
  const summary = useMemo(() => {
    const totalIncome = mockInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const totalExpenses = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const balance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, balance };
  }, []);

  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold mb-4">Financial Summary - December 2024</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-success/5 border border-success/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">Income</span>
          </div>
          <p className="text-2xl font-bold text-success">₹{summary.totalIncome.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-destructive">₹{summary.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Balance</span>
          </div>
          <p className="text-2xl font-bold text-primary">₹{summary.balance.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
