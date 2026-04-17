import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBuilding } from '@/contexts/BuildingContext';
import {
  usePendingBuildingMembers,
  useApproveMembership,
  useRejectMembership,
  useCurrentBuildingDetails,
} from '@/hooks/useBuildingMembership';
import { useFlats } from '@/hooks/useFlats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X, Copy, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PendingMemberRequests = () => {
  const { language } = useLanguage();
  const { currentRoles } = useBuilding();
  const canManage = currentRoles.includes('committee') || currentRoles.includes('manager');

  const building = useCurrentBuildingDetails();
  const pending = usePendingBuildingMembers();
  const flats = useFlats();
  const approve = useApproveMembership();
  const reject = useRejectMembership();

  const [flatByMember, setFlatByMember] = useState<Record<string, string>>({});

  const t = {
    title: language === 'bn' ? 'সদস্যতার অনুরোধ' : 'Membership requests',
    subtitle:
      language === 'bn'
        ? 'যারা যোগ দিতে চায় তাদের অনুমোদন বা প্রত্যাখ্যান করুন'
        : 'Approve or reject people who want to join',
    shareCode: language === 'bn' ? 'এই কোডটি শেয়ার করুন' : 'Share this code',
    codeHint:
      language === 'bn'
        ? 'নতুন সদস্যরা অনবোর্ডিংয়ে এই কোডটি ব্যবহার করে যোগ দিতে পারেন।'
        : 'New members enter this code on onboarding to request to join.',
    copy: language === 'bn' ? 'কপি' : 'Copy',
    copied: language === 'bn' ? 'কপি হয়েছে' : 'Copied',
    none: language === 'bn' ? 'কোনো অপেক্ষমান অনুরোধ নেই' : 'No pending requests',
    name: language === 'bn' ? 'নাম' : 'Name',
    email: language === 'bn' ? 'ইমেইল' : 'Email',
    role: language === 'bn' ? 'ভূমিকা' : 'Role',
    flat: language === 'bn' ? 'ফ্ল্যাট' : 'Flat',
    selectFlat: language === 'bn' ? 'ফ্ল্যাট নির্বাচন' : 'Select flat',
    approve: language === 'bn' ? 'অনুমোদন' : 'Approve',
    reject: language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject',
    requiresFlat:
      language === 'bn'
        ? 'অনুমোদনের আগে একটি ফ্ল্যাট নির্বাচন করুন'
        : 'Select a flat before approving',
    error: language === 'bn' ? 'ত্রুটি' : 'Error',
  };

  if (!canManage) {
    return <Navigate to="/dashboard" replace />;
  }

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      committee: language === 'bn' ? 'কমিটি' : 'Committee',
      manager: language === 'bn' ? 'ম্যানেজার' : 'Manager',
      staff: language === 'bn' ? 'কর্মচারী' : 'Staff',
      vendor: language === 'bn' ? 'ভেন্ডর' : 'Vendor',
      landlord_owner: language === 'bn' ? 'মালিক (বাড়িওয়ালা)' : 'Landlord owner',
      resident_owner: language === 'bn' ? 'মালিক (আবাসিক)' : 'Resident owner',
      tenant: language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant',
    };
    return map[role] ?? role;
  };

  const needsFlat = (role: string) =>
    role === 'tenant' || role === 'resident_owner' || role === 'landlord_owner';

  const handleApprove = async (id: string, role: string) => {
    const flatId = flatByMember[id];
    if (needsFlat(role) && !flatId) {
      toast({ title: t.error, description: t.requiresFlat, variant: 'destructive' });
      return;
    }
    try {
      await approve.mutateAsync({ id, flatId });
    } catch (err) {
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout>
      <Header title={t.title} subtitle={t.subtitle} />
      <div className="p-4 lg:p-6 space-y-4">
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">{t.shareCode}</p>
              <p className="text-2xl font-mono font-semibold tracking-wider">
                {building.data?.join_code ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t.codeHint}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!building.data?.join_code) return;
                void navigator.clipboard.writeText(building.data.join_code);
                toast({ title: t.copied });
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              {t.copy}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !pending.data || pending.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t.none}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.name}</TableHead>
                      <TableHead>{t.email}</TableHead>
                      <TableHead>{t.role}</TableHead>
                      <TableHead>{t.flat}</TableHead>
                      <TableHead className="text-right">&nbsp;</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.data.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.profiles?.full_name ?? '—'}</TableCell>
                        <TableCell className="text-sm">{m.profiles?.email ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{roleLabel(m.role)}</Badge>
                        </TableCell>
                        <TableCell>
                          {needsFlat(m.role) ? (
                            <Select
                              value={flatByMember[m.id] ?? ''}
                              onValueChange={(v) =>
                                setFlatByMember((prev) => ({ ...prev, [m.id]: v }))
                              }
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue placeholder={t.selectFlat} />
                              </SelectTrigger>
                              <SelectContent>
                                {(flats.data ?? []).map((f) => (
                                  <SelectItem key={f.id} value={f.id}>
                                    {f.flat_number}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(m.id, m.role)}
                              disabled={approve.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {t.approve}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => reject.mutate(m.id)}
                              disabled={reject.isPending}
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PendingMemberRequests;
