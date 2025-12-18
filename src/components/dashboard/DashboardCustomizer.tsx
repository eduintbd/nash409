import { useState } from 'react';
import { Settings, Plus, Trash2, Eye, EyeOff, RotateCcw, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardCard } from '@/hooks/useDashboardCards';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardCustomizerProps {
  cards: DashboardCard[];
  onToggleVisibility: (id: string) => void;
  onAddCustomCard: (card: Omit<DashboardCard, 'id' | 'order' | 'type'>) => void;
  onRemoveCard: (id: string) => void;
  onUpdateCard: (id: string, updates: Partial<DashboardCard>) => void;
  onResetToDefaults: () => void;
}

const ICON_OPTIONS = [
  { value: 'Building2', label: 'Building' },
  { value: 'Users', label: 'Users' },
  { value: 'Receipt', label: 'Receipt' },
  { value: 'Wrench', label: 'Wrench' },
  { value: 'TrendingUp', label: 'Trending Up' },
  { value: 'TrendingDown', label: 'Trending Down' },
  { value: 'Home', label: 'Home' },
  { value: 'Wallet', label: 'Wallet' },
  { value: 'DollarSign', label: 'Dollar' },
  { value: 'PiggyBank', label: 'Piggy Bank' },
  { value: 'Landmark', label: 'Landmark' },
  { value: 'BarChart3', label: 'Chart' },
];

const VARIANT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'primary', label: 'Primary (Teal)' },
  { value: 'success', label: 'Success (Green)' },
  { value: 'warning', label: 'Warning (Orange)' },
  { value: 'destructive', label: 'Destructive (Red)' },
];

export function DashboardCustomizer({
  cards,
  onToggleVisibility,
  onAddCustomCard,
  onRemoveCard,
  onUpdateCard,
  onResetToDefaults,
}: DashboardCustomizerProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    title: '',
    titleBn: '',
    customValue: '',
    customValueBn: '',
    icon: 'Wallet',
    variant: 'primary' as DashboardCard['variant'],
    visible: true,
  });

  const handleAddCard = () => {
    if (!newCard.title.trim()) return;
    onAddCustomCard(newCard);
    setNewCard({
      title: '',
      titleBn: '',
      customValue: '',
      customValueBn: '',
      icon: 'Wallet',
      variant: 'primary',
      visible: true,
    });
  };

  const systemCards = cards.filter(c => c.type === 'stat');
  const customCards = cards.filter(c => c.type === 'custom');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          {language === 'bn' ? 'কাস্টমাইজ' : 'Customize'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {language === 'bn' ? 'ড্যাশবোর্ড কাস্টমাইজ করুন' : 'Customize Dashboard'}
          </DialogTitle>
          <DialogDescription>
            {language === 'bn' 
              ? 'আপনার ড্যাশবোর্ডে কার্ড যোগ করুন, সরান বা দৃশ্যমানতা টগল করুন' 
              : 'Add, remove, or toggle visibility of cards on your dashboard'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="visibility" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visibility">
              {language === 'bn' ? 'দৃশ্যমানতা' : 'Visibility'}
            </TabsTrigger>
            <TabsTrigger value="custom">
              {language === 'bn' ? 'কাস্টম কার্ড' : 'Custom Cards'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visibility" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {language === 'bn' ? 'সিস্টেম কার্ড' : 'System Cards'}
                  </h4>
                  <Button variant="ghost" size="sm" onClick={onResetToDefaults} className="gap-1 text-xs">
                    <RotateCcw className="h-3 w-3" />
                    {language === 'bn' ? 'রিসেট' : 'Reset'}
                  </Button>
                </div>
                
                {systemCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {language === 'bn' ? card.titleBn : card.title}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{card.variant}</p>
                      </div>
                    </div>
                    <Switch
                      checked={card.visible}
                      onCheckedChange={() => onToggleVisibility(card.id)}
                    />
                  </div>
                ))}

                {customCards.length > 0 && (
                  <>
                    <h4 className="text-sm font-medium text-muted-foreground mt-6 mb-2">
                      {language === 'bn' ? 'কাস্টম কার্ড' : 'Custom Cards'}
                    </h4>
                    {customCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {language === 'bn' ? card.titleBn || card.title : card.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {language === 'bn' ? card.customValueBn || card.customValue : card.customValue}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={card.visible}
                            onCheckedChange={() => onToggleVisibility(card.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => onRemoveCard(card.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'}</Label>
                    <Input
                      placeholder="e.g., Holdings"
                      value={newCard.title}
                      onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'}</Label>
                    <Input
                      placeholder="e.g., হোল্ডিংস"
                      value={newCard.titleBn}
                      onChange={(e) => setNewCard({ ...newCard, titleBn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'মান (ইংরেজি)' : 'Value (English)'}</Label>
                    <Input
                      placeholder="e.g., ৳500,000"
                      value={newCard.customValue}
                      onChange={(e) => setNewCard({ ...newCard, customValue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'মান (বাংলা)' : 'Value (Bengali)'}</Label>
                    <Input
                      placeholder="e.g., ৳৫,০০,০০০"
                      value={newCard.customValueBn}
                      onChange={(e) => setNewCard({ ...newCard, customValueBn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'আইকন' : 'Icon'}</Label>
                    <Select
                      value={newCard.icon}
                      onValueChange={(value) => setNewCard({ ...newCard, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            {icon.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'রঙ' : 'Color'}</Label>
                    <Select
                      value={newCard.variant}
                      onValueChange={(value) => setNewCard({ ...newCard, variant: value as DashboardCard['variant'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VARIANT_OPTIONS.map((variant) => (
                          <SelectItem key={variant.value} value={variant.value}>
                            {variant.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleAddCard} className="w-full gap-2" disabled={!newCard.title.trim()}>
                  <Plus className="h-4 w-4" />
                  {language === 'bn' ? 'কার্ড যোগ করুন' : 'Add Card'}
                </Button>
              </CardContent>
            </Card>

            {customCards.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {language === 'bn' ? 'আপনার কাস্টম কার্ড' : 'Your Custom Cards'}
                </h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {customCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {language === 'bn' ? card.titleBn || card.title : card.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'bn' ? card.customValueBn || card.customValue : card.customValue}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => onRemoveCard(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
