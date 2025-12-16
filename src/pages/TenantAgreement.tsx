import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Home, FileText, Shield, Wrench, Calendar, DollarSign } from 'lucide-react';

interface TenantAgreementData {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  rent_amount: number;
  security_deposit: number | null;
  house_rules: string | null;
  maintenance_responsibilities: string | null;
  start_date: string;
  end_date: string | null;
  agreement_status: string | null;
  flat_id: string | null;
  flats?: { flat_number: string; floor: number } | null;
}

export default function TenantAgreement() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [tenant, setTenant] = useState<TenantAgreementData | null>(null);
  const [ownerName, setOwnerName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [agreeing, setAgreeing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  const t = {
    title: language === 'bn' ? 'ভাড়াটিয়া চুক্তি' : 'Tenant Agreement',
    subtitle: language === 'bn' ? 'অনুগ্রহ করে চুক্তির বিবরণ পর্যালোচনা করুন এবং স্বীকার করুন' : 'Please review and accept the agreement details',
    flatDetails: language === 'bn' ? 'ফ্ল্যাটের বিবরণ' : 'Flat Details',
    flatNumber: language === 'bn' ? 'ফ্ল্যাট নম্বর' : 'Flat Number',
    floor: language === 'bn' ? 'তলা' : 'Floor',
    owner: language === 'bn' ? 'মালিক' : 'Owner',
    financialTerms: language === 'bn' ? 'আর্থিক শর্তাবলী' : 'Financial Terms',
    monthlyRent: language === 'bn' ? 'মাসিক ভাড়া' : 'Monthly Rent',
    securityDeposit: language === 'bn' ? 'জামানত' : 'Security Deposit',
    leasePeriod: language === 'bn' ? 'ভাড়ার সময়কাল' : 'Lease Period',
    startDate: language === 'bn' ? 'শুরুর তারিখ' : 'Start Date',
    endDate: language === 'bn' ? 'শেষ তারিখ' : 'End Date',
    ongoing: language === 'bn' ? 'চলমান' : 'Ongoing',
    houseRules: language === 'bn' ? 'বাড়ির নিয়ম' : 'House Rules',
    maintenance: language === 'bn' ? 'রক্ষণাবেক্ষণ দায়িত্ব' : 'Maintenance Responsibilities',
    agreeCheckbox: language === 'bn' 
      ? 'আমি উপরের সমস্ত শর্তাবলী পড়েছি এবং সম্মত হয়েছি' 
      : 'I have read and agree to all the terms and conditions above',
    agreeButton: language === 'bn' ? 'চুক্তি স্বীকার করুন' : 'Accept Agreement',
    alreadyAgreed: language === 'bn' ? 'চুক্তি ইতিমধ্যে স্বীকার করা হয়েছে' : 'Agreement Already Accepted',
    alreadyAgreedDesc: language === 'bn' 
      ? 'আপনি ইতিমধ্যে এই চুক্তি স্বীকার করেছেন। আপনি এখন পোর্টালে লগইন করতে পারেন।' 
      : 'You have already accepted this agreement. You can now login to the portal.',
    success: language === 'bn' ? 'চুক্তি সফলভাবে স্বীকার করা হয়েছে!' : 'Agreement accepted successfully!',
    successDesc: language === 'bn' 
      ? 'আপনি এখন পোর্টালে লগইন করতে পারেন।' 
      : 'You can now login to the portal.',
    loginButton: language === 'bn' ? 'পোর্টালে লগইন করুন' : 'Login to Portal',
    notFound: language === 'bn' ? 'চুক্তি পাওয়া যায়নি' : 'Agreement Not Found',
    notFoundDesc: language === 'bn' 
      ? 'এই লিঙ্কটি অবৈধ বা মেয়াদোত্তীর্ণ হতে পারে।' 
      : 'This link may be invalid or expired.',
  };

  useEffect(() => {
    const fetchTenant = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const { data: tenantData, error } = await supabase
        .from('tenants')
        .select('*, flats(flat_number, floor)')
        .eq('agreement_token', token)
        .single();

      if (error || !tenantData) {
        console.error('Error fetching tenant:', error);
        setLoading(false);
        return;
      }

      setTenant(tenantData as TenantAgreementData);
      
      if (tenantData.agreement_status === 'agreed') {
        setAgreed(true);
      }

      // Fetch owner name
      if (tenantData.flat_id) {
        const { data: ownerData } = await supabase
          .from('owners')
          .select('name')
          .eq('flat_id', tenantData.flat_id)
          .single();
        
        if (ownerData) {
          setOwnerName(ownerData.name);
        }
      }

      setLoading(false);
    };

    fetchTenant();
  }, [token]);

  const handleAgree = async () => {
    if (!tenant || !checkboxChecked) return;
    
    setAgreeing(true);
    
    const { error } = await supabase
      .from('tenants')
      .update({
        agreement_status: 'agreed',
        agreement_agreed_at: new Date().toISOString(),
      })
      .eq('id', tenant.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setAgreeing(false);
      return;
    }

    setAgreed(true);
    setAgreeing(false);
    toast({
      title: t.success,
      description: t.successDesc,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">{t.notFound}</CardTitle>
            <CardDescription>{t.notFoundDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/auth')}>
              {t.loginButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (agreed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-green-600">{t.alreadyAgreed}</CardTitle>
            <CardDescription>{t.alreadyAgreedDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/auth')}>
              {t.loginButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-2">{t.subtitle}</p>
          <p className="text-lg font-medium mt-4">
            {language === 'bn' ? 'প্রিয়' : 'Dear'} {tenant.name},
          </p>
        </div>

        {/* Flat Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              {t.flatDetails}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t.flatNumber}</Label>
              <p className="font-medium">{tenant.flats?.flat_number || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t.floor}</Label>
              <p className="font-medium">{tenant.flats?.floor || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">{t.owner}</Label>
              <p className="font-medium">{ownerName || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t.financialTerms}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t.monthlyRent}</Label>
              <p className="font-medium text-lg">৳{tenant.rent_amount.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t.securityDeposit}</Label>
              <p className="font-medium text-lg">৳{(tenant.security_deposit || 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Lease Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t.leasePeriod}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t.startDate}</Label>
              <p className="font-medium">{tenant.start_date}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t.endDate}</Label>
              <p className="font-medium">{tenant.end_date || t.ongoing}</p>
            </div>
          </CardContent>
        </Card>

        {/* House Rules */}
        {tenant.house_rules && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t.houseRules}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 whitespace-pre-wrap">
                {tenant.house_rules}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance Responsibilities */}
        {tenant.maintenance_responsibilities && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                {t.maintenance}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 whitespace-pre-wrap">
                {tenant.maintenance_responsibilities}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agreement Checkbox and Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3 mb-6">
              <Checkbox
                id="agree"
                checked={checkboxChecked}
                onCheckedChange={(checked) => setCheckboxChecked(checked as boolean)}
              />
              <Label htmlFor="agree" className="text-sm leading-relaxed cursor-pointer">
                {t.agreeCheckbox}
              </Label>
            </div>
            <Button
              onClick={handleAgree}
              disabled={!checkboxChecked || agreeing}
              className="w-full"
              size="lg"
            >
              {agreeing ? 'Processing...' : t.agreeButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
