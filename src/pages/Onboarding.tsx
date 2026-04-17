import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { safeStorage } from '@/lib/safeStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Loader2, LogOut, Users } from 'lucide-react';
import {
  useRequestBuildingMembership,
  useLookupBuildingByCode,
} from '@/hooks/useBuildingMembership';
import type { Database } from '@/integrations/supabase/types';

type JoinableRole = Extract<
  Database['public']['Enums']['building_role'],
  'resident_owner' | 'landlord_owner' | 'tenant' | 'staff' | 'vendor'
>;

const bootstrapSchema = z.object({
  orgName: z.string().trim().min(1).max(120),
  orgType: z.enum(['housing_society', 'property_manager', 'single_owner']),
  buildingName: z.string().trim().min(1).max(120),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  ward: z.string().trim().max(60).optional().or(z.literal('')),
  thana: z.string().trim().max(60).optional().or(z.literal('')),
  district: z.string().trim().max(60).optional().or(z.literal('')),
  numberOfFloors: z.coerce.number().int().positive().max(200).optional().or(z.nan()),
  numberOfFlats: z.coerce.number().int().positive().max(5000).optional().or(z.nan()),
  yearConstructed: z.coerce.number().int().min(1900).max(2100).optional().or(z.nan()),
});

type OrgType = z.infer<typeof bootstrapSchema>['orgType'];

const Onboarding = () => {
  const { user, refreshUserRole, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const requestMembership = useRequestBuildingMembership();
  const lookupBuilding = useLookupBuildingByCode();
  const [joinCode, setJoinCode] = useState('');
  const [joinRole, setJoinRole] = useState<JoinableRole>('tenant');
  const [joinMatch, setJoinMatch] = useState<{ id: string; name: string; address: string | null } | null>(null);

  const [form, setForm] = useState({
    orgName: '',
    orgType: 'housing_society' as OrgType,
    buildingName: '',
    address: '',
    ward: '',
    thana: '',
    district: '',
    numberOfFloors: '',
    numberOfFlats: '',
    yearConstructed: '',
  });

  const t = {
    title: language === 'bn' ? 'আপনার বিল্ডিং সেট আপ করুন' : 'Set up your building',
    subtitle:
      language === 'bn'
        ? 'আপনি এখনো কোনো বিল্ডিংয়ের সদস্য নন। একটি নতুন বিল্ডিং তৈরি করে শুরু করুন।'
        : "You're not a member of any building yet. Create one to get started as the committee.",
    orgSection: language === 'bn' ? 'সংগঠনের তথ্য' : 'Organization',
    buildingSection: language === 'bn' ? 'বিল্ডিংয়ের তথ্য' : 'Building',
    orgName: language === 'bn' ? 'সংগঠনের নাম' : 'Organization name',
    orgType: language === 'bn' ? 'ধরন' : 'Type',
    typeHousingSociety: language === 'bn' ? 'আবাসন সমিতি' : 'Housing society',
    typePropertyManager: language === 'bn' ? 'প্রপার্টি ম্যানেজমেন্ট কোম্পানি' : 'Property management company',
    typeSingleOwner: language === 'bn' ? 'একক মালিক' : 'Single owner',
    buildingName: language === 'bn' ? 'বিল্ডিংয়ের নাম' : 'Building name',
    address: language === 'bn' ? 'ঠিকানা' : 'Address',
    ward: language === 'bn' ? 'ওয়ার্ড' : 'Ward',
    thana: language === 'bn' ? 'থানা' : 'Thana',
    district: language === 'bn' ? 'জেলা' : 'District',
    numberOfFloors: language === 'bn' ? 'তলা সংখ্যা' : 'Number of floors',
    numberOfFlats: language === 'bn' ? 'মোট ফ্ল্যাট' : 'Number of flats',
    yearConstructed: language === 'bn' ? 'নির্মাণ বছর' : 'Year constructed',
    optional: language === 'bn' ? 'ঐচ্ছিক' : 'optional',
    create: language === 'bn' ? 'বিল্ডিং তৈরি করুন' : 'Create building',
    signOut: language === 'bn' ? 'লগআউট' : 'Sign out',
    success: language === 'bn' ? 'বিল্ডিং তৈরি হয়েছে' : 'Building created',
    error: language === 'bn' ? 'ত্রুটি' : 'Error',
  };

  const orgTypeLabel = (type: OrgType) =>
    ({
      housing_society: t.typeHousingSociety,
      property_manager: t.typePropertyManager,
      single_owner: t.typeSingleOwner,
    }[type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = bootstrapSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: t.error,
        description: parsed.error.issues[0]?.message ?? 'Invalid input',
        variant: 'destructive',
      });
      return;
    }

    const toIntOrUndefined = (v: string) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : undefined;
    };

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('bootstrap_building', {
        _org_name: parsed.data.orgName,
        _org_type: parsed.data.orgType,
        _building_name: parsed.data.buildingName,
        _building_address: form.address || undefined,
        _ward: form.ward || undefined,
        _thana: form.thana || undefined,
        _district: form.district || undefined,
        _number_of_floors: toIntOrUndefined(form.numberOfFloors),
        _number_of_flats: toIntOrUndefined(form.numberOfFlats),
        _year_constructed: toIntOrUndefined(form.yearConstructed),
      });

      if (error) throw error;

      const newBuildingId = data as string;
      safeStorage.setItem('nash.currentBuildingId', newBuildingId);
      toast({ title: t.success });

      await refreshUserRole();
      await queryClient.invalidateQueries({ queryKey: ['buildings'] });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription>{t.subtitle}</CardDescription>
              </div>
            </div>
            {user?.email && (
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'bn' ? 'লগইন: ' : 'Logged in as: '}
                <span className="font-medium">{user.email}</span>
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="create" className="gap-1">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {language === 'bn' ? 'নতুন তৈরি' : 'Start new'}
                </TabsTrigger>
                <TabsTrigger value="join" className="gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {language === 'bn' ? 'যোগ দিন' : 'Join existing'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="join" className="space-y-4">
                <div>
                  <Label htmlFor="join_code">
                    {language === 'bn' ? 'বিল্ডিং কোড' : 'Building code'}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="join_code"
                      placeholder="ABCD1234"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase());
                        setJoinMatch(null);
                      }}
                      className="uppercase font-mono"
                      maxLength={8}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!joinCode || lookupBuilding.isPending}
                      onClick={async () => {
                        try {
                          const b = await lookupBuilding.mutateAsync(joinCode);
                          if (!b) {
                            toast({
                              title: language === 'bn' ? 'ত্রুটি' : 'Error',
                              description: language === 'bn' ? 'কোড পাওয়া যায়নি' : 'No building found for that code',
                              variant: 'destructive',
                            });
                            return;
                          }
                          setJoinMatch(b);
                        } catch (err) {
                          toast({
                            title: language === 'bn' ? 'ত্রুটি' : 'Error',
                            description: err instanceof Error ? err.message : String(err),
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      {language === 'bn' ? 'খুঁজুন' : 'Find'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'bn'
                      ? 'কমিটির কাছ থেকে ৮-অক্ষরের কোডটি নিন।'
                      : 'Ask your committee for the 8-character code.'}
                  </p>
                </div>

                {joinMatch && (
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="font-medium">{joinMatch.name}</p>
                    {joinMatch.address && (
                      <p className="text-xs text-muted-foreground">{joinMatch.address}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="join_role">{language === 'bn' ? 'ভূমিকা' : 'Role'}</Label>
                  <Select value={joinRole} onValueChange={(v) => setJoinRole(v as JoinableRole)}>
                    <SelectTrigger id="join_role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">{language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant'}</SelectItem>
                      <SelectItem value="resident_owner">
                        {language === 'bn' ? 'মালিক (আবাসিক)' : 'Resident owner'}
                      </SelectItem>
                      <SelectItem value="landlord_owner">
                        {language === 'bn' ? 'মালিক (বাড়িওয়ালা)' : 'Landlord owner'}
                      </SelectItem>
                      <SelectItem value="staff">{language === 'bn' ? 'কর্মচারী' : 'Staff'}</SelectItem>
                      <SelectItem value="vendor">{language === 'bn' ? 'ভেন্ডর' : 'Vendor'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    disabled={!joinMatch || requestMembership.isPending}
                    onClick={async () => {
                      if (!joinMatch) return;
                      try {
                        await requestMembership.mutateAsync({ joinCode, role: joinRole });
                        toast({
                          title: language === 'bn' ? 'অনুরোধ পাঠানো হয়েছে' : 'Request sent',
                          description:
                            language === 'bn'
                              ? 'কমিটির অনুমোদনের অপেক্ষায় আছেন।'
                              : 'Waiting for committee approval.',
                        });
                        await refreshUserRole();
                        navigate('/pending-approval', { replace: true });
                      } catch (err) {
                        toast({
                          title: language === 'bn' ? 'ত্রুটি' : 'Error',
                          description: err instanceof Error ? err.message : String(err),
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    {requestMembership.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {language === 'bn' ? 'অনুরোধ পাঠান' : 'Request to join'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="create">
                <form onSubmit={handleSubmit} className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t.orgSection}
                </h3>
                <div>
                  <Label htmlFor="orgName">{t.orgName} *</Label>
                  <Input
                    id="orgName"
                    required
                    value={form.orgName}
                    onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="orgType">{t.orgType} *</Label>
                  <Select
                    value={form.orgType}
                    onValueChange={(v) => setForm((f) => ({ ...f, orgType: v as OrgType }))}
                  >
                    <SelectTrigger id="orgType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="housing_society">{orgTypeLabel('housing_society')}</SelectItem>
                      <SelectItem value="property_manager">{orgTypeLabel('property_manager')}</SelectItem>
                      <SelectItem value="single_owner">{orgTypeLabel('single_owner')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t.buildingSection}
                </h3>
                <div>
                  <Label htmlFor="buildingName">{t.buildingName} *</Label>
                  <Input
                    id="buildingName"
                    required
                    value={form.buildingName}
                    onChange={(e) => setForm((f) => ({ ...f, buildingName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="address">
                    {t.address} <span className="text-muted-foreground text-xs">({t.optional})</span>
                  </Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="ward">
                      {t.ward} <span className="text-muted-foreground text-xs">({t.optional})</span>
                    </Label>
                    <Input
                      id="ward"
                      value={form.ward}
                      onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="thana">
                      {t.thana} <span className="text-muted-foreground text-xs">({t.optional})</span>
                    </Label>
                    <Input
                      id="thana"
                      value={form.thana}
                      onChange={(e) => setForm((f) => ({ ...f, thana: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">
                      {t.district} <span className="text-muted-foreground text-xs">({t.optional})</span>
                    </Label>
                    <Input
                      id="district"
                      value={form.district}
                      onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="numberOfFloors">
                      {t.numberOfFloors} <span className="text-muted-foreground text-xs">({t.optional})</span>
                    </Label>
                    <Input
                      id="numberOfFloors"
                      type="number"
                      min={1}
                      max={200}
                      value={form.numberOfFloors}
                      onChange={(e) => setForm((f) => ({ ...f, numberOfFloors: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfFlats">
                      {t.numberOfFlats} <span className="text-muted-foreground text-xs">({t.optional})</span>
                    </Label>
                    <Input
                      id="numberOfFlats"
                      type="number"
                      min={1}
                      max={5000}
                      value={form.numberOfFlats}
                      onChange={(e) => setForm((f) => ({ ...f, numberOfFlats: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearConstructed">
                      {t.yearConstructed} <span className="text-muted-foreground text-xs">({t.optional})</span>
                    </Label>
                    <Input
                      id="yearConstructed"
                      type="number"
                      min={1900}
                      max={2100}
                      value={form.yearConstructed}
                      onChange={(e) => setForm((f) => ({ ...f, yearConstructed: e.target.value }))}
                    />
                  </div>
                </div>
              </section>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t.create}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="button" variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              {t.signOut}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
