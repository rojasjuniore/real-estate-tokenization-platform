'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Property } from './PropertyCard';

export interface PropertyDetails {
  description: string;
  amenities: string[];
  documents: { name: string; url: string }[];
  rentalIncome: string;
  occupancyRate: number;
  propertyManager: string;
}

interface PropertyDetailProps {
  property: Property;
  details: PropertyDetails;
  isLoading?: boolean;
  onBuy?: () => void;
}

export function PropertyDetail({
  property,
  details,
  isLoading = false,
  onBuy,
}: PropertyDetailProps) {
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

  const {
    description,
    amenities,
    documents,
    rentalIncome,
    occupancyRate,
    propertyManager,
  } = details;

  const soldPercentage = Math.round(
    ((totalFractions - availableFractions) / totalFractions) * 100
  );
  const isSoldOut = availableFractions === 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="relative mb-6 aspect-video overflow-hidden rounded-xl">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute left-4 top-4">
              <Badge variant="default">{propertyType}</Badge>
            </div>
          </div>

          {/* Property Info */}
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{name}</h1>
            <p className="text-lg text-gray-600">{location}</p>
          </div>

          {/* Description */}
          <Card className="mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">About this property</h2>
            <p className="text-gray-600">{description}</p>
          </Card>

          {/* Amenities */}
          <Card className="mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <Badge key={amenity} variant="info">
                  {amenity}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Documents */}
          <Card className="mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">Documents</h2>
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.name}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          </Card>

          {/* Property Manager */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Property Manager</h2>
            <p className="text-gray-600">{propertyManager}</p>
          </Card>
        </div>

        {/* Sidebar - Investment Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4 p-6">
            <h2 className="mb-6 text-xl font-semibold">Investment Details</h2>

            {/* Key Metrics */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-sm text-gray-500">Price per Fraction</p>
                <p className="text-2xl font-bold text-green-600">${pricePerFraction}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-sm text-gray-500">Annual Yield</p>
                <p className="text-2xl font-bold text-blue-600">{annualYield}%</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <p className="text-sm text-gray-500">Monthly Income</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${Number(rentalIncome).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 text-center">
                <p className="text-sm text-gray-500">Occupancy Rate</p>
                <p className="text-2xl font-bold text-orange-600">{occupancyRate}%</p>
              </div>
            </div>

            {/* Availability */}
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-500">Fractions Available</span>
                <span className="font-medium">
                  {availableFractions.toLocaleString()} / {totalFractions.toLocaleString()}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={soldPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-3 w-full overflow-hidden rounded-full bg-gray-200"
              >
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${soldPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-gray-500">
                {soldPercentage}% sold
              </p>
            </div>

            {/* Buy Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={onBuy}
              disabled={isSoldOut}
            >
              {isSoldOut ? 'Sold Out' : 'Buy Fractions'}
            </Button>

            {!isSoldOut && (
              <p className="mt-3 text-center text-xs text-gray-500">
                Minimum investment: ${pricePerFraction}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
