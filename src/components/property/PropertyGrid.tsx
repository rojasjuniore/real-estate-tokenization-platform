'use client';

import { PropertyCard, Property } from './PropertyCard';
import { Card } from '@/components/ui/Card';

interface PropertyGridProps {
  properties: Property[];
  isLoading?: boolean;
  skeletonCount?: number;
  onPropertyClick?: (property: Property) => void;
}

function PropertySkeleton() {
  return (
    <Card className="animate-pulse" data-testid="property-skeleton">
      <div className="aspect-video w-full rounded-t-lg bg-gray-200" />
      <div className="p-4">
        <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
        <div className="mb-4 h-4 w-1/2 rounded bg-gray-200" />
        <div className="mb-4 flex justify-between">
          <div className="h-8 w-20 rounded bg-gray-200" />
          <div className="h-8 w-16 rounded bg-gray-200" />
        </div>
        <div className="h-2 w-full rounded bg-gray-200" />
      </div>
    </Card>
  );
}

export function PropertyGrid({
  properties,
  isLoading = false,
  skeletonCount = 6,
  onPropertyClick,
}: PropertyGridProps) {
  if (isLoading) {
    return (
      <div role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <p className="sr-only">Loading properties...</p>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <PropertySkeleton key={index} />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 text-6xl">🏠</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No properties found</h3>
        <p className="text-gray-500">Check back later for new investment opportunities.</p>
      </div>
    );
  }

  return (
    <div role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onClick={onPropertyClick}
        />
      ))}
    </div>
  );
}
