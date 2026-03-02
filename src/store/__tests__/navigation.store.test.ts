'use client';

import { act } from '@testing-library/react';
import { useNavigationStore, getNavigationDirection, SectionId } from '../navigation.store';

// Mock window.history.pushState
const mockPushState = jest.fn();
const originalPushState = window.history.pushState;

describe('useNavigationStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useNavigationStore.setState({
        activeSection: 'home',
        previousSection: null,
        isTransitioning: false,
      });
    });
    // Mock pushState
    window.history.pushState = mockPushState;
    mockPushState.mockClear();
  });

  afterEach(() => {
    window.history.pushState = originalPushState;
  });

  describe('initial state', () => {
    it('should have activeSection as home', () => {
      const { activeSection } = useNavigationStore.getState();
      expect(activeSection).toBe('home');
    });

    it('should have previousSection as null', () => {
      const { previousSection } = useNavigationStore.getState();
      expect(previousSection).toBeNull();
    });

    it('should have isTransitioning as false', () => {
      const { isTransitioning } = useNavigationStore.getState();
      expect(isTransitioning).toBe(false);
    });
  });

  describe('navigate', () => {
    it('should update activeSection to the new section', () => {
      act(() => {
        useNavigationStore.getState().navigate('explore');
      });

      expect(useNavigationStore.getState().activeSection).toBe('explore');
    });

    it('should set previousSection to the old activeSection', () => {
      act(() => {
        useNavigationStore.getState().navigate('marketplace');
      });

      expect(useNavigationStore.getState().previousSection).toBe('home');
    });

    it('should set isTransitioning to true', () => {
      act(() => {
        useNavigationStore.getState().navigate('about');
      });

      expect(useNavigationStore.getState().isTransitioning).toBe(true);
    });

    it('should update browser history', () => {
      act(() => {
        useNavigationStore.getState().navigate('support');
      });

      expect(mockPushState).toHaveBeenCalledWith({}, '', '#support');
    });

    it('should not navigate if already on the same section', () => {
      act(() => {
        useNavigationStore.getState().navigate('home');
      });

      expect(mockPushState).not.toHaveBeenCalled();
      expect(useNavigationStore.getState().previousSection).toBeNull();
    });

    it.each([
      'home',
      'explore',
      'marketplace',
      'about',
      'support',
      'profile',
      'admin',
    ] as const)('should navigate to %s section', (section) => {
      // Start from a different section
      act(() => {
        useNavigationStore.setState({ activeSection: section === 'home' ? 'explore' : 'home' });
      });

      act(() => {
        useNavigationStore.getState().navigate(section);
      });

      expect(useNavigationStore.getState().activeSection).toBe(section);
    });

    it('should chain navigation correctly', () => {
      act(() => {
        useNavigationStore.getState().navigate('explore');
      });

      act(() => {
        useNavigationStore.getState().navigate('marketplace');
      });

      const { activeSection, previousSection } = useNavigationStore.getState();
      expect(activeSection).toBe('marketplace');
      expect(previousSection).toBe('explore');
    });
  });

  describe('setTransitioning', () => {
    it('should set isTransitioning to true', () => {
      act(() => {
        useNavigationStore.getState().setTransitioning(true);
      });

      expect(useNavigationStore.getState().isTransitioning).toBe(true);
    });

    it('should set isTransitioning to false', () => {
      act(() => {
        useNavigationStore.setState({ isTransitioning: true });
      });

      act(() => {
        useNavigationStore.getState().setTransitioning(false);
      });

      expect(useNavigationStore.getState().isTransitioning).toBe(false);
    });
  });
});

describe('getNavigationDirection', () => {
  it('should return 1 for forward navigation (home -> explore)', () => {
    expect(getNavigationDirection('home', 'explore')).toBe(1);
  });

  it('should return 1 for forward navigation (explore -> marketplace)', () => {
    expect(getNavigationDirection('explore', 'marketplace')).toBe(1);
  });

  it('should return -1 for backward navigation (marketplace -> home)', () => {
    expect(getNavigationDirection('marketplace', 'home')).toBe(-1);
  });

  it('should return -1 for backward navigation (admin -> support)', () => {
    expect(getNavigationDirection('admin', 'support')).toBe(-1);
  });

  it('should return 1 when navigating to the same section', () => {
    expect(getNavigationDirection('home', 'home')).toBe(1);
  });

  it('should return 1 when from is null', () => {
    expect(getNavigationDirection(null, 'marketplace')).toBe(1);
  });

  it('should return correct direction for all section combinations', () => {
    const sections: SectionId[] = ['home', 'explore', 'marketplace', 'about', 'support', 'profile', 'admin'];

    // Forward navigation should return 1
    for (let i = 0; i < sections.length - 1; i++) {
      expect(getNavigationDirection(sections[i], sections[i + 1])).toBe(1);
    }

    // Backward navigation should return -1
    for (let i = sections.length - 1; i > 0; i--) {
      expect(getNavigationDirection(sections[i], sections[i - 1])).toBe(-1);
    }
  });
});
