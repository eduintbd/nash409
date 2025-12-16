import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PendingApproval = () => {
  const { signOut, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">
            {language === 'bn' ? 'অনুমোদনের জন্য অপেক্ষা করুন' : 'Pending Approval'}
          </CardTitle>
          <CardDescription className="text-base">
            {language === 'bn' 
              ? 'আপনার অ্যাকাউন্ট এখনও অ্যাডমিন দ্বারা অনুমোদিত হয়নি।' 
              : 'Your account has not been approved by an admin yet.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {language === 'bn' 
              ? 'অনুগ্রহ করে অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন। অনুমোদন হলে আপনি পোর্টালে প্রবেশ করতে পারবেন।' 
              : 'Please wait for an admin to approve your account. Once approved, you will be able to access the portal.'}
          </p>
          
          {user?.email && (
            <p className="text-sm">
              <span className="text-muted-foreground">
                {language === 'bn' ? 'লগইন করা ইমেইল: ' : 'Logged in as: '}
              </span>
              <span className="font-medium">{user.email}</span>
            </p>
          )}

          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full mt-4"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {language === 'bn' ? 'লগআউট' : 'Logout'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;