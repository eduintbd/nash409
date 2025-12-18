import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { Building2, Loader2, Mail, KeyRound } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type SignupRole = 'owner' | 'tenant' | 'employee' | 'interested_tenant';

const Auth = () => {
  const { user, signIn, isLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRole, setSignupRole] = useState<SignupRole | ''>('');
  const [signupPropertyName, setSignupPropertyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Password reset with token
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);


  // Check for reset token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !resetToken) {
      navigate('/dashboard');
    }
  }, [user, navigate, resetToken]);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
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

    setIsResetting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: resetEmail,
          redirectUrl: `${window.location.origin}/auth`,
        }
      });

      if (error) throw error;

      toast({ 
        title: language === 'bn' ? 'ইমেইল পাঠানো হয়েছে' : 'Email Sent',
        description: language === 'bn' 
          ? 'পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে' 
          : 'Password reset link has been sent to your email',
      });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast({ 
        title: language === 'bn' ? 'ত্রুটি' : 'Error', 
        description: error.message || 'Failed to send reset email', 
        variant: 'destructive' 
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({ 
        title: language === 'bn' ? 'ত্রুটি' : 'Error', 
        description: language === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      passwordSchema.parse(newPassword);
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

    setIsUpdatingPassword(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-reset-token', {
        body: {
          token: resetToken,
          newPassword: newPassword,
        }
      });

      if (error) throw error;

      toast({ 
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? 'পাসওয়ার্ড সফলভাবে আপডেট হয়েছে' 
          : 'Password updated successfully',
      });
      
      // Clear token and redirect to login
      setResetToken(null);
      setNewPassword('');
      setConfirmPassword('');
      navigate('/auth', { replace: true });
    } catch (error: any) {
      toast({ 
        title: language === 'bn' ? 'ত্রুটি' : 'Error', 
        description: error.message || 'Failed to update password', 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdatingPassword(false);
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
      if ((signupRole === 'owner' || signupRole === 'tenant') && !signupPropertyName.trim()) {
        throw new Error(language === 'bn' ? 'প্রপার্টির নাম লিখুন' : 'Please enter property name');
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
          property_name: signupPropertyName || null
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
    setSignupPropertyName('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show password reset form if token is present
  if (resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {language === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Set New Password'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'আপনার নতুন পাসওয়ার্ড দিন' : 'Enter your new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={language === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isUpdatingPassword}>
                {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setResetToken(null);
                    navigate('/auth', { replace: true });
                  }}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {language === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Login'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
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
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                  </button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'আমি একজন' : 'I am a'}</Label>
                  <Select value={signupRole} onValueChange={(v) => {
                    setSignupRole(v as SignupRole);
                    setSignupPropertyName(''); // Reset property name when role changes
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

                {/* Property Name for Owner/Tenant */}
                {(signupRole === 'owner' || signupRole === 'tenant') && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-property">{language === 'bn' ? 'প্রপার্টির নাম' : 'Property Name'}</Label>
                    <Input
                      id="signup-property"
                      type="text"
                      value={signupPropertyName}
                      onChange={(e) => setSignupPropertyName(e.target.value)}
                      placeholder={language === 'bn' ? 'যেমন: গ্রীন ভিউ অ্যাপার্টমেন্ট' : 'e.g., Green View Apartment'}
                      required
                    />
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

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              {language === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' 
                ? 'আপনার ইমেইল ঠিকানা দিন। আমরা একটি রিসেট লিঙ্ক পাঠাব।' 
                : 'Enter your email address. We will send you a reset link.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isResetting}>
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === 'bn' ? 'লিঙ্ক পাঠান' : 'Send Link'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;