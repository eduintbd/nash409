import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useFlats } from '@/hooks/useFlats';
import { Building2, Loader2 } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type SignupRole = 'owner' | 'tenant' | 'employee' | 'interested_tenant';

const Auth = () => {
  const { user, signIn, isLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: flats } = useFlats();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRole, setSignupRole] = useState<SignupRole | ''>('');
  const [signupFlatId, setSignupFlatId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available flats for owner/tenant selection
  // Owners can select any flat (including rented ones they own)
  const availableFlatsForOwner = flats || [];
  // Tenants can select any flat number during signup (final assignment still depends on approvals/workflow)
  const availableFlatsForTenant = flats || [];

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ 
          title: language === 'bn' ? 'ত্রুটি' : 'Error', 
          description: err.errors[0].message, 
          variant: 'destructive' 
        });
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      toast({ 
        title: language === 'bn' ? 'লগইন ব্যর্থ' : 'Login Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    } else {
      toast({ title: language === 'bn' ? 'সফলভাবে লগইন হয়েছে' : 'Logged in successfully' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
      if (!signupName.trim()) throw new Error(language === 'bn' ? 'নাম প্রয়োজন' : 'Name is required');
      if (!signupRole) throw new Error(language === 'bn' ? 'ভূমিকা নির্বাচন করুন' : 'Please select a role');
      if (!signupPhone.trim()) throw new Error(language === 'bn' ? 'ফোন নম্বর প্রয়োজন' : 'Phone number is required');
      if ((signupRole === 'owner' || signupRole === 'tenant') && !signupFlatId) {
        throw new Error(language === 'bn' ? 'ফ্ল্যাট নির্বাচন করুন' : 'Please select a flat');
      }
    } catch (err) {
      const message = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ 
        title: language === 'bn' ? 'ত্রুটি' : 'Error', 
        description: message, 
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);
    
    // Sign up with metadata including requested role and flat info
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { 
          full_name: signupName,
          requested_role: signupRole,
          phone: signupPhone,
          flat_id: signupFlatId || null
        }
      }
    });

    if (error) {
      setIsSubmitting(false);
      const errorMessage = error.message.includes('already registered') 
        ? (language === 'bn' ? 'এই ইমেইল ইতিমধ্যে নিবন্ধিত' : 'This email is already registered')
        : error.message;
      toast({ 
        title: language === 'bn' ? 'নিবন্ধন ব্যর্থ' : 'Signup Failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(false);
    toast({ 
      title: language === 'bn' ? 'অ্যাকাউন্ট তৈরি হয়েছে!' : 'Account created!',
      description: language === 'bn' 
        ? 'অ্যাডমিন অনুমোদনের জন্য অপেক্ষা করুন।' 
        : 'Please wait for admin approval.',
    });
    
    // Clear form
    setSignupEmail('');
    setSignupPassword('');
    setSignupName('');
    setSignupPhone('');
    setSignupRole('');
    setSignupFlatId('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {language === 'bn' ? 'বিল্ডিং ম্যানেজমেন্ট' : 'Building Management'}
          </CardTitle>
          <CardDescription>
            {language === 'bn' ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'Access your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{language === 'bn' ? 'লগইন' : 'Login'}</TabsTrigger>
              <TabsTrigger value="signup">{language === 'bn' ? 'নিবন্ধন' : 'Sign Up'}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === 'bn' ? 'লগইন' : 'Login'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'আমি একজন' : 'I am a'}</Label>
                  <Select value={signupRole} onValueChange={(v) => {
                    setSignupRole(v as SignupRole);
                    setSignupFlatId(''); // Reset flat selection when role changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'bn' ? 'ভূমিকা নির্বাচন করুন' : 'Select role'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">{language === 'bn' ? 'ফ্ল্যাট মালিক' : 'Flat Owner'}</SelectItem>
                      <SelectItem value="tenant">{language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant'}</SelectItem>
                      <SelectItem value="interested_tenant">{language === 'bn' ? 'আগ্রহী ভাড়াটিয়া' : 'Interested Tenant'}</SelectItem>
                      <SelectItem value="employee">{language === 'bn' ? 'কর্মচারী' : 'Employee'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Common Fields */}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{language === 'bn' ? 'পুরো নাম' : 'Full Name'}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">{language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder={language === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
                    required
                  />
                </div>

                {/* Flat Selection for Owner/Tenant */}
                {(signupRole === 'owner' || signupRole === 'tenant') && (
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'ফ্ল্যাট নির্বাচন করুন' : 'Select Flat'}</Label>
                    <Select value={signupFlatId} onValueChange={setSignupFlatId}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'bn' ? 'ফ্ল্যাট নির্বাচন করুন' : 'Select flat'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(signupRole === 'owner' ? availableFlatsForOwner : availableFlatsForTenant).map((flat) => (
                          <SelectItem key={flat.id} value={flat.id}>
                            {language === 'bn' ? `ফ্ল্যাট ${flat.flat_number}` : `Flat ${flat.flat_number}`} 
                            {flat.status !== 'vacant' && ` (${flat.status})`}
                          </SelectItem>
                        ))}
                        {(signupRole === 'owner' ? availableFlatsForOwner : availableFlatsForTenant).length === 0 && (
                          <SelectItem value="" disabled>
                            {language === 'bn' ? 'কোন ফ্ল্যাট উপলব্ধ নেই' : 'No flats available'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting || !signupRole}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === 'bn' ? 'নিবন্ধন' : 'Sign Up'}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  {language === 'bn' 
                    ? 'নিবন্ধনের পর অ্যাডমিন অনুমোদন প্রয়োজন' 
                    : 'Admin approval required after registration'}
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;