import { create } from 'zustand';

export type SectionId = 'home' | 'explore' | 'marketplace' | 'about' | 'support' | 'profile' | 'admin';

interface NavigationState {
  activeSection: SectionId;
  previousSection: SectionId | null;
  isTransitioning: boolean;
  navigate: (section: SectionId) => void;
  setTransitioning: (value: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  activeSection: 'home',
  previousSection: null,
  isTransitioning: false,

  navigate: (section: SectionId) => {
    const current = get().activeSection;
    if (current === section) return;

    set({
      previousSection: current,
      activeSection: section,
      isTransitioning: true,
    });

    // Update URL hash
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `#${section}`);
    }
  },

  setTransitioning: (value: boolean) => {
    set({ isTransitioning: value });
  },
}));

// Helper to get direction for animations (1 = forward, -1 = backward)
export function getNavigationDirection(from: SectionId | null, to: SectionId): number {
  const order: SectionId[] = ['home', 'explore', 'marketplace', 'about', 'support', 'profile', 'admin'];
  const fromIndex = from ? order.indexOf(from) : 0;
  const toIndex = order.indexOf(to);
  return toIndex >= fromIndex ? 1 : -1;
}
