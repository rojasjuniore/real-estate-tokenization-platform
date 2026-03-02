'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export interface Property {
  id: number;
  name: string;
  location: string;
  imageUrl: string;
  price: string;
  totalFractions: number;
  availableFractions: number;
  pricePerFraction: string;
  annualYield: number;
  propertyType: 'Apartment' | 'House' | 'Commercial' | 'Land';
}

interface PropertyCardProps {
  property: Property;
  onClick?: (property: Property) => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const {
    name,
    location,
    imageUrl,
    totalFractions,
    availableFractions,
    pricePerFraction,
    annualYield,
    propertyType,
  } = property;

  const availabilityPercentage = Math.round((availableFractions / totalFractions) * 100);
  const soldPercentage = 100 - availabilityPercentage;
  const isSoldOut = availableFractions === 0;

  const handleClick = () => {
    if (onClick) {
      onClick(property);
    }
  };

  return (
    <Card
      hoverable
      className="cursor-pointer transition-all duration-200 hover:shadow-lg"
      onClick={handleClick}
      role="article"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute left-2 top-2">
          <Badge variant="default">{propertyType}</Badge>
        </div>
        {isSoldOut && (
          <div className="absolute right-2 top-2">
            <Badge variant="error">Sold Out</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">{name}</h3>
        <p className="mb-3 text-sm text-gray-500">{location}</p>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Price per fraction</p>
            <p className="text-lg font-bold text-green-600">${pricePerFraction}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Annual yield</p>
            <p className="text-lg font-bold text-blue-600">{annualYield}%</p>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Available</span>
            <span className="font-medium text-gray-900">
              {availableFractions.toLocaleString()} / {totalFractions.toLocaleString()}
            </span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={soldPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
        >
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${soldPercentage}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
