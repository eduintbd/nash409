import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateTenant, useUpdateTenant } from '@/hooks/useTenants';
import { useFlats } from '@/hooks/useFlats';
import { useOwners } from '@/hooks/useOwners';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Send } from 'lucide-react';

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    nid: string | null;
    rent_amount: number;
    flat_id: string | null;
    start_date: string;
    end_date: string | null;
    security_deposit?: number | null;
    house_rules?: string | null;
    maintenance_responsibilities?: string | null;
  };
  preselectedFlatId?: string;
}

export const TenantForm = ({ open, onOpenChange, editData, preselectedFlatId }: TenantFormProps) => {
  const { language } = useLanguage();
  const { data: flats } = useFlats();
  const { data: owners } = useOwners();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nid: '',
    rent_amount: '',
    flat_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    security_deposit: '',
    house_rules: '',
    maintenance_responsibilities: '',
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        email: editData.email || '',
        phone: editData.phone || '',
        nid: editData.nid || '',
        rent_amount: editData.rent_amount?.toString() || '',
        flat_id: editData.flat_id || '',
        start_date: editData.start_date || new Date().toISOString().split('T')[0],
        end_date: editData.end_date || '',
        security_deposit: editData.security_deposit?.toString() || '',
        house_rules: editData.house_rules || '',
        maintenance_responsibilities: editData.maintenance_responsibilities || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        nid: '',
        rent_amount: '',
        flat_id: preselectedFlatId || '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        security_deposit: '',
        house_rules: '',
        maintenance_responsibilities: '',
      });
    }
  }, [editData, open, preselectedFlatId]);

  const sendAgreementEmail = async (tenantId: string, agreementToken: string) => {
    if (!formData.email) {
      toast({
        title: language === 'bn' ? 'ইমেইল প্রয়োজন' : 'Email Required',
        description: language === 'bn' ? 'চুক্তি পাঠাতে ইমেইল প্রয়োজন' : 'Email is required to send agreement',
        variant: 'destructive',
      });
      return;
    }

    setSendingEmail(true);
    
    const selectedFlat = flats?.find(f => f.id === formData.flat_id);
    const selectedOwner = owners?.find(o => o.flat_id === formData.flat_id);

    try {
      const { error } = await supabase.functions.invoke('send-tenant-agreement', {
        body: {
          tenantId,
          tenantEmail: formData.email,
          tenantName: formData.name,
          flatNumber: selectedFlat?.flat_number || '',
          ownerName: selectedOwner?.name || 'N/A',
          rentAmount: parseFloat(formData.rent_amount) || 0,
          securityDeposit: parseFloat(formData.security_deposit) || 0,
          houseRules: formData.house_rules,
          maintenanceResponsibilities: formData.maintenance_responsibilities,
          startDate: formData.start_date,
          endDate: formData.end_date || null,
          agreementToken,
        },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'চুক্তি পাঠানো হয়েছে' : 'Agreement Sent',
        description: language === 'bn' ? 'ভাড়াটিয়ার ইমেইলে চুক্তি পাঠানো হয়েছে' : 'Agreement has been sent to tenant email',
      });
    } catch (error: any) {
      console.error('Error sending agreement:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, sendEmail: boolean = false) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      nid: formData.nid || null,
      rent_amount: parseFloat(formData.rent_amount) || 0,
      flat_id: formData.flat_id || null,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      security_deposit: parseFloat(formData.security_deposit) || 0,
      house_rules: formData.house_rules || null,
      maintenance_responsibilities: formData.maintenance_responsibilities || null,
    };

    try {
      if (editData) {
        await updateTenant.mutateAsync({ id: editData.id, ...data });
        if (sendEmail) {
          // Fetch the agreement token for existing tenant
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('agreement_token')
            .eq('id', editData.id)
            .single();
          
          if (tenantData?.agreement_token) {
            await sendAgreementEmail(editData.id, tenantData.agreement_token);
          }
        }
      } else {
        const result = await createTenant.mutateAsync(data);
        if (sendEmail && result?.id) {
          // Fetch the agreement token for newly created tenant
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('agreement_token')
            .eq('id', result.id)
            .single();
          
          if (tenantData?.agreement_token) {
            await sendAgreementEmail(result.id, tenantData.agreement_token);
          }
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving tenant:', error);
    }
  };

  const availableFlats = flats?.filter(f => f.status !== 'tenant' || f.id === editData?.flat_id) || [];

  // Find owner name for selected flat
  const selectedFlatOwner = useMemo(() => {
    if (!formData.flat_id || !owners) return null;
    return owners.find(owner => owner.flat_id === formData.flat_id);
  }, [formData.flat_id, owners]);

  const t = {
    title: editData 
      ? (language === 'bn' ? 'ভাড়াটিয়া সম্পাদনা' : 'Edit Tenant')
      : (language === 'bn' ? 'নতুন ভাড়াটিয়া যুক্ত করুন' : 'Add New Tenant'),
    description: language === 'bn' ? 'ভাড়াটিয়ার তথ্য দিন' : 'Enter tenant details',
    basicInfo: language === 'bn' ? 'মৌলিক তথ্য' : 'Basic Info',
    agreementDetails: language === 'bn' ? 'চুক্তির বিবরণ' : 'Agreement Details',
    name: language === 'bn' ? 'নাম' : 'Name',
    namePlaceholder: language === 'bn' ? 'ভাড়াটিয়ার নাম' : 'Tenant name',
    flat: language === 'bn' ? 'ফ্ল্যাট' : 'Flat',
    flatPlaceholder: language === 'bn' ? 'ফ্ল্যাট নির্বাচন করুন' : 'Select flat',
    flatOwner: language === 'bn' ? 'ফ্ল্যাট মালিক' : 'Flat Owner',
    noOwner: language === 'bn' ? 'কোনো মালিক নেই' : 'No owner assigned',
    phone: language === 'bn' ? 'ফোন নম্বর' : 'Phone Number',
    rentAmount: language === 'bn' ? 'ভাড়ার পরিমাণ (৳)' : 'Rent Amount (৳)',
    email: language === 'bn' ? 'ইমেইল' : 'Email',
    emailRequired: language === 'bn' ? 'ইমেইল (চুক্তি পাঠাতে প্রয়োজন)' : 'Email (required to send agreement)',
    nid: language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)',
    nidPlaceholder: language === 'bn' ? 'NID নম্বর' : 'NID number',
    startDate: language === 'bn' ? 'ভাড়া শুরু' : 'Rent Start',
    endDate: language === 'bn' ? 'ভাড়া শেষ' : 'Rent End',
    securityDeposit: language === 'bn' ? 'জামানত (৳)' : 'Security Deposit (৳)',
    houseRules: language === 'bn' ? 'বাড়ির নিয়ম' : 'House Rules',
    houseRulesPlaceholder: language === 'bn' ? 'বাড়ির নিয়ম লিখুন...' : 'Enter house rules...',
    maintenance: language === 'bn' ? 'রক্ষণাবেক্ষণ দায়িত্ব' : 'Maintenance Responsibilities',
    maintenancePlaceholder: language === 'bn' ? 'রক্ষণাবেক্ষণ দায়িত্ব লিখুন...' : 'Enter maintenance responsibilities...',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    submit: editData 
      ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
      : (language === 'bn' ? 'যুক্ত করুন' : 'Add'),
    submitAndSend: editData
      ? (language === 'bn' ? 'আপডেট ও চুক্তি পাঠান' : 'Update & Send Agreement')
      : (language === 'bn' ? 'যুক্ত ও চুক্তি পাঠান' : 'Add & Send Agreement'),
    floor: language === 'bn' ? 'তলা' : 'Floor',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{t.basicInfo}</TabsTrigger>
              <TabsTrigger value="agreement">{t.agreementDetails}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">{t.name} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.namePlaceholder}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="flat_id">{t.flat} *</Label>
                <Select value={formData.flat_id} onValueChange={(v) => setFormData({ ...formData, flat_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.flatPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFlats.map(flat => (
                      <SelectItem key={flat.id} value={flat.id}>
                        {flat.flat_number} ({t.floor} {flat.floor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.flat_id && (
                <div>
                  <Label>{t.flatOwner}</Label>
                  <Input
                    value={selectedFlatOwner?.name || t.noOwner}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="phone">{t.phone} *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {t.emailRequired}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="nid">{t.nid}</Label>
                <Input
                  id="nid"
                  value={formData.nid}
                  onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                  placeholder={t.nidPlaceholder}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="agreement" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="rent_amount">{t.rentAmount} *</Label>
                <Input
                  id="rent_amount"
                  type="number"
                  value={formData.rent_amount}
                  onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                  placeholder="15000"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="security_deposit">{t.securityDeposit}</Label>
                <Input
                  id="security_deposit"
                  type="number"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                  placeholder="30000"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">{t.startDate}</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">{t.endDate}</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="house_rules">{t.houseRules}</Label>
                <Textarea
                  id="house_rules"
                  value={formData.house_rules}
                  onChange={(e) => setFormData({ ...formData, house_rules: e.target.value })}
                  placeholder={t.houseRulesPlaceholder}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="maintenance_responsibilities">{t.maintenance}</Label>
                <Textarea
                  id="maintenance_responsibilities"
                  value={formData.maintenance_responsibilities}
                  onChange={(e) => setFormData({ ...formData, maintenance_responsibilities: e.target.value })}
                  placeholder={t.maintenancePlaceholder}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button 
              type="submit" 
              variant="secondary"
              disabled={createTenant.isPending || updateTenant.isPending}
            >
              {t.submit}
            </Button>
            <Button 
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={createTenant.isPending || updateTenant.isPending || sendingEmail || !formData.email}
            >
              <Send className="w-4 h-4 mr-2" />
              {t.submitAndSend}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
