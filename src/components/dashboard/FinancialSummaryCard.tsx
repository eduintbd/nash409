import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Receipt, Wallet } from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { Link } from 'react-router-dom';

interface FinancialSummaryCardProps {
  totalIncome: number;
  totalExpenses: number;
  receivable: number;
  language: string;
}

export function FinancialSummaryCard({ 
  totalIncome, 
  totalExpenses, 
  receivable,
  language 
}: FinancialSummaryCardProps) {
  const netBalance = totalIncome - totalExpenses;

  return (
    <Card className="stat-card border-0 col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          {language === 'bn' ? 'আর্থিক সারসংক্ষেপ' : 'Financial Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Income - Links to paid invoices */}
          <Link to="/invoices?status=paid" className="block hover:scale-[1.02] transition-transform">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 h-full cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'আয়' : 'Income'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-success">{formatBDT(totalIncome)}</p>
            </div>
          </Link>

          {/* Expenses - Links to expenses page */}
          <Link to="/expenses" className="block hover:scale-[1.02] transition-transform">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 h-full cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'খরচ' : 'Expenses'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-destructive">{formatBDT(totalExpenses)}</p>
            </div>
          </Link>

          {/* Receivable - Links to unpaid invoices */}
          <Link to="/invoices?status=unpaid" className="block hover:scale-[1.02] transition-transform">
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 h-full cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'বকেয়া পাওনা' : 'Receivable'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-warning">{formatBDT(receivable)}</p>
            </div>
          </Link>

          {/* Net Balance - Links to invoices */}
          <Link to="/invoices" className="block hover:scale-[1.02] transition-transform">
            <div className={`p-4 rounded-xl ${netBalance >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-orange-500/10 border-orange-500/20'} border h-full cursor-pointer`}>
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'নিট ব্যালেন্স' : 'Net Balance'}
                </span>
              </div>
              <p className={`text-xl md:text-2xl font-bold ${netBalance >= 0 ? 'text-primary' : 'text-orange-600'}`}>
                {formatBDT(netBalance)}
              </p>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
