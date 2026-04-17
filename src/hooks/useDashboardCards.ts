import { useState, useEffect } from 'react';
import { safeStorage } from '@/lib/safeStorage';

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
  link?: string;
}

const DEFAULT_ADMIN_CARDS: DashboardCard[] = [
  { id: 'property-overview', title: 'Property Overview', titleBn: 'প্রপার্টি সারসংক্ষেপ', type: 'stat', visible: true, order: 0, icon: 'Building2', variant: 'primary', link: '/flats' },
  { id: 'financial-summary', title: 'Financial Summary', titleBn: 'আর্থিক সারসংক্ষেপ', type: 'stat', visible: true, order: 1, icon: 'Wallet', variant: 'primary' },
  { id: 'service-requests', title: 'Service Requests', titleBn: 'সার্ভিস অনুরোধ', type: 'stat', visible: true, order: 2, icon: 'Wrench', variant: 'destructive', link: '/service-requests' },
];

const DEFAULT_OWNER_CARDS: DashboardCard[] = [
  { id: 'property-overview', title: 'My Properties', titleBn: 'আমার ফ্ল্যাট', type: 'stat', visible: true, order: 0, icon: 'Home', variant: 'primary', link: '/my-properties' },
  { id: 'financial-summary', title: 'Financial Summary', titleBn: 'আর্থিক সারসংক্ষেপ', type: 'stat', visible: true, order: 1, icon: 'Wallet', variant: 'primary' },
  { id: 'service-requests', title: 'Service Requests', titleBn: 'সার্ভিস অনুরোধ', type: 'stat', visible: true, order: 2, icon: 'Wrench', variant: 'destructive', link: '/service-requests' },
];

const DEFAULT_TENANT_CARDS: DashboardCard[] = [
  { id: 'property-overview', title: 'My Flat', titleBn: 'আমার ফ্ল্যাট', type: 'stat', visible: true, order: 0, icon: 'Home', variant: 'primary' },
  { id: 'financial-summary', title: 'Financial Summary', titleBn: 'আর্থিক সারসংক্ষেপ', type: 'stat', visible: true, order: 1, icon: 'Wallet', variant: 'primary' },
  { id: 'service-requests', title: 'Service Requests', titleBn: 'সার্ভিস অনুরোধ', type: 'stat', visible: true, order: 2, icon: 'Wrench', variant: 'destructive', link: '/service-requests' },
];

const STORAGE_KEY_ADMIN = 'dashboard_cards_admin';
const STORAGE_KEY_OWNER = 'dashboard_cards_owner';
const STORAGE_KEY_TENANT = 'dashboard_cards_tenant';

export function useDashboardCards(role: 'admin' | 'owner' | 'tenant') {
  const storageKey = role === 'admin' ? STORAGE_KEY_ADMIN : role === 'owner' ? STORAGE_KEY_OWNER : STORAGE_KEY_TENANT;
  const defaultCards = role === 'admin' ? DEFAULT_ADMIN_CARDS : role === 'owner' ? DEFAULT_OWNER_CARDS : DEFAULT_TENANT_CARDS;

  const [cards, setCards] = useState<DashboardCard[]>(() => {
    const stored = safeStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new cards get new properties like links
        const mergedCards = parsed.map((storedCard: DashboardCard) => {
          const defaultCard = defaultCards.find(d => d.id === storedCard.id);
          if (defaultCard) {
            // Merge default properties (like link) with stored card, preserving user customizations
            return { ...defaultCard, ...storedCard, link: defaultCard.link };
          }
          return storedCard;
        });
        // Add any new default cards that don't exist in storage
        const existingIds = mergedCards.map((c: DashboardCard) => c.id);
        const newDefaults = defaultCards.filter(d => !existingIds.includes(d.id));
        return [...mergedCards, ...newDefaults].sort((a, b) => a.order - b.order);
      } catch {
        return defaultCards;
      }
    }
    return defaultCards;
  });

  useEffect(() => {
    safeStorage.setItem(storageKey, JSON.stringify(cards));
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
    safeStorage.removeItem(storageKey);
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
