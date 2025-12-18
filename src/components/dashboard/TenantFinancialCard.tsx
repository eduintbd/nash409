import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Receipt, Wallet } from 'lucide-react';
import { formatBDT } from '@/lib/currency';

interface TenantFinancialCardProps {
  totalPaid: number;
  totalPayable: number;
  pendingBills: number;
  language: string;
}

export function TenantFinancialCard({ 
  totalPaid, 
  totalPayable, 
  pendingBills,
  language 
}: TenantFinancialCardProps) {
  const totalDue = totalPayable;

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
          {/* Total Paid */}
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">
                {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-success">{formatBDT(totalPaid)}</p>
          </div>

          {/* Payable */}
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">
                {language === 'bn' ? 'পরিশোধযোগ্য' : 'Payable'}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-warning">{formatBDT(totalPayable)}</p>
          </div>

          {/* Pending Bills */}
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">
                {language === 'bn' ? 'বকেয়া বিল' : 'Pending Bills'}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-destructive">{pendingBills}</p>
          </div>

          {/* Total Due */}
          <div className={`p-4 rounded-xl ${totalDue === 0 ? 'bg-primary/10 border-primary/20' : 'bg-orange-500/10 border-orange-500/20'} border`}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {language === 'bn' ? 'মোট বকেয়া' : 'Total Due'}
              </span>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${totalDue === 0 ? 'text-primary' : 'text-orange-600'}`}>
              {formatBDT(totalDue)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
