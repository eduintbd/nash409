import { useState, useEffect } from 'react';

export interface DashboardCard {
  id: string;
  title: string;
  titleBn: string;
  type: 'stat' | 'custom';
  visible: boolean;
  order: number;
  icon?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  customValue?: string;
  customValueBn?: string;
}

const DEFAULT_ADMIN_CARDS: DashboardCard[] = [
  { id: 'total-flats', title: 'Total Flats', titleBn: 'মোট ফ্ল্যাট', type: 'stat', visible: true, order: 0, icon: 'Building2', variant: 'primary' },
  { id: 'occupied', title: 'Occupied', titleBn: 'দখলকৃত', type: 'stat', visible: true, order: 1, icon: 'Users', variant: 'success' },
  { id: 'pending-payments', title: 'Pending Payments', titleBn: 'বকেয়া পেমেন্ট', type: 'stat', visible: true, order: 2, icon: 'Receipt', variant: 'warning' },
  { id: 'service-requests', title: 'Service Requests', titleBn: 'সার্ভিস অনুরোধ', type: 'stat', visible: true, order: 3, icon: 'Wrench', variant: 'destructive' },
  { id: 'total-income', title: 'Total Income', titleBn: 'মোট আয়', type: 'stat', visible: true, order: 4, icon: 'TrendingUp', variant: 'success' },
  { id: 'total-expenses', title: 'Total Expenses', titleBn: 'মোট খরচ', type: 'stat', visible: true, order: 5, icon: 'TrendingDown', variant: 'destructive' },
  { id: 'pending-amount', title: 'Pending Amount', titleBn: 'বকেয়া পরিমাণ', type: 'stat', visible: true, order: 6, icon: 'Receipt', variant: 'warning' },
];

const DEFAULT_OWNER_CARDS: DashboardCard[] = [
  { id: 'my-flats', title: 'My Flats', titleBn: 'আমার ফ্ল্যাটসমূহ', type: 'stat', visible: true, order: 0, icon: 'Home', variant: 'primary' },
  { id: 'monthly-rent-income', title: 'Monthly Rent Income', titleBn: 'মাসিক ভাড়া আয়', type: 'stat', visible: true, order: 1, icon: 'TrendingUp', variant: 'success' },
  { id: 'monthly-rent-due', title: 'Monthly Rent Due', titleBn: 'মাসিক বকেয়া ভাড়া', type: 'stat', visible: true, order: 2, icon: 'Receipt', variant: 'warning' },
  { id: 'service-charge-paid', title: 'Paid Service Charge', titleBn: 'পরিশোধিত সার্ভিস চার্জ', type: 'stat', visible: true, order: 3, icon: 'Wallet', variant: 'success' },
  { id: 'service-charge-pending', title: 'Pending Service Charge', titleBn: 'বকেয়া সার্ভিস চার্জ', type: 'stat', visible: true, order: 4, icon: 'TrendingDown', variant: 'warning' },
  { id: 'total-rental-income', title: 'Total Rental Income', titleBn: 'মোট ভাড়া আয়', type: 'stat', visible: true, order: 5, icon: 'TrendingUp', variant: 'success' },
  { id: 'total-pending', title: 'Total Pending', titleBn: 'মোট বকেয়া', type: 'stat', visible: true, order: 6, icon: 'Receipt', variant: 'warning' },
  { id: 'open-requests', title: 'Service Requests', titleBn: 'সার্ভিস অনুরোধ', type: 'stat', visible: true, order: 7, icon: 'Wrench', variant: 'destructive' },
];

const STORAGE_KEY_ADMIN = 'dashboard_cards_admin';
const STORAGE_KEY_OWNER = 'dashboard_cards_owner';

export function useDashboardCards(role: 'admin' | 'owner') {
  const storageKey = role === 'admin' ? STORAGE_KEY_ADMIN : STORAGE_KEY_OWNER;
  const defaultCards = role === 'admin' ? DEFAULT_ADMIN_CARDS : DEFAULT_OWNER_CARDS;

  const [cards, setCards] = useState<DashboardCard[]>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new cards are included
        const existingIds = parsed.map((c: DashboardCard) => c.id);
        const newDefaults = defaultCards.filter(d => !existingIds.includes(d.id));
        return [...parsed, ...newDefaults].sort((a, b) => a.order - b.order);
      } catch {
        return defaultCards;
      }
    }
    return defaultCards;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cards));
  }, [cards, storageKey]);

  const updateCard = (id: string, updates: Partial<DashboardCard>) => {
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  const toggleCardVisibility = (id: string) => {
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, visible: !card.visible } : card
    ));
  };

  const addCustomCard = (card: Omit<DashboardCard, 'id' | 'order' | 'type'>) => {
    const newCard: DashboardCard = {
      ...card,
      id: `custom-${Date.now()}`,
      type: 'custom',
      order: cards.length,
    };
    setCards(prev => [...prev, newCard]);
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  };

  const reorderCards = (startIndex: number, endIndex: number) => {
    setCards(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result.map((card, index) => ({ ...card, order: index }));
    });
  };

  const resetToDefaults = () => {
    setCards(defaultCards);
    localStorage.removeItem(storageKey);
  };

  const visibleCards = cards.filter(c => c.visible).sort((a, b) => a.order - b.order);

  return {
    cards,
    visibleCards,
    updateCard,
    toggleCardVisibility,
    addCustomCard,
    removeCard,
    reorderCards,
    resetToDefaults,
  };
}
