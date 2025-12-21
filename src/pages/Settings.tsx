import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Bell, Shield, Database, MessageSquare, CreditCard, Languages } from 'lucide-react';
import { WhatsAppIntegrationDialog } from '@/components/settings/WhatsAppIntegrationDialog';
import { PaymentGatewayDialog } from '@/components/settings/PaymentGatewayDialog';

const Settings = () => {
  const { language, setLanguage, t } = useLanguage();
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  return (
    <MainLayout>
      <Header 
        title={t.settings.title}
        subtitle={t.settings.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              {t.settings.language}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'অ্যাপ্লিকেশনের ভাষা নির্বাচন করুন' : 'Select application language'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">{t.settings.language}</Label>
              <Select value={language} onValueChange={(v: 'en' | 'bn') => setLanguage(v)}>
                <SelectTrigger id="language" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 {t.settings.english}</SelectItem>
                  <SelectItem value="bn">🇧🇩 {t.settings.bengali}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Building Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {language === 'bn' ? 'বিল্ডিং তথ্য' : 'Building Information'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'আপনার বিল্ডিংয়ের মৌলিক তথ্য' : 'Basic details about your building'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buildingName">{language === 'bn' ? 'বিল্ডিংয়ের নাম' : 'Building Name'}</Label>
                <Input id="buildingName" defaultValue="Sunrise Apartments" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalFlats">{language === 'bn' ? 'মোট ফ্ল্যাট' : 'Total Flats'}</Label>
                <Input id="totalFlats" defaultValue="20" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{language === 'bn' ? 'ঠিকানা' : 'Address'}</Label>
                <Input id="address" defaultValue="123 Main Street, Dhaka" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{language === 'bn' ? 'যোগাযোগ' : 'Contact Phone'}</Label>
                <Input id="phone" defaultValue="+880 1712 345678" />
              </div>
            </div>
            <Button className="mt-4">{language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'নোটিফিকেশন পছন্দসমূহ কনফিগার করুন' : 'Configure notification preferences'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === 'bn' ? 'পেমেন্ট রিমাইন্ডার' : 'Payment Reminders'}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'বাসিন্দাদের স্বয়ংক্রিয় পেমেন্ট রিমাইন্ডার পাঠান' : 'Send automatic payment reminders to residents'}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === 'bn' ? 'সার্ভিস রিকুয়েস্ট আপডেট' : 'Service Request Updates'}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'রিকুয়েস্ট স্ট্যাটাস পরিবর্তন হলে মালিকদের জানান' : 'Notify owners when request status changes'}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === 'bn' ? 'মাসিক রিপোর্ট' : 'Monthly Reports'}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মাসিক আর্থিক সারসংক্ষেপ ইমেইল করুন' : 'Email monthly financial summaries'}
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {language === 'bn' ? 'নিরাপত্তা' : 'Security'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'অ্যাক্সেস ও নিরাপত্তা সেটিংস পরিচালনা করুন' : 'Manage access and security settings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === 'bn' ? 'টু-ফ্যাক্টর অথেনটিকেশন' : 'Two-Factor Authentication'}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'অতিরিক্ত নিরাপত্তা স্তর যুক্ত করুন' : 'Add an extra layer of security'}
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="space-y-2">
              <Button variant="outline">{language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</Button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {language === 'bn' ? 'ইন্টিগ্রেশন' : 'Integrations'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'বাহ্যিক সার্ভিসগুলি সংযুক্ত করুন' : 'Connect external services'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">{language === 'bn' ? 'হোয়াটসঅ্যাপ বিজনেস' : 'WhatsApp Business'}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'হোয়াটসঅ্যাপের মাধ্যমে নোটিফিকেশন পাঠান' : 'Send notifications via WhatsApp'}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setWhatsappDialogOpen(true)}>
                {language === 'bn' ? 'সংযুক্ত করুন' : 'Connect'}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{language === 'bn' ? 'পেমেন্ট গেটওয়ে' : 'Payment Gateway'}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'অনলাইন পেমেন্ট গ্রহণ করুন' : 'Accept online payments'}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(true)}>
                {language === 'bn' ? 'কনফিগার' : 'Configure'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Dialogs */}
      <WhatsAppIntegrationDialog 
        open={whatsappDialogOpen} 
        onOpenChange={setWhatsappDialogOpen} 
      />
      <PaymentGatewayDialog 
        open={paymentDialogOpen} 
        onOpenChange={setPaymentDialogOpen} 
      />
    </MainLayout>
  );
};

export default Settings;
