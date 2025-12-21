import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';

interface WhatsAppIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WhatsAppIntegrationDialog = ({ open, onOpenChange }: WhatsAppIntegrationDialogProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    businessId: '',
    accessToken: '',
    enablePaymentReminders: true,
    enableServiceUpdates: true,
    enableMonthlyReports: false,
  });

  const handleConnect = async () => {
    if (!formData.phoneNumber || !formData.businessId || !formData.accessToken) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'সব ক্ষেত্র পূরণ করুন' : 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    
    // Simulate API connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsConnecting(false);
    setIsConnected(true);
    
    toast({
      title: language === 'bn' ? 'সফল!' : 'Success!',
      description: language === 'bn' ? 'হোয়াটসঅ্যাপ বিজনেস সংযুক্ত হয়েছে' : 'WhatsApp Business connected successfully',
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setFormData({
      phoneNumber: '',
      businessId: '',
      accessToken: '',
      enablePaymentReminders: true,
      enableServiceUpdates: true,
      enableMonthlyReports: false,
    });
    toast({
      title: language === 'bn' ? 'সংযোগ বিচ্ছিন্ন' : 'Disconnected',
      description: language === 'bn' ? 'হোয়াটসঅ্যাপ বিজনেস সংযোগ বিচ্ছিন্ন হয়েছে' : 'WhatsApp Business disconnected',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            {language === 'bn' ? 'হোয়াটসঅ্যাপ বিজনেস ইন্টিগ্রেশন' : 'WhatsApp Business Integration'}
          </DialogTitle>
          <DialogDescription>
            {language === 'bn' 
              ? 'হোয়াটসঅ্যাপের মাধ্যমে স্বয়ংক্রিয় নোটিফিকেশন পাঠান'
              : 'Send automated notifications via WhatsApp'}
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-green-700 dark:text-green-400 font-medium">
                {language === 'bn' ? 'সংযুক্ত' : 'Connected'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{language === 'bn' ? 'পেমেন্ট রিমাইন্ডার' : 'Payment Reminders'}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'বকেয়া পেমেন্টের জন্য রিমাইন্ডার' : 'Reminders for due payments'}
                  </p>
                </div>
                <Switch 
                  checked={formData.enablePaymentReminders}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enablePaymentReminders: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{language === 'bn' ? 'সার্ভিস আপডেট' : 'Service Updates'}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'সার্ভিস রিকুয়েস্ট স্ট্যাটাস আপডেট' : 'Service request status updates'}
                  </p>
                </div>
                <Switch 
                  checked={formData.enableServiceUpdates}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableServiceUpdates: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{language === 'bn' ? 'মাসিক রিপোর্ট' : 'Monthly Reports'}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'মাসিক আর্থিক সারসংক্ষেপ' : 'Monthly financial summaries'}
                  </p>
                </div>
                <Switch 
                  checked={formData.enableMonthlyReports}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableMonthlyReports: checked }))}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                {language === 'bn' ? 'বিজনেস ফোন নম্বর' : 'Business Phone Number'}
              </Label>
              <Input
                id="phoneNumber"
                placeholder="+880 1XXXXXXXXX"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessId">
                {language === 'bn' ? 'বিজনেস অ্যাকাউন্ট আইডি' : 'Business Account ID'}
              </Label>
              <Input
                id="businessId"
                placeholder="WABA_ID"
                value={formData.businessId}
                onChange={(e) => setFormData(prev => ({ ...prev, businessId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">
                {language === 'bn' ? 'অ্যাক্সেস টোকেন' : 'Access Token'}
              </Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="••••••••••••"
                value={formData.accessToken}
                onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'bn' 
                ? 'Meta Business Suite থেকে এই তথ্যগুলি পান'
                : 'Get these details from Meta Business Suite'}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {isConnected ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
              <Button variant="destructive" onClick={handleDisconnect}>
                {language === 'bn' ? 'সংযোগ বিচ্ছিন্ন' : 'Disconnect'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === 'bn' ? 'সংযুক্ত করুন' : 'Connect'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
