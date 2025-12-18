import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Receipt, Wallet } from 'lucide-react';
import { formatBDT } from '@/lib/currency';

interface OwnerFinancialCardProps {
  totalReceived: number;
  totalReceivable: number;
  serviceChargePaid: number;
  serviceChargePending: number;
  language: string;
}

export function OwnerFinancialCard({ 
  totalReceived, 
  totalReceivable, 
  serviceChargePaid,
  serviceChargePending,
  language 
}: OwnerFinancialCardProps) {
  const netBalance = totalReceived - serviceChargePaid;

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
          {/* Received */}
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">
                {language === 'bn' ? 'প্রাপ্ত' : 'Received'}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-success">{formatBDT(totalReceived)}</p>
          </div>

          {/* Service Charge Paid */}
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">
                {language === 'bn' ? 'সার্ভিস চার্জ' : 'Service Charge'}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-destructive">{formatBDT(serviceChargePaid)}</p>
          </div>

          {/* Receivable */}
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">
                {language === 'bn' ? 'প্রাপ্য' : 'Receivable'}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-warning">{formatBDT(totalReceivable)}</p>
          </div>

          {/* Net Balance */}
          <div className={`p-4 rounded-xl ${netBalance >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-orange-500/10 border-orange-500/20'} border`}>
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
        </div>
      </CardContent>
    </Card>
  );
}
