import { create } from 'zustand';

export type PanelType = 'auth' | 'contact' | 'kyc' | 'account' | 'property' | 'propertyDetail' | 'about' | 'portfolio' | 'dividends' | 'settings' | null;

interface PanelsState {
  activePanel: PanelType;
  isOpen: boolean;
  openPanel: (type: Exclude<PanelType, null>) => void;
  closePanel: () => void;
  togglePanel: (type: Exclude<PanelType, null>) => void;
}

export const usePanelsStore = create<PanelsState>((set, get) => ({
  activePanel: null,
  isOpen: false,

  openPanel: (type) => {
    set({
      activePanel: type,
      isOpen: true,
    });

    // Lock body scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  },

  closePanel: () => {
    set({
      activePanel: null,
      isOpen: false,
    });

    // Restore body scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  },

  togglePanel: (type) => {
    const { activePanel, isOpen, openPanel, closePanel } = get();
    if (isOpen && activePanel === type) {
      closePanel();
    } else {
      openPanel(type);
    }
  },
}));
