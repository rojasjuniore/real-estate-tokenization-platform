import { create } from 'zustand';

// Property type matching existing project structure
export interface Property {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  images?: string[];
  pricePerToken: number;
  totalTokens: number;
  availableTokens: number;
  expectedYield: number;
  propertyType: string;
  status: 'available' | 'sold_out' | 'coming_soon';
  timeline?: '1-2' | '3-4'; // Investment timeline in years
  listingId?: string; // Marketplace listing ID for purchasing
  paymentToken?: string; // Payment token address for the listing
}

interface PropertyState {
  selectedProperty: Property | null;
  isModalOpen: boolean;
  recentlyViewed: Property[];
  selectProperty: (property: Property) => void;
  openModal: (property: Property) => void;
  clearSelection: () => void;
  addToRecentlyViewed: (property: Property) => void;
}

const MAX_RECENTLY_VIEWED = 5;

export const usePropertyStore = create<PropertyState>((set, get) => ({
  selectedProperty: null,
  isModalOpen: false,
  recentlyViewed: [],

  selectProperty: (property: Property) => {
    // Just select property without opening modal (for property list selection)
    set({
      selectedProperty: property,
    });
  },

  openModal: (property: Property) => {
    set({
      selectedProperty: property,
      isModalOpen: true,
    });

    // Add to recently viewed
    get().addToRecentlyViewed(property);

    // Lock body scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  },

  clearSelection: () => {
    set({
      selectedProperty: null,
      isModalOpen: false,
    });

    // Restore body scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  },

  addToRecentlyViewed: (property: Property) => {
    set((state) => {
      const filtered = state.recentlyViewed.filter((p) => p.id !== property.id);
      return {
        recentlyViewed: [property, ...filtered].slice(0, MAX_RECENTLY_VIEWED),
      };
    });
  },
}));
