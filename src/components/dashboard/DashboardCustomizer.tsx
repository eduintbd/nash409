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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardCustomizerProps {
  cards: DashboardCard[];
  onToggleVisibility: (id: string) => void;
  onAddCustomCard: (card: Omit<DashboardCard, 'id' | 'order' | 'type'>) => void;
  onRemoveCard: (id: string) => void;
  onUpdateCard: (id: string, updates: Partial<DashboardCard>) => void;
  onResetToDefaults: () => void;
  onReorderCards: (startIndex: number, endIndex: number) => void;
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

interface SortableCardItemProps {
  card: DashboardCard;
  language: string;
  onToggleVisibility: (id: string) => void;
  onRemoveCard?: (id: string) => void;
  isCustom?: boolean;
}

function SortableCardItem({ card, language, onToggleVisibility, onRemoveCard, isCustom }: SortableCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div>
          <p className="font-medium text-sm">
            {language === 'bn' ? card.titleBn || card.title : card.title}
          </p>
          {isCustom ? (
            <p className="text-xs text-muted-foreground">
              {language === 'bn' ? card.customValueBn || card.customValue : card.customValue}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground capitalize">{card.variant}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={card.visible}
          onCheckedChange={() => onToggleVisibility(card.id)}
        />
        {isCustom && onRemoveCard && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onRemoveCard(card.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function DashboardCustomizer({
  cards,
  onToggleVisibility,
  onAddCustomCard,
  onRemoveCard,
  onUpdateCard,
  onResetToDefaults,
  onReorderCards,
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex(c => c.id === active.id);
      const newIndex = cards.findIndex(c => c.id === over.id);
      onReorderCards(oldIndex, newIndex);
    }
  };

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
                    {language === 'bn' ? 'কার্ড টেনে সাজান' : 'Drag to reorder cards'}
                  </h4>
                  <Button variant="ghost" size="sm" onClick={onResetToDefaults} className="gap-1 text-xs">
                    <RotateCcw className="h-3 w-3" />
                    {language === 'bn' ? 'রিসেট' : 'Reset'}
                  </Button>
                </div>
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={cards.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {cards.map((card) => (
                      <SortableCardItem
                        key={card.id}
                        card={card}
                        language={language}
                        onToggleVisibility={onToggleVisibility}
                        onRemoveCard={card.type === 'custom' ? onRemoveCard : undefined}
                        isCustom={card.type === 'custom'}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
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
