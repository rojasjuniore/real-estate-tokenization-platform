'use client';

import { act } from '@testing-library/react';
import { usePanelsStore, PanelType } from '../panels.store';

describe('usePanelsStore', () => {
  // Store original document.body.style.overflow
  let originalOverflow: string;

  beforeEach(() => {
    originalOverflow = document.body.style.overflow;
    // Reset store before each test
    act(() => {
      usePanelsStore.setState({
        activePanel: null,
        isOpen: false,
      });
    });
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
  });

  describe('initial state', () => {
    it('should have activePanel as null', () => {
      const { activePanel } = usePanelsStore.getState();
      expect(activePanel).toBeNull();
    });

    it('should have isOpen as false', () => {
      const { isOpen } = usePanelsStore.getState();
      expect(isOpen).toBe(false);
    });
  });

  describe('openPanel', () => {
    it('should set activePanel to the specified type', () => {
      act(() => {
        usePanelsStore.getState().openPanel('auth');
      });

      expect(usePanelsStore.getState().activePanel).toBe('auth');
    });

    it('should set isOpen to true', () => {
      act(() => {
        usePanelsStore.getState().openPanel('kyc');
      });

      expect(usePanelsStore.getState().isOpen).toBe(true);
    });

    it('should lock body scroll', () => {
      act(() => {
        usePanelsStore.getState().openPanel('contact');
      });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it.each([
      'auth',
      'contact',
      'kyc',
      'account',
      'property',
      'propertyDetail',
      'about',
      'portfolio',
      'dividends',
      'settings',
    ] as const)('should open %s panel', (panelType) => {
      act(() => {
        usePanelsStore.getState().openPanel(panelType);
      });

      const { activePanel, isOpen } = usePanelsStore.getState();
      expect(activePanel).toBe(panelType);
      expect(isOpen).toBe(true);
    });

    it('should switch panels if one is already open', () => {
      act(() => {
        usePanelsStore.getState().openPanel('auth');
      });

      act(() => {
        usePanelsStore.getState().openPanel('kyc');
      });

      expect(usePanelsStore.getState().activePanel).toBe('kyc');
      expect(usePanelsStore.getState().isOpen).toBe(true);
    });
  });

  describe('closePanel', () => {
    it('should set activePanel to null', () => {
      act(() => {
        usePanelsStore.getState().openPanel('account');
      });

      act(() => {
        usePanelsStore.getState().closePanel();
      });

      expect(usePanelsStore.getState().activePanel).toBeNull();
    });

    it('should set isOpen to false', () => {
      act(() => {
        usePanelsStore.getState().openPanel('portfolio');
      });

      act(() => {
        usePanelsStore.getState().closePanel();
      });

      expect(usePanelsStore.getState().isOpen).toBe(false);
    });

    it('should restore body scroll', () => {
      act(() => {
        usePanelsStore.getState().openPanel('dividends');
      });

      expect(document.body.style.overflow).toBe('hidden');

      act(() => {
        usePanelsStore.getState().closePanel();
      });

      expect(document.body.style.overflow).toBe('');
    });

    it('should do nothing if already closed', () => {
      const initialState = usePanelsStore.getState();

      act(() => {
        usePanelsStore.getState().closePanel();
      });

      expect(usePanelsStore.getState().activePanel).toBe(initialState.activePanel);
      expect(usePanelsStore.getState().isOpen).toBe(initialState.isOpen);
    });
  });

  describe('togglePanel', () => {
    it('should open panel if closed', () => {
      act(() => {
        usePanelsStore.getState().togglePanel('settings');
      });

      expect(usePanelsStore.getState().activePanel).toBe('settings');
      expect(usePanelsStore.getState().isOpen).toBe(true);
    });

    it('should close panel if open with same type', () => {
      act(() => {
        usePanelsStore.getState().openPanel('about');
      });

      act(() => {
        usePanelsStore.getState().togglePanel('about');
      });

      expect(usePanelsStore.getState().activePanel).toBeNull();
      expect(usePanelsStore.getState().isOpen).toBe(false);
    });

    it('should switch to new panel if open with different type', () => {
      act(() => {
        usePanelsStore.getState().openPanel('auth');
      });

      act(() => {
        usePanelsStore.getState().togglePanel('kyc');
      });

      expect(usePanelsStore.getState().activePanel).toBe('kyc');
      expect(usePanelsStore.getState().isOpen).toBe(true);
    });

    it('should lock body scroll when opening', () => {
      act(() => {
        usePanelsStore.getState().togglePanel('property');
      });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closing', () => {
      act(() => {
        usePanelsStore.getState().togglePanel('property');
      });

      act(() => {
        usePanelsStore.getState().togglePanel('property');
      });

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('multiple operations', () => {
    it('should handle rapid open/close operations', () => {
      act(() => {
        usePanelsStore.getState().openPanel('auth');
        usePanelsStore.getState().closePanel();
        usePanelsStore.getState().openPanel('kyc');
        usePanelsStore.getState().openPanel('portfolio');
        usePanelsStore.getState().closePanel();
      });

      expect(usePanelsStore.getState().activePanel).toBeNull();
      expect(usePanelsStore.getState().isOpen).toBe(false);
      expect(document.body.style.overflow).toBe('');
    });

    it('should maintain state consistency after multiple toggles', () => {
      act(() => {
        usePanelsStore.getState().togglePanel('auth');
        usePanelsStore.getState().togglePanel('kyc');
        usePanelsStore.getState().togglePanel('kyc');
      });

      expect(usePanelsStore.getState().activePanel).toBeNull();
      expect(usePanelsStore.getState().isOpen).toBe(false);
    });
  });
});
