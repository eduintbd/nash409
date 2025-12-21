import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, CheckCircle2, Loader2, Smartphone, Building2 } from 'lucide-react';

interface PaymentGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentProvider = 'bkash' | 'nagad' | 'rocket' | 'bank';

export const PaymentGatewayDialog = ({ open, onOpenChange }: PaymentGatewayDialogProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activeTab, setActiveTab] = useState<'mobile' | 'bank'>('mobile');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('bkash');
  
  const [mobileConfig, setMobileConfig] = useState({
    bkash: { merchantId: '', apiKey: '', apiSecret: '', enabled: false },
    nagad: { merchantId: '', apiKey: '', apiSecret: '', enabled: false },
    rocket: { merchantId: '', apiKey: '', apiSecret: '', enabled: false },
  });

  const [bankConfig, setBankConfig] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    branchName: '',
    enabled: false,
  });

  const handleSaveConfig = async () => {
    setIsConfiguring(true);
    
    // Simulate API save
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsConfiguring(false);
    
    toast({
      title: language === 'bn' ? 'সফল!' : 'Success!',
      description: language === 'bn' ? 'পেমেন্ট গেটওয়ে কনফিগার করা হয়েছে' : 'Payment gateway configured successfully',
    });
    
    onOpenChange(false);
  };

  const providerLabels = {
    bkash: { name: 'bKash', color: 'bg-pink-500' },
    nagad: { name: 'Nagad', color: 'bg-orange-500' },
    rocket: { name: 'Rocket', color: 'bg-purple-500' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {language === 'bn' ? 'পেমেন্ট গেটওয়ে কনফিগারেশন' : 'Payment Gateway Configuration'}
          </DialogTitle>
          <DialogDescription>
            {language === 'bn' 
              ? 'অনলাইন পেমেন্ট গ্রহণের জন্য পেমেন্ট মেথড সেটআপ করুন'
              : 'Set up payment methods to accept online payments'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'mobile' | 'bank')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {language === 'bn' ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking'}
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {language === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mobile" className="space-y-4 mt-4">
            <RadioGroup 
              value={selectedProvider} 
              onValueChange={(v) => setSelectedProvider(v as PaymentProvider)}
              className="grid grid-cols-3 gap-3"
            >
              {(['bkash', 'nagad', 'rocket'] as const).map((provider) => (
                <div key={provider}>
                  <RadioGroupItem
                    value={provider}
                    id={provider}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={provider}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <div className={`h-8 w-8 rounded-full ${providerLabels[provider].color} mb-2 flex items-center justify-center text-white text-xs font-bold`}>
                      {providerLabels[provider].name[0]}
                    </div>
                    <span className="text-sm font-medium">{providerLabels[provider].name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedProvider !== 'bank' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">
                    {language === 'bn' ? 'সক্রিয় করুন' : 'Enable'} {providerLabels[selectedProvider as keyof typeof providerLabels].name}
                  </Label>
                  <Switch 
                    checked={mobileConfig[selectedProvider as keyof typeof mobileConfig].enabled}
                    onCheckedChange={(checked) => 
                      setMobileConfig(prev => ({
                        ...prev,
                        [selectedProvider]: { ...prev[selectedProvider as keyof typeof mobileConfig], enabled: checked }
                      }))
                    }
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="merchantId">
                      {language === 'bn' ? 'মার্চেন্ট আইডি' : 'Merchant ID'}
                    </Label>
                    <Input
                      id="merchantId"
                      placeholder="MERCHANT_ID"
                      value={mobileConfig[selectedProvider as keyof typeof mobileConfig].merchantId}
                      onChange={(e) => 
                        setMobileConfig(prev => ({
                          ...prev,
                          [selectedProvider]: { ...prev[selectedProvider as keyof typeof mobileConfig], merchantId: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">
                      {language === 'bn' ? 'API কী' : 'API Key'}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="••••••••••••"
                      value={mobileConfig[selectedProvider as keyof typeof mobileConfig].apiKey}
                      onChange={(e) => 
                        setMobileConfig(prev => ({
                          ...prev,
                          [selectedProvider]: { ...prev[selectedProvider as keyof typeof mobileConfig], apiKey: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">
                      {language === 'bn' ? 'API সিক্রেট' : 'API Secret'}
                    </Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      placeholder="••••••••••••"
                      value={mobileConfig[selectedProvider as keyof typeof mobileConfig].apiSecret}
                      onChange={(e) => 
                        setMobileConfig(prev => ({
                          ...prev,
                          [selectedProvider]: { ...prev[selectedProvider as keyof typeof mobileConfig], apiSecret: e.target.value }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 mt-4">
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="font-medium">
                  {language === 'bn' ? 'ব্যাংক ট্রান্সফার সক্রিয়' : 'Enable Bank Transfer'}
                </Label>
                <Switch 
                  checked={bankConfig.enabled}
                  onCheckedChange={(checked) => setBankConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
              
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="bankName">{language === 'bn' ? 'ব্যাংকের নাম' : 'Bank Name'}</Label>
                  <Input
                    id="bankName"
                    placeholder={language === 'bn' ? 'যেমন: ইসলামী ব্যাংক' : 'e.g., Islami Bank'}
                    value={bankConfig.bankName}
                    onChange={(e) => setBankConfig(prev => ({ ...prev, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">{language === 'bn' ? 'অ্যাকাউন্টের নাম' : 'Account Name'}</Label>
                  <Input
                    id="accountName"
                    placeholder={language === 'bn' ? 'অ্যাকাউন্ট হোল্ডারের নাম' : 'Account holder name'}
                    value={bankConfig.accountName}
                    onChange={(e) => setBankConfig(prev => ({ ...prev, accountName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">{language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}</Label>
                    <Input
                      id="accountNumber"
                      placeholder="XXXXXXXXXXXX"
                      value={bankConfig.accountNumber}
                      onChange={(e) => setBankConfig(prev => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">{language === 'bn' ? 'রাউটিং নম্বর' : 'Routing Number'}</Label>
                    <Input
                      id="routingNumber"
                      placeholder="XXXXXXXXX"
                      value={bankConfig.routingNumber}
                      onChange={(e) => setBankConfig(prev => ({ ...prev, routingNumber: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchName">{language === 'bn' ? 'শাখার নাম' : 'Branch Name'}</Label>
                  <Input
                    id="branchName"
                    placeholder={language === 'bn' ? 'শাখার নাম লিখুন' : 'Enter branch name'}
                    value={bankConfig.branchName}
                    onChange={(e) => setBankConfig(prev => ({ ...prev, branchName: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            {language === 'bn' 
              ? 'আপনার ক্রেডেনশিয়ালগুলি নিরাপদে এনক্রিপ্ট করা হবে'
              : 'Your credentials will be securely encrypted'}
          </span>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </Button>
          <Button onClick={handleSaveConfig} disabled={isConfiguring}>
            {isConfiguring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
