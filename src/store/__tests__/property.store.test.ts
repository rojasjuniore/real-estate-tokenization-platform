'use client';

import { act } from '@testing-library/react';
import { usePropertyStore, Property } from '../property.store';

const createMockProperty = (overrides?: Partial<Property>): Property => ({
  id: `property-${Math.random().toString(36).slice(2, 9)}`,
  name: 'Test Property',
  location: 'Test Location',
  description: 'Test Description',
  imageUrl: 'https://example.com/image.jpg',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  pricePerToken: 100,
  totalTokens: 1000,
  availableTokens: 500,
  expectedYield: 8.5,
  propertyType: 'residential',
  status: 'available',
  timeline: '1-2',
  listingId: 'listing-123',
  paymentToken: '0x123abc',
  ...overrides,
});

describe('usePropertyStore', () => {
  let originalOverflow: string;

  beforeEach(() => {
    originalOverflow = document.body.style.overflow;
    // Reset store before each test
    act(() => {
      usePropertyStore.setState({
        selectedProperty: null,
        isModalOpen: false,
        recentlyViewed: [],
      });
    });
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
  });

  describe('initial state', () => {
    it('should have selectedProperty as null', () => {
      const { selectedProperty } = usePropertyStore.getState();
      expect(selectedProperty).toBeNull();
    });

    it('should have isModalOpen as false', () => {
      const { isModalOpen } = usePropertyStore.getState();
      expect(isModalOpen).toBe(false);
    });

    it('should have empty recentlyViewed array', () => {
      const { recentlyViewed } = usePropertyStore.getState();
      expect(recentlyViewed).toEqual([]);
    });
  });

  describe('selectProperty', () => {
    it('should set selectedProperty', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().selectProperty(property);
      });

      expect(usePropertyStore.getState().selectedProperty).toEqual(property);
    });

    it('should not open modal', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().selectProperty(property);
      });

      expect(usePropertyStore.getState().isModalOpen).toBe(false);
    });

    it('should not add to recentlyViewed', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().selectProperty(property);
      });

      expect(usePropertyStore.getState().recentlyViewed).toHaveLength(0);
    });

    it('should replace previously selected property', () => {
      const property1 = createMockProperty({ name: 'Property 1' });
      const property2 = createMockProperty({ name: 'Property 2' });

      act(() => {
        usePropertyStore.getState().selectProperty(property1);
      });

      act(() => {
        usePropertyStore.getState().selectProperty(property2);
      });

      expect(usePropertyStore.getState().selectedProperty?.name).toBe('Property 2');
    });
  });

  describe('openModal', () => {
    it('should set selectedProperty', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().openModal(property);
      });

      expect(usePropertyStore.getState().selectedProperty).toEqual(property);
    });

    it('should set isModalOpen to true', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().openModal(property);
      });

      expect(usePropertyStore.getState().isModalOpen).toBe(true);
    });

    it('should add property to recentlyViewed', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().openModal(property);
      });

      const { recentlyViewed } = usePropertyStore.getState();
      expect(recentlyViewed).toHaveLength(1);
      expect(recentlyViewed[0]).toEqual(property);
    });

    it('should lock body scroll', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().openModal(property);
      });

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('clearSelection', () => {
    it('should set selectedProperty to null', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().openModal(property);
      });

      act(() => {
        usePropertyStore.getState().clearSelection();
      });

      expect(usePropertyStore.getState().selectedProperty).toBeNull();
    });

    it('should set isModalOpen to false', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().openModal(property);
      });

      act(() => {
        usePropertyStore.getState().clearSelection();
      });

      expect(usePropertyStore.getState().isModalOpen).toBe(false);
    });

    it('should restore body scroll', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().openModal(property);
      });

      expect(document.body.style.overflow).toBe('hidden');

      act(() => {
        usePropertyStore.getState().clearSelection();
      });

      expect(document.body.style.overflow).toBe('');
    });

    it('should not affect recentlyViewed', () => {
      const property = createMockProperty();

      act(() => {
        usePropertyStore.getState().openModal(property);
      });

      act(() => {
        usePropertyStore.getState().clearSelection();
      });

      expect(usePropertyStore.getState().recentlyViewed).toHaveLength(1);
    });
  });

  describe('addToRecentlyViewed', () => {
    it('should add property to beginning of recentlyViewed', () => {
      const property1 = createMockProperty({ name: 'Property 1' });
      const property2 = createMockProperty({ name: 'Property 2' });

      act(() => {
        usePropertyStore.getState().addToRecentlyViewed(property1);
      });

      act(() => {
        usePropertyStore.getState().addToRecentlyViewed(property2);
      });

      const { recentlyViewed } = usePropertyStore.getState();
      expect(recentlyViewed[0].name).toBe('Property 2');
      expect(recentlyViewed[1].name).toBe('Property 1');
    });

    it('should not duplicate properties', () => {
      const property = createMockProperty({ id: 'unique-id', name: 'Property' });

      act(() => {
        usePropertyStore.getState().addToRecentlyViewed(property);
        usePropertyStore.getState().addToRecentlyViewed(property);
      });

      expect(usePropertyStore.getState().recentlyViewed).toHaveLength(1);
    });

    it('should move existing property to beginning when viewed again', () => {
      const property1 = createMockProperty({ id: 'id-1', name: 'Property 1' });
      const property2 = createMockProperty({ id: 'id-2', name: 'Property 2' });
      const property3 = createMockProperty({ id: 'id-3', name: 'Property 3' });

      act(() => {
        usePropertyStore.getState().addToRecentlyViewed(property1);
        usePropertyStore.getState().addToRecentlyViewed(property2);
        usePropertyStore.getState().addToRecentlyViewed(property3);
        // View property1 again
        usePropertyStore.getState().addToRecentlyViewed(property1);
      });

      const { recentlyViewed } = usePropertyStore.getState();
      expect(recentlyViewed).toHaveLength(3);
      expect(recentlyViewed[0].name).toBe('Property 1');
    });

    it('should limit recentlyViewed to 5 properties', () => {
      act(() => {
        for (let i = 0; i < 10; i++) {
          usePropertyStore.getState().addToRecentlyViewed(
            createMockProperty({ id: `id-${i}`, name: `Property ${i}` })
          );
        }
      });

      expect(usePropertyStore.getState().recentlyViewed).toHaveLength(5);
    });

    it('should keep newest properties when exceeding limit', () => {
      act(() => {
        for (let i = 0; i < 7; i++) {
          usePropertyStore.getState().addToRecentlyViewed(
            createMockProperty({ id: `id-${i}`, name: `Property ${i}` })
          );
        }
      });

      const { recentlyViewed } = usePropertyStore.getState();
      // Should have properties 6, 5, 4, 3, 2 (newest first)
      expect(recentlyViewed[0].name).toBe('Property 6');
      expect(recentlyViewed[4].name).toBe('Property 2');
    });
  });

  describe('property statuses', () => {
    it.each(['available', 'sold_out', 'coming_soon'] as const)(
      'should handle %s status',
      (status) => {
        const property = createMockProperty({ status });

        act(() => {
          usePropertyStore.getState().selectProperty(property);
        });

        expect(usePropertyStore.getState().selectedProperty?.status).toBe(status);
      }
    );
  });

  describe('property timelines', () => {
    it.each(['1-2', '3-4'] as const)('should handle %s timeline', (timeline) => {
      const property = createMockProperty({ timeline });

      act(() => {
        usePropertyStore.getState().selectProperty(property);
      });

      expect(usePropertyStore.getState().selectedProperty?.timeline).toBe(timeline);
    });

    it('should handle undefined timeline', () => {
      const property = createMockProperty({ timeline: undefined });

      act(() => {
        usePropertyStore.getState().selectProperty(property);
      });

      expect(usePropertyStore.getState().selectedProperty?.timeline).toBeUndefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user flow', () => {
      const property1 = createMockProperty({ id: 'p1', name: 'Property 1' });
      const property2 = createMockProperty({ id: 'p2', name: 'Property 2' });

      // User browses properties
      act(() => {
        usePropertyStore.getState().selectProperty(property1);
      });

      expect(usePropertyStore.getState().selectedProperty?.id).toBe('p1');
      expect(usePropertyStore.getState().isModalOpen).toBe(false);

      // User opens modal for property 1
      act(() => {
        usePropertyStore.getState().openModal(property1);
      });

      expect(usePropertyStore.getState().isModalOpen).toBe(true);
      expect(usePropertyStore.getState().recentlyViewed).toHaveLength(1);

      // User closes modal
      act(() => {
        usePropertyStore.getState().clearSelection();
      });

      expect(usePropertyStore.getState().selectedProperty).toBeNull();
      expect(usePropertyStore.getState().isModalOpen).toBe(false);

      // User opens another property
      act(() => {
        usePropertyStore.getState().openModal(property2);
      });

      expect(usePropertyStore.getState().selectedProperty?.id).toBe('p2');
      expect(usePropertyStore.getState().recentlyViewed).toHaveLength(2);
    });
  });
});
